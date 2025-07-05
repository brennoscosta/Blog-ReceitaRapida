import {
  users,
  recipes,
  systemSettings,
  type User,
  type InsertUser,
  type Recipe,
  type InsertRecipe,
  type UpdateRecipe,
  type SystemSettings,
  type UpdateSystemSettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations for local authentication
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Recipe operations
  getRecipes(category?: string, subcategory?: string, page?: number, limit?: number): Promise<{ recipes: Recipe[], total: number, totalPages: number, currentPage: number }>;
  getRecipeBySlug(slug: string): Promise<Recipe | undefined>;
  getRecipeById(id: number): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: number, recipe: UpdateRecipe): Promise<Recipe>;
  deleteRecipe(id: number): Promise<void>;
  
  // Search and related recipes
  searchRecipes(query: string): Promise<Recipe[]>;
  getRelatedRecipes(recipe: Recipe): Promise<Recipe[]>;
  
  // Categories
  getCategories(): Promise<{categories: string[], subcategories: {[key: string]: string[]}}>;
  
  // System settings operations
  getSystemSettings(): Promise<SystemSettings>;
  updateSystemSettings(settings: UpdateSystemSettings): Promise<SystemSettings>;
}

export class DatabaseStorage implements IStorage {
  // User operations for local authentication

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Recipe operations
  async getRecipes(category?: string, subcategory?: string, page?: number, limit?: number): Promise<{ recipes: Recipe[], total: number, totalPages: number, currentPage: number }> {
    const currentPage = Math.max(1, page || 1);
    const recordsPerPage = limit || 8;
    const offset = (currentPage - 1) * recordsPerPage;

    let whereConditions = [eq(recipes.published, true)];
    
    if (category) {
      whereConditions.push(eq(recipes.category, category));
    }
    
    if (subcategory) {
      whereConditions.push(eq(recipes.subcategory, subcategory));
    }

    // Buscar total de registros para calcular páginas
    const totalResult = await db.select({ count: sql`count(*)` })
      .from(recipes)
      .where(and(...whereConditions));
    
    const total = Number(totalResult[0].count);
    const totalPages = Math.ceil(total / recordsPerPage);

    // Buscar receitas com paginação
    const paginatedRecipes = await db
      .select()
      .from(recipes)
      .where(and(...whereConditions))
      .orderBy(desc(recipes.createdAt))
      .limit(recordsPerPage)
      .offset(offset);
    
    return {
      recipes: paginatedRecipes,
      total,
      totalPages,
      currentPage
    };
  }

  async getRecipeBySlug(slug: string): Promise<Recipe | undefined> {
    const [recipe] = await db
      .select()
      .from(recipes)
      .where(and(eq(recipes.slug, slug), eq(recipes.published, true)));
    return recipe;
  }

  async getRecipeById(id: number): Promise<Recipe | undefined> {
    const [recipe] = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, id));
    return recipe;
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const [newRecipe] = await db
      .insert(recipes)
      .values(recipe)
      .returning();
    return newRecipe;
  }

  async updateRecipe(id: number, recipe: UpdateRecipe): Promise<Recipe> {
    const [updatedRecipe] = await db
      .update(recipes)
      .set({ ...recipe, updatedAt: new Date() })
      .where(eq(recipes.id, id))
      .returning();
    return updatedRecipe;
  }

  async deleteRecipe(id: number): Promise<void> {
    await db.delete(recipes).where(eq(recipes.id, id));
  }

  // Search and related recipes
  async searchRecipes(query: string): Promise<Recipe[]> {
    const searchResults = await db
      .select()
      .from(recipes)
      .where(
        and(
          eq(recipes.published, true),
          sql`(${recipes.title} ILIKE ${'%' + query + '%'} OR ${recipes.description} ILIKE ${'%' + query + '%'})`
        )
      )
      .orderBy(desc(recipes.createdAt))
      .limit(20);
    
    return searchResults;
  }

  async getRelatedRecipes(recipe: Recipe): Promise<Recipe[]> {
    try {
      // Get all other published recipes and filter by hashtags in JavaScript
      const allRecipes = await db
        .select()
        .from(recipes)
        .where(
          and(
            eq(recipes.published, true),
            sql`${recipes.id} != ${recipe.id}`
          )
        )
        .orderBy(desc(recipes.createdAt));

      if (allRecipes.length === 0) {
        return [];
      }

      // If current recipe has hashtags, find recipes with similar hashtags
      if (recipe.hashtags && Array.isArray(recipe.hashtags) && recipe.hashtags.length > 0) {
        const relatedByHashtags = allRecipes.filter(otherRecipe => {
          if (!otherRecipe.hashtags || !Array.isArray(otherRecipe.hashtags)) {
            return false;
          }
          
          // Check if any hashtag matches
          return (recipe.hashtags as string[]).some((hashtag: string) => 
            (otherRecipe.hashtags as string[]).includes(hashtag)
          );
        });

        if (relatedByHashtags.length > 0) {
          return relatedByHashtags.slice(0, 6);
        }
      }

      // Fallback: return recipes with same difficulty
      const relatedByDifficulty = allRecipes.filter(otherRecipe => 
        otherRecipe.difficulty === recipe.difficulty
      );

      if (relatedByDifficulty.length > 0) {
        return relatedByDifficulty.slice(0, 6);
      }

      // Final fallback: return any other published recipes
      return allRecipes.slice(0, 6);
    } catch (error) {
      console.error("Error in getRelatedRecipes:", error);
      return [];
    }
  }

  async getSystemSettings(): Promise<SystemSettings> {
    const [settings] = await db.select().from(systemSettings).limit(1);
    
    if (!settings) {
      // Create default settings if none exist
      const [newSettings] = await db
        .insert(systemSettings)
        .values({
          autoGenerationEnabled: false,
          generationIntervalMinutes: 60,
        })
        .returning();
      return newSettings;
    }
    
    return settings;
  }

  async updateSystemSettings(settingsData: UpdateSystemSettings): Promise<SystemSettings> {
    const existingSettings = await this.getSystemSettings();
    
    const [updatedSettings] = await db
      .update(systemSettings)
      .set({
        ...settingsData,
        updatedAt: new Date(),
      })
      .where(eq(systemSettings.id, existingSettings.id))
      .returning();
    
    return updatedSettings;
  }

  // Categories
  async getCategories(): Promise<{categories: string[], subcategories: {[key: string]: string[]}}> {
    const allRecipes = await db
      .select({ category: recipes.category, subcategory: recipes.subcategory })
      .from(recipes)
      .where(eq(recipes.published, true));
    
    const categoriesSet = new Set<string>();
    const subcategoriesMap: {[key: string]: Set<string>} = {};
    
    allRecipes.forEach(recipe => {
      categoriesSet.add(recipe.category);
      
      if (!subcategoriesMap[recipe.category]) {
        subcategoriesMap[recipe.category] = new Set();
      }
      subcategoriesMap[recipe.category].add(recipe.subcategory);
    });
    
    const categories = Array.from(categoriesSet).sort();
    const subcategories: {[key: string]: string[]} = {};
    
    Object.keys(subcategoriesMap).forEach(category => {
      subcategories[category] = Array.from(subcategoriesMap[category]).sort();
    });
    
    return { categories, subcategories };
  }
}

export const storage = new DatabaseStorage();
