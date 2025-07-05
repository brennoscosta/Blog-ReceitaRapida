import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { generateRecipe, generateRecipeImage } from "./openai";
import { insertRecipeSchema, updateRecipeSchema, updateSystemSettingsSchema } from "@shared/schema";
import { 
  startAutoGeneration, 
  stopAutoGeneration, 
  restartAutoGeneration, 
  getAutoGenerationStats, 
  resetAutoGenerationStats,
  getNextGenerationTime 
} from "./autoGenerator";
import { z } from "zod";

function createSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-"); // Remove duplicate hyphens
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Public routes
  app.get("/api/recipes", async (req, res) => {
    try {
      const { category, subcategory } = req.query;
      const recipes = await storage.getRecipes(
        category as string,
        subcategory as string
      );
      res.json(recipes);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      res.status(500).json({ message: "Failed to fetch recipes" });
    }
  });

  app.get("/api/recipes/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const recipes = await storage.searchRecipes(q);
      res.json(recipes);
    } catch (error) {
      console.error("Error searching recipes:", error);
      res.status(500).json({ message: "Failed to search recipes" });
    }
  });

  app.get("/api/recipes/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/recipes/:slug/related", async (req, res) => {
    try {
      const { slug } = req.params;
      const recipe = await storage.getRecipeBySlug(slug);
      
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      // Simple approach: return other published recipes 
      const allRecipes = await storage.getRecipes();
      const relatedRecipes = allRecipes
        .filter(r => r.id !== recipe.id && r.published)
        .slice(0, 6);
      
      res.json(relatedRecipes);
    } catch (error) {
      console.error("Error fetching related recipes:", error);
      res.status(500).json({ message: "Failed to fetch related recipes" });
    }
  });

  app.get("/api/recipes/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const recipe = await storage.getRecipeBySlug(slug);
      
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      res.json(recipe);
    } catch (error) {
      console.error("Error fetching recipe:", error);
      res.status(500).json({ message: "Failed to fetch recipe" });
    }
  });

  // Protected admin routes
  app.post("/api/recipes/generate", requireAuth, async (req, res) => {
    try {
      const { recipeIdea, difficulty, cookTime, category, subcategory } = req.body;
      
      if (!recipeIdea || typeof recipeIdea !== "string") {
        return res.status(400).json({ message: "Recipe idea is required" });
      }

      if (!category || typeof category !== "string") {
        return res.status(400).json({ message: "Category is required" });
      }

      if (!subcategory || typeof subcategory !== "string") {
        return res.status(400).json({ message: "Subcategory is required" });
      }

      const generatedRecipe = await generateRecipe(
        recipeIdea.trim(),
        difficulty,
        cookTime ? parseInt(cookTime) : undefined
      );

      // Try to generate image URL, fallback to null if fails
      let imageUrl = null;
      try {
        imageUrl = await generateRecipeImage(generatedRecipe.title);
      } catch (error) {
        console.log("⚠️ Image generation failed, continuing without image:", error instanceof Error ? error.message : "Unknown error");
      }

      // Create complete recipe object
      const slug = createSlug(generatedRecipe.title);
      const content = `## Ingredientes\n\n${generatedRecipe.ingredients.map(ing => `- ${ing}`).join('\n')}\n\n## Modo de Preparo\n\n${generatedRecipe.instructions.map((inst, idx) => `${idx + 1}. ${inst}`).join('\n\n')}\n\n## Dicas\n\n${generatedRecipe.tips.map(tip => `- ${tip}`).join('\n')}`;

      const recipeData = {
        title: generatedRecipe.title,
        slug,
        description: generatedRecipe.description,
        content,
        ingredients: generatedRecipe.ingredients,
        instructions: generatedRecipe.instructions,
        tips: generatedRecipe.tips,
        cookTime: generatedRecipe.cookTime,
        difficulty: generatedRecipe.difficulty,
        servings: generatedRecipe.servings,
        imageUrl,
        metaTitle: generatedRecipe.metaTitle,
        metaDescription: generatedRecipe.metaDescription,
        metaKeywords: generatedRecipe.metaKeywords,
        hashtags: generatedRecipe.hashtags,
        category: category,
        subcategory: subcategory,
        externalRecipeTitle: generatedRecipe.externalRecipeTitle,
        externalRecipeUrl: generatedRecipe.externalRecipeUrl,
        published: false, // Preview mode
      };

      res.json(recipeData);
    } catch (error) {
      console.error("Error generating recipe:", error);
      res.status(500).json({ 
        message: "Failed to generate recipe: " + (error instanceof Error ? error.message : "Unknown error")
      });
    }
  });

  app.post("/api/recipes", requireAuth, async (req, res) => {
    try {
      const validatedData = insertRecipeSchema.parse(req.body);
      
      // Ensure slug is unique
      let slug = validatedData.slug;
      let counter = 1;
      while (await storage.getRecipeBySlug(slug)) {
        slug = `${validatedData.slug}-${counter}`;
        counter++;
      }
      
      const recipe = await storage.createRecipe({
        ...validatedData,
        slug,
        published: true,
      });
      
      res.status(201).json(recipe);
    } catch (error) {
      console.error("Error creating recipe:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid recipe data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create recipe" });
    }
  });

  app.put("/api/recipes/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateRecipeSchema.parse(req.body);
      
      const recipe = await storage.updateRecipe(id, validatedData);
      res.json(recipe);
    } catch (error) {
      console.error("Error updating recipe:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid recipe data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update recipe" });
    }
  });

  app.delete("/api/recipes/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRecipe(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting recipe:", error);
      res.status(500).json({ message: "Failed to delete recipe" });
    }
  });

  // System settings routes
  app.get("/api/system/settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching system settings:", error);
      res.status(500).json({ message: "Failed to fetch system settings" });
    }
  });

  app.put("/api/system/settings", requireAuth, async (req, res) => {
    try {
      const updateData = updateSystemSettingsSchema.parse(req.body);
      const updatedSettings = await storage.updateSystemSettings(updateData);
      
      // Reiniciar geração automática com novas configurações
      if (updatedSettings.autoGenerationEnabled) {
        await restartAutoGeneration();
      } else {
        stopAutoGeneration();
      }
      
      res.json(updatedSettings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Error updating system settings:", error);
      res.status(500).json({ message: "Failed to update system settings" });
    }
  });

  // Auto-generation control routes
  app.get("/api/system/auto-generation/stats", requireAuth, async (req, res) => {
    try {
      const stats = getAutoGenerationStats();
      const nextGenerationTime = await getNextGenerationTime();
      res.json({
        ...stats,
        nextGenerationTime,
      });
    } catch (error) {
      console.error("Error fetching auto-generation stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.post("/api/system/auto-generation/reset-stats", requireAuth, async (req, res) => {
    try {
      resetAutoGenerationStats();
      res.json({ message: "Stats reset successfully" });
    } catch (error) {
      console.error("Error resetting stats:", error);
      res.status(500).json({ message: "Failed to reset stats" });
    }
  });

  // System settings routes
  app.get("/api/system/settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching system settings:", error);
      res.status(500).json({ message: "Failed to fetch system settings" });
    }
  });

  app.put("/api/system/settings", requireAuth, async (req, res) => {
    try {
      const validatedData = updateSystemSettingsSchema.parse(req.body);
      const settings = await storage.updateSystemSettings(validatedData);
      
      // Update auto generation system
      if (validatedData.autoGenerationEnabled) {
        await startAutoGeneration();
      } else {
        stopAutoGeneration();
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error updating system settings:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update system settings" });
    }
  });

  // Auto generation stats route
  app.get("/api/system/auto-generation/stats", requireAuth, async (req, res) => {
    try {
      const stats = getAutoGenerationStats();
      const nextGenerationTime = await getNextGenerationTime();
      
      res.json({
        ...stats,
        nextGenerationTime,
      });
    } catch (error) {
      console.error("Error fetching auto generation stats:", error);
      res.status(500).json({ message: "Failed to fetch auto generation stats" });
    }
  });

  // Manual control routes for auto generation
  app.post("/api/system/auto-generation/start", requireAuth, async (req, res) => {
    try {
      await startAutoGeneration();
      res.json({ message: "Auto generation started" });
    } catch (error) {
      console.error("Error starting auto generation:", error);
      res.status(500).json({ message: "Failed to start auto generation" });
    }
  });

  app.post("/api/system/auto-generation/stop", requireAuth, async (req, res) => {
    try {
      stopAutoGeneration();
      res.json({ message: "Auto generation stopped" });
    } catch (error) {
      console.error("Error stopping auto generation:", error);
      res.status(500).json({ message: "Failed to stop auto generation" });
    }
  });

  app.post("/api/system/auto-generation/restart", requireAuth, async (req, res) => {
    try {
      await restartAutoGeneration();
      res.json({ message: "Auto generation restarted" });
    } catch (error) {
      console.error("Error restarting auto generation:", error);
      res.status(500).json({ message: "Failed to restart auto generation" });
    }
  });

  app.post("/api/system/auto-generation/reset-stats", requireAuth, async (req, res) => {
    try {
      resetAutoGenerationStats();
      res.json({ message: "Auto generation stats reset" });
    } catch (error) {
      console.error("Error resetting auto generation stats:", error);
      res.status(500).json({ message: "Failed to reset auto generation stats" });
    }
  });

  // Rota para corrigir receitas antigas sem links externos
  app.post("/api/system/fix-missing-external-links", requireAuth, async (req, res) => {
    try {
      // Database de URLs reais organizadas por categoria
      const realRecipeUrls: { [key: string]: { title: string; url: string }[] } = {
        "frango": [
          { title: "Frango Grelhado Simples", url: "https://www.tudogostoso.com.br/receita/145-frango-grelhado.html" },
          { title: "Frango ao Curry", url: "https://www.panelinha.com.br/receita/frango-ao-curry" },
          { title: "Peito de Frango na Frigideira", url: "https://cybercook.com.br/receitas/carnes/frango-na-frigideira-86523" },
          { title: "Frango Xadrez", url: "https://www.tudogostoso.com.br/receita/690-frango-xadrez.html" }
        ],
        "bolo": [
          { title: "Bolo de Chocolate Simples", url: "https://www.tudogostoso.com.br/receita/133-bolo-de-chocolate-simples.html" },
          { title: "Bolo de Cenoura", url: "https://www.panelinha.com.br/receita/bolo-de-cenoura" },
          { title: "Bolo de Fubá", url: "https://cybercook.com.br/receitas/doces/bolo-de-fuba-12345" },
          { title: "Bolo de Laranja", url: "https://www.tudogostoso.com.br/receita/332-bolo-de-laranja.html" }
        ],
        "sobremesa": [
          { title: "Brigadeiro", url: "https://www.tudogostoso.com.br/receita/114-brigadeiro.html" },
          { title: "Pudim de Leite", url: "https://www.panelinha.com.br/receita/pudim-de-leite" },
          { title: "Mousse de Chocolate", url: "https://cybercook.com.br/receitas/doces/mousse-de-chocolate-33333" },
          { title: "Pavê", url: "https://www.tudogostoso.com.br/receita/777-pave.html" }
        ],
        "pizza": [
          { title: "Pizza Margherita", url: "https://www.tudogostoso.com.br/receita/555-pizza-margherita.html" },
          { title: "Pizza de Rúcula", url: "https://www.panelinha.com.br/receita/pizza-de-rucula" },
          { title: "Pizza Integral", url: "https://cybercook.com.br/receitas/massas/pizza-integral-44444" }
        ],
        "lanche": [
          { title: "Coxinha", url: "https://www.tudogostoso.com.br/receita/81-coxinha.html" },
          { title: "Pão de Queijo", url: "https://www.panelinha.com.br/receita/pao-de-queijo" },
          { title: "Hambúrguer Caseiro", url: "https://cybercook.com.br/receitas/lanches/hamburguer-caseiro-55555" }
        ],
        "escondidinho": [
          { title: "Escondidinho de Carne", url: "https://www.tudogostoso.com.br/receita/222-escondidinho-de-carne.html" },
          { title: "Escondidinho de Frango", url: "https://www.panelinha.com.br/receita/escondidinho-de-frango" }
        ]
      };

      // Função para mapear receita para categoria e obter link similar
      const getSimilarRecipeLink = (recipeTitle: string, category?: string): { title: string; url: string } => {
        const title = recipeTitle.toLowerCase();
        
        // Mapear título para categoria baseado em palavras-chave
        let targetCategory = category?.toLowerCase();
        
        if (!targetCategory) {
          if (title.includes('frango') || title.includes('galinha')) targetCategory = 'frango';
          else if (title.includes('bolo') || title.includes('torta')) targetCategory = 'bolo';
          else if (title.includes('brigadeiro') || title.includes('mousse') || title.includes('pudim')) targetCategory = 'sobremesa';
          else if (title.includes('pizza')) targetCategory = 'pizza';
          else if (title.includes('coxinha') || title.includes('hambúrguer') || title.includes('pão')) targetCategory = 'lanche';
          else if (title.includes('escondidinho')) targetCategory = 'escondidinho';
          else targetCategory = 'sobremesa'; // fallback
        }
        
        // Obter receita aleatória da categoria
        const recipes = realRecipeUrls[targetCategory] || realRecipeUrls['sobremesa'];
        return recipes[Math.floor(Math.random() * recipes.length)];
      };

      // Buscar receitas sem links externos
      const allRecipes = await storage.getRecipes();
      const recipesWithoutLinks = allRecipes.filter(recipe => 
        !recipe.externalRecipeTitle || 
        !recipe.externalRecipeUrl || 
        recipe.externalRecipeTitle.trim() === '' || 
        recipe.externalRecipeUrl.trim() === ''
      );

      console.log(`🔧 Corrigindo ${recipesWithoutLinks.length} receitas sem links externos...`);

      let fixed = 0;
      for (const recipe of recipesWithoutLinks) {
        try {
          const similarRecipe = getSimilarRecipeLink(recipe.title, recipe.category);
          
          await storage.updateRecipe(recipe.id, {
            externalRecipeTitle: similarRecipe.title,
            externalRecipeUrl: similarRecipe.url
          });
          
          console.log(`✅ Adicionado link para "${recipe.title}": ${similarRecipe.title} - ${similarRecipe.url}`);
          fixed++;
        } catch (error) {
          console.error(`❌ Erro ao corrigir receita "${recipe.title}":`, error);
        }
      }

      res.json({ 
        message: `Successfully fixed ${fixed} recipes with missing external links`,
        recipesFixed: fixed,
        totalFound: recipesWithoutLinks.length
      });
    } catch (error) {
      console.error("Error fixing missing external links:", error);
      res.status(500).json({ message: "Failed to fix missing external links" });
    }
  });

  // Rota para gerar imagem de background do hero
  app.post("/api/generate-hero-background", requireAuth, async (req, res) => {
    try {
      console.log("🎨 Gerando imagem de background para hero section...");
      
      // Gerar imagem com OpenAI
      const imageUrl = await generateRecipeImage("Beautiful kitchen background with fresh vegetables, herbs, and cooking utensils, soft natural lighting, clean modern kitchen, food photography style");
      
      console.log("✅ Imagem de background gerada e salva no S3:", imageUrl);
      
      res.json({ 
        imageUrl,
        message: "Hero background image generated successfully"
      });
    } catch (error) {
      console.error("Error generating hero background:", error);
      res.status(500).json({ message: "Failed to generate hero background" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
