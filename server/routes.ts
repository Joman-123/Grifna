import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserProfileSchema, insertUserIngredientSchema, insertUserFavoriteSchema,
  insertMealPlanSchema, insertCookingSessionSchema, insertRecipeSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // User Profile endpoints
  app.get("/api/profile/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const profile = await storage.getUserProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.post("/api/profile", async (req, res) => {
    try {
      const profileData = insertUserProfileSchema.parse(req.body);
      const profile = await storage.createUserProfile(profileData);
      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid profile data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create profile" });
    }
  });

  app.put("/api/profile/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const profileData = insertUserProfileSchema.partial().parse(req.body);
      const profile = await storage.updateUserProfile(userId, profileData);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid profile data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Recipe endpoints
  app.get("/api/recipes", async (req, res) => {
    try {
      const { ingredients, dietary_restrictions } = req.query;
      let recipes;
      
      if (ingredients) {
        const ingredientList = (ingredients as string).split(',').map(i => i.trim());
        const userId = parseInt(req.query.userId as string) || 1;
        recipes = await storage.getRecipesByIngredients(ingredientList, userId);
      } else if (dietary_restrictions) {
        const restrictions = (dietary_restrictions as string).split(',').map(r => r.trim());
        recipes = await storage.getRecipesByDietaryRestrictions(restrictions);
      } else {
        recipes = await storage.getRecipes();
      }
      
      res.json(recipes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recipes" });
    }
  });

  app.get("/api/recipes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const recipe = await storage.getRecipe(id);
      
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      
      res.json(recipe);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recipe" });
    }
  });

  app.post("/api/recipes", async (req, res) => {
    try {
      const recipeData = insertRecipeSchema.parse(req.body);
      const recipe = await storage.createRecipe(recipeData);
      res.json(recipe);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid recipe data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create recipe" });
    }
  });

  // User Ingredients endpoints
  app.get("/api/ingredients/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const ingredients = await storage.getUserIngredients(userId);
      res.json(ingredients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ingredients" });
    }
  });

  app.post("/api/ingredients", async (req, res) => {
    try {
      const ingredientData = insertUserIngredientSchema.parse(req.body);
      const ingredient = await storage.addUserIngredient(ingredientData);
      res.json(ingredient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid ingredient data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to add ingredient" });
    }
  });

  app.delete("/api/ingredients/:userId/:ingredient", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const ingredient = req.params.ingredient;
      const success = await storage.removeUserIngredient(userId, ingredient);
      
      if (!success) {
        return res.status(404).json({ error: "Ingredient not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove ingredient" });
    }
  });

  // Favorites endpoints
  app.get("/api/favorites/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites", async (req, res) => {
    try {
      const favoriteData = insertUserFavoriteSchema.parse(req.body);
      const favorite = await storage.addUserFavorite(favoriteData);
      res.json(favorite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid favorite data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites/:userId/:recipeId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const recipeId = parseInt(req.params.recipeId);
      const success = await storage.removeUserFavorite(userId, recipeId);
      
      if (!success) {
        return res.status(404).json({ error: "Favorite not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove favorite" });
    }
  });

  // Meal Plan endpoints
  app.get("/api/meal-plan/:userId/:weekStart", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const weekStart = req.params.weekStart;
      const mealPlan = await storage.getUserMealPlan(userId, weekStart);
      
      if (!mealPlan) {
        return res.status(404).json({ error: "Meal plan not found" });
      }
      
      res.json(mealPlan);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch meal plan" });
    }
  });

  app.post("/api/meal-plan", async (req, res) => {
    try {
      const mealPlanData = insertMealPlanSchema.parse(req.body);
      const mealPlan = await storage.createMealPlan(mealPlanData);
      res.json(mealPlan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid meal plan data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create meal plan" });
    }
  });

  app.put("/api/meal-plan/:userId/:weekStart", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const weekStart = req.params.weekStart;
      const { meals } = req.body;
      
      const mealPlan = await storage.updateMealPlan(userId, weekStart, meals);
      
      if (!mealPlan) {
        return res.status(404).json({ error: "Meal plan not found" });
      }
      
      res.json(mealPlan);
    } catch (error) {
      res.status(500).json({ error: "Failed to update meal plan" });
    }
  });

  // Cooking Session endpoints
  app.post("/api/cooking-session", async (req, res) => {
    try {
      const sessionData = insertCookingSessionSchema.parse(req.body);
      const session = await storage.createCookingSession(sessionData);
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid session data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create cooking session" });
    }
  });

  app.put("/api/cooking-session/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const session = await storage.updateCookingSession(id, updates);
      
      if (!session) {
        return res.status(404).json({ error: "Cooking session not found" });
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to update cooking session" });
    }
  });

  app.get("/api/cooking-sessions/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const sessions = await storage.getUserCookingSessions(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cooking sessions" });
    }
  });

  // Generate recipes based on ingredients with premium limits
  app.post("/api/recipes/generate", async (req, res) => {
    try {
      const { userId, ingredients, dietaryRestrictions, cookingLevel } = req.body;
      
      // Check user subscription and recipe limits
      const userProfile = await storage.getUserProfile(userId);
      if (userProfile) {
        const today = new Date().toISOString().split('T')[0];
        const lastReset = userProfile.lastRecipeReset ? new Date(userProfile.lastRecipeReset).toISOString().split('T')[0] : null;
        
        // Reset daily count if it's a new day
        if (lastReset !== today) {
          await storage.updateUserProfile(userId, {
            recipesGenerated: 0,
            lastRecipeReset: new Date()
          });
          userProfile.recipesGenerated = 0;
        }
        
        // Check limits based on subscription
        const limits = {
          free: 3,
          premium: 50,
          family: 100
        };
        
        const dailyLimit = limits[userProfile.subscriptionType as keyof typeof limits] || 3;
        
        if (userProfile.recipesGenerated >= dailyLimit) {
          return res.status(429).json({ 
            error: "Daily recipe limit reached", 
            limit: dailyLimit,
            subscriptionType: userProfile.subscriptionType,
            upgradeRequired: userProfile.subscriptionType === 'free'
          });
        }
        
        // Increment recipe count
        await storage.updateUserProfile(userId, {
          recipesGenerated: userProfile.recipesGenerated + 1
        });
      }
      
      let recipes = await storage.getRecipes();
      
      // Filter by ingredients if provided
      if (ingredients && ingredients.length > 0) {
        recipes = recipes.filter(recipe => {
          const matchCount = recipe.ingredients.filter(ingredient =>
            ingredients.some((userIngredient: string) =>
              ingredient.toLowerCase().includes(userIngredient.toLowerCase()) ||
              userIngredient.toLowerCase().includes(ingredient.toLowerCase())
            )
          ).length;
          return matchCount >= Math.ceil(recipe.ingredients.length * 0.5);
        });
      }
      
      // Filter by dietary restrictions
      if (dietaryRestrictions && dietaryRestrictions.length > 0) {
        recipes = recipes.filter(recipe =>
          dietaryRestrictions.some((restriction: string) => recipe.tags.includes(restriction))
        );
      }
      
      // Filter by cooking level
      if (cookingLevel) {
        const skillLevels: { [key: string]: number } = { beginner: 1, intermediate: 2, advanced: 3 };
        const difficultyLevels: { [key: string]: number } = { easy: 1, medium: 2, hard: 3 };
        const userSkillLevel = skillLevels[cookingLevel] || 1;
        
        recipes = recipes.filter(recipe => 
          difficultyLevels[recipe.difficulty] <= userSkillLevel
        );
      }
      
      // Premium users get more recipe results
      const recipeLimit = userProfile?.subscriptionType === 'free' ? 6 : 12;
      recipes = recipes.slice(0, recipeLimit);
      
      res.json(recipes);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate recipes" });
    }
  });

  // Generate meal plan
  app.post("/api/meal-plan/generate", async (req, res) => {
    try {
      const { userId, weekStart, preferences } = req.body;
      
      const allRecipes = await storage.getRecipes();
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const meals: { [key: string]: any } = {};
      
      days.forEach(day => {
        const dayRecipes = [...allRecipes].sort(() => 0.5 - Math.random()).slice(0, 2);
        meals[day] = {
          breakfast: { name: 'Healthy Smoothie Bowl', time: 10, calories: 280 },
          lunch: dayRecipes[0] || null,
          dinner: dayRecipes[1] || null
        };
      });
      
      const mealPlan = await storage.createMealPlan({
        userId,
        weekStart,
        meals
      });
      
      res.json(mealPlan);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate meal plan" });
    }
  });

  // Get shopping list from meal plan
  app.get("/api/shopping-list/:userId/:weekStart", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const weekStart = req.params.weekStart;
      
      const mealPlan = await storage.getUserMealPlan(userId, weekStart);
      const userIngredients = await storage.getUserIngredients(userId);
      
      if (!mealPlan) {
        return res.status(404).json({ error: "Meal plan not found" });
      }
      
      const allIngredients = new Set<string>();
      const userIngredientNames = userIngredients.map(ing => ing.ingredient.toLowerCase());
      
      // Extract ingredients from meal plan
      if (mealPlan.meals && typeof mealPlan.meals === 'object') {
        Object.values(mealPlan.meals as Record<string, any>).forEach((dayMeals: any) => {
          if (dayMeals && typeof dayMeals === 'object') {
            ['lunch', 'dinner'].forEach(mealType => {
              const meal = dayMeals[mealType];
              if (meal && meal.ingredients && Array.isArray(meal.ingredients)) {
                meal.ingredients.forEach((ingredient: string) => allIngredients.add(ingredient));
              }
            });
          }
        });
      }
      
      // Filter out ingredients user already has
      const missingIngredients = Array.from(allIngredients).filter(ingredient =>
        !userIngredientNames.some(userIngredient =>
          userIngredient.includes(ingredient.toLowerCase()) ||
          ingredient.toLowerCase().includes(userIngredient)
        )
      );
      
      res.json({ ingredients: missingIngredients });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate shopping list" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
