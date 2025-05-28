import { users, userProfiles, recipes, userIngredients, userFavorites, mealPlans, cookingSessions, userAchievements, type User, type InsertUser, type UserProfile, type InsertUserProfile, type Recipe, type InsertRecipe, type UserIngredient, type InsertUserIngredient, type UserFavorite, type InsertUserFavorite, type MealPlan, type InsertMealPlan, type CookingSession, type InsertCookingSession, type UserAchievement, type InsertUserAchievement } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // User profiles
  getUserProfile(userId: number): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: number, profile: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;
  
  // Recipes
  getRecipes(): Promise<Recipe[]>;
  getRecipe(id: number): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  getRecipesByIngredients(ingredients: string[], userId: number): Promise<Recipe[]>;
  getRecipesByDietaryRestrictions(restrictions: string[]): Promise<Recipe[]>;
  
  // User ingredients
  getUserIngredients(userId: number): Promise<UserIngredient[]>;
  addUserIngredient(ingredient: InsertUserIngredient): Promise<UserIngredient>;
  removeUserIngredient(userId: number, ingredient: string): Promise<boolean>;
  
  // Favorites
  getUserFavorites(userId: number): Promise<UserFavorite[]>;
  addUserFavorite(favorite: InsertUserFavorite): Promise<UserFavorite>;
  removeUserFavorite(userId: number, recipeId: number): Promise<boolean>;
  
  // Meal plans
  getUserMealPlan(userId: number, weekStart: string): Promise<MealPlan | undefined>;
  createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan>;
  updateMealPlan(userId: number, weekStart: string, meals: any): Promise<MealPlan | undefined>;
  
  // Cooking sessions
  createCookingSession(session: InsertCookingSession): Promise<CookingSession>;
  updateCookingSession(id: number, updates: Partial<InsertCookingSession>): Promise<CookingSession | undefined>;
  getUserCookingSessions(userId: number): Promise<CookingSession[]>;
  
  // Achievements
  getUserAchievements(userId: number): Promise<UserAchievement[]>;
  addUserAchievement(achievement: InsertUserAchievement): Promise<UserAchievement>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile || undefined;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [userProfile] = await db
      .insert(userProfiles)
      .values(profile)
      .returning();
    return userProfile;
  }

  async updateUserProfile(userId: number, profile: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const [updated] = await db
      .update(userProfiles)
      .set(profile)
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updated || undefined;
  }

  async getRecipes(): Promise<Recipe[]> {
    return await db.select().from(recipes);
  }

  async getRecipe(id: number): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    return recipe || undefined;
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const [newRecipe] = await db
      .insert(recipes)
      .values(recipe)
      .returning();
    return newRecipe;
  }

  async getRecipesByIngredients(ingredients: string[], userId: number): Promise<Recipe[]> {
    const allRecipes = await db.select().from(recipes);
    return allRecipes.filter(recipe => 
      ingredients.some(ing => 
        recipe.ingredients.some(recipeIng => 
          recipeIng.toLowerCase().includes(ing.toLowerCase())
        )
      )
    );
  }

  async getRecipesByDietaryRestrictions(restrictions: string[]): Promise<Recipe[]> {
    const allRecipes = await db.select().from(recipes);
    return allRecipes.filter(recipe => 
      restrictions.every(restriction => 
        recipe.tags.includes(restriction.toLowerCase()) ||
        !recipe.tags.some(tag => tag.includes('no-' + restriction.toLowerCase()))
      )
    );
  }

  async getUserIngredients(userId: number): Promise<UserIngredient[]> {
    return await db.select().from(userIngredients).where(eq(userIngredients.userId, userId));
  }

  async addUserIngredient(ingredient: InsertUserIngredient): Promise<UserIngredient> {
    const [newIngredient] = await db
      .insert(userIngredients)
      .values(ingredient)
      .returning();
    return newIngredient;
  }

  async removeUserIngredient(userId: number, ingredient: string): Promise<boolean> {
    const result = await db
      .delete(userIngredients)
      .where(and(
        eq(userIngredients.userId, userId),
        eq(userIngredients.ingredient, ingredient)
      ));
    return result.rowCount > 0;
  }

  async getUserFavorites(userId: number): Promise<UserFavorite[]> {
    return await db.select().from(userFavorites).where(eq(userFavorites.userId, userId));
  }

  async addUserFavorite(favorite: InsertUserFavorite): Promise<UserFavorite> {
    const [newFavorite] = await db
      .insert(userFavorites)
      .values(favorite)
      .returning();
    return newFavorite;
  }

  async removeUserFavorite(userId: number, recipeId: number): Promise<boolean> {
    const result = await db
      .delete(userFavorites)
      .where(and(
        eq(userFavorites.userId, userId),
        eq(userFavorites.recipeId, recipeId)
      ));
    return result.rowCount > 0;
  }

  async getUserMealPlan(userId: number, weekStart: string): Promise<MealPlan | undefined> {
    const [mealPlan] = await db
      .select()
      .from(mealPlans)
      .where(and(
        eq(mealPlans.userId, userId),
        eq(mealPlans.weekStart, weekStart)
      ));
    return mealPlan || undefined;
  }

  async createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan> {
    const [newMealPlan] = await db
      .insert(mealPlans)
      .values(mealPlan)
      .returning();
    return newMealPlan;
  }

  async updateMealPlan(userId: number, weekStart: string, meals: any): Promise<MealPlan | undefined> {
    const [updated] = await db
      .update(mealPlans)
      .set({ meals })
      .where(and(
        eq(mealPlans.userId, userId),
        eq(mealPlans.weekStart, weekStart)
      ))
      .returning();
    return updated || undefined;
  }

  async createCookingSession(session: InsertCookingSession): Promise<CookingSession> {
    const [newSession] = await db
      .insert(cookingSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async updateCookingSession(id: number, updates: Partial<InsertCookingSession>): Promise<CookingSession | undefined> {
    const [updated] = await db
      .update(cookingSessions)
      .set(updates)
      .where(eq(cookingSessions.id, id))
      .returning();
    return updated || undefined;
  }

  async getUserCookingSessions(userId: number): Promise<CookingSession[]> {
    return await db.select().from(cookingSessions).where(eq(cookingSessions.userId, userId));
  }

  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    return await db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
  }

  async addUserAchievement(achievement: InsertUserAchievement): Promise<UserAchievement> {
    const [newAchievement] = await db
      .insert(userAchievements)
      .values(achievement)
      .returning();
    return newAchievement;
  }
}

export const storage = new DatabaseStorage();