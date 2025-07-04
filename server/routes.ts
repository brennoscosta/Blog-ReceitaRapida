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
import { S3ImageService } from "./s3Service";
import multer from "multer";
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

// Configuração do multer para upload de imagens
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens JPEG, PNG e WebP são permitidas'));
    }
  }
});

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
      const { recipeIdea, difficulty, cookTime } = req.body;
      
      if (!recipeIdea || typeof recipeIdea !== "string") {
        return res.status(400).json({ message: "Recipe idea is required" });
      }

      const generatedRecipe = await generateRecipe(
        recipeIdea.trim(),
        difficulty,
        cookTime ? parseInt(cookTime) : undefined
      );

      // Generate image URL
      const imageUrl = await generateRecipeImage(generatedRecipe.title);

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

  // Upload de imagem para S3
  app.post("/api/admin/upload-image", requireAuth, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhuma imagem foi enviada" });
      }

      const imageUrl = await S3ImageService.uploadImage(
        req.file.buffer,
        req.file.originalname,
        {
          width: 1024,
          height: 768,
          quality: 90
        }
      );

      res.status(200).json({ 
        message: "Imagem enviada com sucesso",
        imageUrl 
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: "Erro ao fazer upload da imagem" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
