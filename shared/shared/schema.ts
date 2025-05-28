import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  dietaryRestrictions: text("dietary_restrictions").array().notNull().default([]),
  cookingLevel: text("cooking_level").notNull().default("beginner"),
  familySize: integer("family_size").notNull().default(2),
  preferences: jsonb("preferences").notNull().default({}),
  allergies: text("allergies").array().notNull().default([]),
  subscriptionType: text("subscription_type").notNull().default("free"), // free, premium, family
  recipesGenerated: integer("recipes_generated").notNull().default(0),
  lastRecipeReset: timestamp("last_recipe_reset").defaultNow(),
});

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cuisine: text("cuisine").notNull(),
  time: integer("time").notNull(), // in minutes
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  servings: integer("servings").notNull(),
  ingredients: text("ingredients").array().notNull(),
  instructions: text("instructions").array().notNull(),
  nutrition: jsonb("nutrition").notNull(), // calories, protein, carbs, fat
  rating: integer("rating").notNull().default(0), // 0-5 stars * 10 for decimals
  tags: text("tags").array().notNull().default([]),
  tips: text("tips").array().notNull().default([]),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userIngredients = pgTable("user_ingredients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  ingredient: text("ingredient").notNull(),
  category: text("category").notNull().default("other"), // vegetables, proteins, staples, etc.
  addedAt: timestamp("added_at").defaultNow(),
});

export const userFavorites = pgTable("user_favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  recipeId: integer("recipe_id").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  weekStart: text("week_start").notNull(), // YYYY-MM-DD format
  meals: jsonb("meals").notNull(), // day -> meal type -> recipe data
  createdAt: timestamp("created_at").defaultNow(),
});

export const cookingSessions = pgTable("cooking_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  recipeId: integer("recipe_id").notNull(),
  status: text("status").notNull().default("in_progress"), // in_progress, completed, abandoned
  currentStep: integer("current_step").notNull().default(0),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  achievementType: text("achievement_type").notNull(),
  achievementData: jsonb("achievement_data").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

export const nutritionTracking = pgTable("nutrition_tracking", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  totalCalories: integer("total_calories").notNull().default(0),
  totalProtein: integer("total_protein").notNull().default(0),
  totalCarbs: integer("total_carbs").notNull().default(0),
  totalFat: integer("total_fat").notNull().default(0),
  mealsEaten: jsonb("meals_eaten").notNull().default([]),
});

export const premiumFeatures = pgTable("premium_features", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  feature: text("feature").notNull(), // unlimited_recipes, advanced_nutrition, meal_planning, etc.
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
});

export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  createdAt: true,
});

export const insertUserIngredientSchema = createInsertSchema(userIngredients).omit({
  id: true,
  addedAt: true,
});

export const insertUserFavoriteSchema = createInsertSchema(userFavorites).omit({
  id: true,
  addedAt: true,
});

export const insertMealPlanSchema = createInsertSchema(mealPlans).omit({
  id: true,
  createdAt: true,
});

export const insertCookingSessionSchema = createInsertSchema(cookingSessions).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  unlockedAt: true,
});

export const insertNutritionTrackingSchema = createInsertSchema(nutritionTracking).omit({
  id: true,
});

export const insertPremiumFeatureSchema = createInsertSchema(premiumFeatures).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;

export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipes.$inferSelect;

export type InsertUserIngredient = z.infer<typeof insertUserIngredientSchema>;
export type UserIngredient = typeof userIngredients.$inferSelect;

export type InsertUserFavorite = z.infer<typeof insertUserFavoriteSchema>;
export type UserFavorite = typeof userFavorites.$inferSelect;

export type InsertMealPlan = z.infer<typeof insertMealPlanSchema>;
export type MealPlan = typeof mealPlans.$inferSelect;

export type InsertCookingSession = z.infer<typeof insertCookingSessionSchema>;
export type CookingSession = typeof cookingSessions.$inferSelect;

export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;

export type InsertNutritionTracking = z.infer<typeof insertNutritionTrackingSchema>;
export type NutritionTracking = typeof nutritionTracking.$inferSelect;

export type InsertPremiumFeature = z.infer<typeof insertPremiumFeatureSchema>;
export type PremiumFeature = typeof premiumFeatures.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  ingredients: many(userIngredients),
  favorites: many(userFavorites),
  mealPlans: many(mealPlans),
  cookingSessions: many(cookingSessions),
  achievements: many(userAchievements),
  nutritionTracking: many(nutritionTracking),
  premiumFeatures: many(premiumFeatures),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const recipesRelations = relations(recipes, ({ many }) => ({
  favorites: many(userFavorites),
  cookingSessions: many(cookingSessions),
}));

export const userIngredientsRelations = relations(userIngredients, ({ one }) => ({
  user: one(users, {
    fields: [userIngredients.userId],
    references: [users.id],
  }),
}));

export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  user: one(users, {
    fields: [userFavorites.userId],
    references: [users.id],
  }),
  recipe: one(recipes, {
    fields: [userFavorites.recipeId],
    references: [recipes.id],
  }),
}));

export const mealPlansRelations = relations(mealPlans, ({ one }) => ({
  user: one(users, {
    fields: [mealPlans.userId],
    references: [users.id],
  }),
}));

export const cookingSessionsRelations = relations(cookingSessions, ({ one }) => ({
  user: one(users, {
    fields: [cookingSessions.userId],
    references: [users.id],
  }),
  recipe: one(recipes, {
    fields: [cookingSessions.recipeId],
    references: [recipes.id],
  }),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
}));

export const nutritionTrackingRelations = relations(nutritionTracking, ({ one }) => ({
  user: one(users, {
    fields: [nutritionTracking.userId],
    references: [users.id],
  }),
}));

export const premiumFeaturesRelations = relations(premiumFeatures, ({ one }) => ({
  user: one(users, {
    fields: [premiumFeatures.userId],
    references: [users.id],
  }),
}));
