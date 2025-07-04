import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { generateRecipe, generateRecipeImage } from "./openai";
import { insertRecipeSchema, updateRecipeSchema } from "@shared/schema";
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
      const recipes = await storage.getRecipes();
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

  const httpServer = createServer(app);
  return httpServer;
}
