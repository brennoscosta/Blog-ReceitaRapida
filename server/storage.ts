import {
  users,
  recipes,
  type User,
  type InsertUser,
  type Recipe,
  type InsertRecipe,
  type UpdateRecipe,
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
  getRecipes(): Promise<Recipe[]>;
  getRecipeBySlug(slug: string): Promise<Recipe | undefined>;
  getRecipeById(id: number): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: number, recipe: UpdateRecipe): Promise<Recipe>;
  deleteRecipe(id: number): Promise<void>;
  
  // Search and related recipes
  searchRecipes(query: string): Promise<Recipe[]>;
  getRelatedRecipes(recipe: Recipe): Promise<Recipe[]>;
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
  async getRecipes(): Promise<Recipe[]> {
    return await db
      .select()
      .from(recipes)
      .where(eq(recipes.published, true))
      .orderBy(desc(recipes.createdAt));
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
    const hashtags = Array.isArray(recipe.hashtags) ? recipe.hashtags : [];
    
    if (hashtags.length === 0) {
      // If no hashtags, return recipes with same difficulty
      const relatedRecipes = await db
        .select()
        .from(recipes)
        .where(
          and(
            eq(recipes.published, true),
            eq(recipes.difficulty, recipe.difficulty),
            sql`${recipes.id} != ${recipe.id}`
          )
        )
        .orderBy(desc(recipes.createdAt))
        .limit(6);
      
      return relatedRecipes;
    }

    // Find recipes with similar hashtags
    const relatedRecipes = await db
      .select()
      .from(recipes)
      .where(
        and(
          eq(recipes.published, true),
          sql`${recipes.id} != ${recipe.id}`,
          sql`EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(${recipes.hashtags}) AS hashtag
            WHERE hashtag = ANY(${hashtags})
          )`
        )
      )
      .orderBy(desc(recipes.createdAt))
      .limit(6);

    return relatedRecipes;
  }
}

export const storage = new DatabaseStorage();
