import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, Users, Heart, Star, Plus, Minus, Search, Filter, Camera, ShoppingCart, Calendar, Trophy, Leaf, AlertCircle, CheckCircle2, X, Home, Package, User, Play, Sparkles, CalendarCheck, PlayCircle, Sunrise, Sun, Moon, Flame, Beef, Wheat, Droplets, ChevronLeft, ChevronRight, Timer, Bell, Carrot, Crown, Zap, TrendingUp, BarChart3, Activity } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Recipe, UserProfile, UserIngredient, UserFavorite, MealPlan, CookingSession } from '@shared/schema';

const SmartRecipeApp = () => {
  const [currentView, setCurrentView] = useState('home');
  const [currentUserId] = useState(1); // Mock user ID
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({
    name: '',
    dietaryRestrictions: [],
    cookingLevel: 'beginner',
    preferences: {},
    allergies: [],
    familySize: 2
  });
  const [cookingMode, setCookingMode] = useState<{
    recipeId: number;
    currentStep: number;
    isActive: boolean;
  } | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes default
  const [dailyNutrition, setDailyNutrition] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    goal: { calories: 2000, protein: 150, carbs: 250, fat: 65 }
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch recipes
  const { data: recipes = [], isLoading: recipesLoading } = useQuery({
    queryKey: ['/api/recipes'],
  });

  // Fetch user ingredients
  const { data: userIngredients = [] } = useQuery({
    queryKey: [`/api/ingredients/${currentUserId}`],
  });

  // Fetch user favorites
  const { data: userFavorites = [] } = useQuery({
    queryKey: [`/api/favorites/${currentUserId}`],
  });

  // Fetch user profile
  const { data: profileData } = useQuery({
    queryKey: [`/api/profile/${currentUserId}`],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/profile/${currentUserId}`);
        if (response.status === 404) return null;
        if (!response.ok) throw new Error('Failed to fetch profile');
        return response.json();
      } catch (error) {
        return null;
      }
    }
  });

  // Update user profile when data is fetched
  useEffect(() => {
    if (profileData) {
      setUserProfile(profileData);
    }
  }, [profileData]);

  // Mutations
  const createProfileMutation = useMutation({
    mutationFn: async (profile: any) => {
      const response = await apiRequest('POST', '/api/profile', profile);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/profile/${currentUserId}`] });
      toast({ title: "Profile created successfully!" });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profile: any) => {
      const response = await apiRequest('PUT', `/api/profile/${currentUserId}`, profile);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/profile/${currentUserId}`] });
      toast({ title: "Profile updated successfully!" });
    },
  });

  const addIngredientMutation = useMutation({
    mutationFn: async (ingredient: { ingredient: string; category: string }) => {
      const response = await apiRequest('POST', '/api/ingredients', {
        userId: currentUserId,
        ...ingredient
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ingredients/${currentUserId}`] });
    },
  });

  const removeIngredientMutation = useMutation({
    mutationFn: async (ingredient: string) => {
      const response = await apiRequest('DELETE', `/api/ingredients/${currentUserId}/${encodeURIComponent(ingredient)}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ingredients/${currentUserId}`] });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ recipeId, isAdding }: { recipeId: number; isAdding: boolean }) => {
      if (isAdding) {
        const response = await apiRequest('POST', '/api/favorites', {
          userId: currentUserId,
          recipeId
        });
        return response.json();
      } else {
        const response = await apiRequest('DELETE', `/api/favorites/${currentUserId}/${recipeId}`);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${currentUserId}`] });
    },
  });

  const generateRecipesMutation = useMutation({
    mutationFn: async () => {
      const ingredients = (userIngredients as UserIngredient[]).map((ing: UserIngredient) => ing.ingredient);
      const response = await apiRequest('POST', '/api/recipes/generate', {
        userId: currentUserId,
        ingredients,
        dietaryRestrictions: userProfile.dietaryRestrictions,
        cookingLevel: userProfile.cookingLevel
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/recipes'], data);
      toast({ title: `Generated ${data.length} recipes based on your pantry!` });
    },
    onError: (error: any) => {
      if (error.status === 429) {
        setShowUpgradeModal(true);
        toast({ 
          title: "Daily limit reached!", 
          description: "Upgrade to Premium for unlimited recipes",
          variant: "destructive"
        });
      }
    },
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
      toast({ title: "Timer finished!" });
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, toast]);

  // Helper functions
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const categorizeIngredient = (ingredient: string): string => {
    const vegetables = ['tomato', 'cucumber', 'onion', 'carrot', 'pepper', 'lettuce'];
    const proteins = ['chicken', 'beef', 'fish', 'cheese', 'egg', 'tofu'];
    
    if (vegetables.some(v => ingredient.toLowerCase().includes(v))) return 'vegetables';
    if (proteins.some(p => ingredient.toLowerCase().includes(p))) return 'proteins';
    return 'staples';
  };

  const isRecipeFavorited = (recipeId: number) => {
    return (userFavorites as UserFavorite[]).some((fav: UserFavorite) => fav.recipeId === recipeId);
  };

  const handleAddIngredient = (ingredient: string) => {
    if (ingredient.trim() && !(userIngredients as UserIngredient[]).some((ing: UserIngredient) => 
      ing.ingredient.toLowerCase() === ingredient.toLowerCase())) {
      const category = categorizeIngredient(ingredient);
      addIngredientMutation.mutate({ ingredient: ingredient.trim(), category });
      toast({ title: `Added ${ingredient} to your pantry!` });
    }
  };

  const handleRemoveIngredient = (ingredient: string) => {
    removeIngredientMutation.mutate(ingredient);
    toast({ title: `Removed ${ingredient} from your pantry!` });
  };

  const handleToggleFavorite = (recipeId: number) => {
    const isCurrentlyFavorited = isRecipeFavorited(recipeId);
    toggleFavoriteMutation.mutate({ 
      recipeId, 
      isAdding: !isCurrentlyFavorited 
    });
    toast({ 
      title: isCurrentlyFavorited ? "Removed from favorites!" : "Added to favorites!" 
    });
  };

  const handleSaveProfile = () => {
    const profileData = {
      userId: currentUserId,
      name: userProfile.name || '',
      dietaryRestrictions: userProfile.dietaryRestrictions || [],
      cookingLevel: userProfile.cookingLevel || 'beginner',
      familySize: userProfile.familySize || 2,
      preferences: userProfile.preferences || {},
      allergies: userProfile.allergies || []
    };

    if (profileData.name) {
      updateProfileMutation.mutate(profileData);
    } else {
      createProfileMutation.mutate(profileData);
    }
  };

  const startCookingMode = (recipeId: number) => {
    setCookingMode({
      recipeId,
      currentStep: 0,
      isActive: true
    });
    setShowRecipeModal(false);
    toast({ title: "Cooking mode activated!" });
  };

  const stopCookingMode = () => {
    setCookingMode(null);
    setTimerActive(false);
    setTimeLeft(300);
  };

  const nextStep = () => {
    if (cookingMode && selectedRecipe) {
      const nextStepIndex = cookingMode.currentStep + 1;
      if (nextStepIndex < selectedRecipe.instructions.length) {
        setCookingMode({
          ...cookingMode,
          currentStep: nextStepIndex
        });
      } else {
        toast({ title: "Recipe completed! Well done!" });
        stopCookingMode();
      }
    }
  };

  const previousStep = () => {
    if (cookingMode && cookingMode.currentStep > 0) {
      setCookingMode({
        ...cookingMode,
        currentStep: cookingMode.currentStep - 1
      });
    }
  };

  const toggleTimer = () => {
    setTimerActive(!timerActive);
    if (!timerActive) {
      setTimeLeft(300); // Reset to 5 minutes
    }
  };

  // Get current recipe for cooking mode
  const currentRecipe = cookingMode ? (recipes as Recipe[]).find((r: Recipe) => r.id === cookingMode.recipeId) : null;

  // Premium Upgrade Modal Component
  const PremiumUpgradeModal = () => (
    showUpgradeModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 animate-slide-up">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Upgrade to Premium</h2>
            <p className="text-gray-600 mb-6">Unlock unlimited recipes, advanced meal planning, and nutrition tracking</p>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center text-left">
                <Zap className="w-5 h-5 text-orange-500 mr-3" />
                <span className="text-gray-700">Unlimited daily recipe generation</span>
              </div>
              <div className="flex items-center text-left">
                <Calendar className="w-5 h-5 text-orange-500 mr-3" />
                <span className="text-gray-700">Advanced meal planning & shopping lists</span>
              </div>
              <div className="flex items-center text-left">
                <BarChart3 className="w-5 h-5 text-orange-500 mr-3" />
                <span className="text-gray-700">Detailed nutrition tracking & analytics</span>
              </div>
              <div className="flex items-center text-left">
                <Trophy className="w-5 h-5 text-orange-500 mr-3" />
                <span className="text-gray-700">Priority customer support</span>
              </div>
            </div>

            <div className="space-y-3">
              <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all">
                Upgrade to Premium - $9.99/month
              </button>
              <button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all">
                Family Plan - $14.99/month
              </button>
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="w-full text-gray-500 py-2 hover:text-gray-700 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  // Nutrition Dashboard Component
  const NutritionDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Nutrition Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-green-500" />
          <span className="text-sm font-medium text-gray-600">
            {userProfile.subscriptionType === 'free' ? 'Upgrade for detailed tracking' : 'Premium Active'}
          </span>
        </div>
      </div>

      {userProfile.subscriptionType === 'free' ? (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6 text-center">
          <Crown className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium Nutrition Tracking</h3>
          <p className="text-gray-600 mb-4">Get detailed nutrition analytics, meal tracking, and personalized recommendations</p>
          <button 
            onClick={() => setShowUpgradeModal(true)}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all"
          >
            Upgrade Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Flame className="w-6 h-6 text-red-500 mr-2" />
                <span className="font-semibold text-gray-700">Calories</span>
              </div>
              <span className="text-sm text-gray-500">{Math.round((dailyNutrition.calories / dailyNutrition.goal.calories) * 100)}%</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-2xl font-bold text-gray-900">{dailyNutrition.calories}</span>
                <span className="text-sm text-gray-500">/ {dailyNutrition.goal.calories}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((dailyNutrition.calories / dailyNutrition.goal.calories) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Beef className="w-6 h-6 text-blue-500 mr-2" />
                <span className="font-semibold text-gray-700">Protein</span>
              </div>
              <span className="text-sm text-gray-500">{Math.round((dailyNutrition.protein / dailyNutrition.goal.protein) * 100)}%</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-2xl font-bold text-gray-900">{dailyNutrition.protein}g</span>
                <span className="text-sm text-gray-500">/ {dailyNutrition.goal.protein}g</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((dailyNutrition.protein / dailyNutrition.goal.protein) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Wheat className="w-6 h-6 text-yellow-500 mr-2" />
                <span className="font-semibold text-gray-700">Carbs</span>
              </div>
              <span className="text-sm text-gray-500">{Math.round((dailyNutrition.carbs / dailyNutrition.goal.carbs) * 100)}%</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-2xl font-bold text-gray-900">{dailyNutrition.carbs}g</span>
                <span className="text-sm text-gray-500">/ {dailyNutrition.goal.carbs}g</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((dailyNutrition.carbs / dailyNutrition.goal.carbs) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Droplets className="w-6 h-6 text-green-500 mr-2" />
                <span className="font-semibold text-gray-700">Fat</span>
              </div>
              <span className="text-sm text-gray-500">{Math.round((dailyNutrition.fat / dailyNutrition.goal.fat) * 100)}%</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-2xl font-bold text-gray-900">{dailyNutrition.fat}g</span>
                <span className="text-sm text-gray-500">/ {dailyNutrition.goal.fat}g</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((dailyNutrition.fat / dailyNutrition.goal.fat) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Meals</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Sunrise className="w-5 h-5 text-yellow-500 mr-3" />
                <span className="font-medium">Breakfast</span>
              </div>
              <span className="text-sm text-gray-500">280 cal</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Sun className="w-5 h-5 text-orange-500 mr-3" />
                <span className="font-medium">Lunch</span>
              </div>
              <span className="text-sm text-gray-500">420 cal</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Moon className="w-5 h-5 text-blue-500 mr-3" />
                <span className="font-medium">Dinner</span>
              </div>
              <span className="text-sm text-gray-500">480 cal</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Progress</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg. Daily Calories</span>
              <span className="font-semibold">1,850</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Meals Cooked</span>
              <span className="font-semibold">12</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Recipes Tried</span>
              <span className="font-semibold">8</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Health Score</span>
              <div className="flex items-center">
                <span className="font-semibold text-green-600 mr-2">85%</span>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Component for Navigation
  const Navigation = () => (
    <>
      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
        <div className="flex justify-around py-2">
          <button 
            onClick={() => setCurrentView('home')} 
            className={`flex flex-col items-center py-2 px-4 ${currentView === 'home' ? 'text-orange-500' : 'text-gray-400'}`}
          >
            <Home className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button 
            onClick={() => setCurrentView('ingredients')} 
            className={`flex flex-col items-center py-2 px-4 ${currentView === 'ingredients' ? 'text-orange-500' : 'text-gray-400'}`}
          >
            <Package className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Pantry</span>
          </button>
          <button 
            onClick={() => setCurrentView('meal-plan')} 
            className={`flex flex-col items-center py-2 px-4 ${currentView === 'meal-plan' ? 'text-orange-500' : 'text-gray-400'}`}
          >
            <Calendar className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Meal Plan</span>
          </button>
          <button 
            onClick={() => setCurrentView('profile')} 
            className={`flex flex-col items-center py-2 px-4 ${currentView === 'profile' ? 'text-orange-500' : 'text-gray-400'}`}
          >
            <User className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
          <div className="flex flex-1 flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 mb-8">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <ChefHat className="w-6 h-6 text-white" />
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-gray-900">SmartChef AI</h1>
                  <p className="text-sm text-gray-500">Your AI Cooking Assistant</p>
                </div>
              </div>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              <button 
                onClick={() => setCurrentView('home')} 
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full ${
                  currentView === 'home' ? 'text-orange-500 bg-orange-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Home className="mr-3 h-5 w-5" />
                Home
              </button>
              <button 
                onClick={() => setCurrentView('ingredients')} 
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full ${
                  currentView === 'ingredients' ? 'text-orange-500 bg-orange-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Package className="mr-3 h-5 w-5" />
                My Pantry
              </button>
              <button 
                onClick={() => setCurrentView('meal-plan')} 
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full ${
                  currentView === 'meal-plan' ? 'text-orange-500 bg-orange-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Calendar className="mr-3 h-5 w-5" />
                Meal Planning
              </button>
              <button 
                onClick={() => setCurrentView('favorites')} 
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full ${
                  currentView === 'favorites' ? 'text-orange-500 bg-orange-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Heart className="mr-3 h-5 w-5" />
                Favorites
              </button>
              <button 
                onClick={() => setCurrentView('nutrition')} 
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full ${
                  currentView === 'nutrition' ? 'text-orange-500 bg-orange-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="mr-3 h-5 w-5" />
                Nutrition
                {userProfile.subscriptionType === 'free' && (
                  <Crown className="ml-auto w-4 h-4 text-orange-500" />
                )}
              </button>
              <button 
                onClick={() => setCurrentView('profile')} 
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full ${
                  currentView === 'profile' ? 'text-orange-500 bg-orange-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <User className="mr-3 h-5 w-5" />
                Profile & Settings
              </button>
            </nav>
          </div>
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-4 text-white">
              <h4 className="font-semibold text-sm mb-1">Upgrade to Premium</h4>
              <p className="text-xs opacity-90 mb-3">Unlimited recipes & meal plans</p>
              <button className="bg-white text-orange-500 text-xs font-semibold px-3 py-2 rounded-md w-full hover:bg-gray-50 transition-colors">
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );

  // Component for Recipe Card
  const RecipeCard = ({ recipe }: { recipe: Recipe }) => (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1">
      <div 
        className="h-48 bg-gradient-to-br from-orange-400 to-red-500 bg-cover bg-center relative"
        style={{ backgroundImage: recipe.imageUrl ? `url(${recipe.imageUrl})` : undefined }}
      >
        <div className="absolute top-3 right-3 flex space-x-2">
          <button
            onClick={() => handleToggleFavorite(recipe.id)}
            className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
          >
            <Heart 
              className={`w-4 h-4 ${isRecipeFavorited(recipe.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`}
            />
          </button>
          {recipe.tags.length > 0 && (
            <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-full capitalize">
              {recipe.tags[0]}
            </span>
          )}
        </div>
        <div className="absolute bottom-3 left-3">
          <div className="flex items-center space-x-1 text-white">
            <Star className="w-4 h-4 fill-current text-yellow-400" />
            <span className="text-sm font-medium">{(recipe.rating / 10).toFixed(1)}</span>
          </div>
        </div>
      </div>
      <div className="p-6">
        <h3 className="font-bold text-lg text-gray-900 mb-2">{recipe.name}</h3>
        <p className="text-gray-600 text-sm mb-4">{recipe.cuisine} • {recipe.difficulty}</p>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{recipe.time} min</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{recipe.servings} servings</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">{recipe.nutrition.calories} cal</p>
            <p className="text-xs text-gray-500">per serving</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-4">
          {recipe.tags.slice(0, 3).map((tag, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button 
            onClick={() => {
              setSelectedRecipe(recipe);
              setShowRecipeModal(true);
            }}
            className="text-orange-500 font-semibold text-sm hover:text-orange-600 transition-colors"
          >
            View Recipe
          </button>
          <button 
            onClick={() => startCookingMode(recipe.id)}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-orange-600 transition-colors flex items-center"
          >
            <Play className="w-4 h-4 mr-1" />
            Cook
          </button>
        </div>
      </div>
    </div>
  );

  // Component for Home View
  const HomeView = () => (
    <div>
      <header className="bg-white border-b border-gray-200 px-4 py-6 md:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Good evening, Chef!</h1>
            <p className="text-gray-600 mt-1">What would you like to cook today?</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">Level 3 Chef</span>
            </div>
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="w-6 h-6 text-gray-600" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-8 space-y-8">
        {/* Quick Actions */}
        <section className="animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => generateRecipesMutation.mutate()}
              disabled={generateRecipesMutation.isPending}
              className="bg-gradient-to-br from-orange-500 to-red-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <Sparkles className="w-8 h-8 mb-3 mx-auto" />
              <h3 className="font-semibold text-lg mb-1">Quick Recipe</h3>
              <p className="text-sm opacity-90">Generate from pantry</p>
            </button>
            <button 
              onClick={() => setCurrentView('meal-plan')}
              className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <CalendarCheck className="w-8 h-8 mb-3 mx-auto" />
              <h3 className="font-semibold text-lg mb-1">Meal Plan</h3>
              <p className="text-sm opacity-90">Plan your week</p>
            </button>
            <button className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
              <ShoppingCart className="w-8 h-8 mb-3 mx-auto" />
              <h3 className="font-semibold text-lg mb-1">Shopping</h3>
              <p className="text-sm opacity-90">Smart grocery list</p>
            </button>
            <button className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
              <PlayCircle className="w-8 h-8 mb-3 mx-auto" />
              <h3 className="font-semibold text-lg mb-1">Cook Mode</h3>
              <p className="text-sm opacity-90">Interactive cooking</p>
            </button>
          </div>
        </section>

        {/* Featured Recipes */}
        <section className="animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Recipes for You</h2>
            <div className="flex items-center space-x-2">
              <button className="px-4 py-2 text-sm font-medium text-orange-500 bg-orange-50 rounded-lg border border-orange-200">All</button>
              <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">Quick</button>
              <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">Healthy</button>
            </div>
          </div>

          {recipesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-xl mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.slice(0, 6).map((recipe: Recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </section>

        {/* Achievements Section */}
        <section className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Your Achievements</h2>
            <button className="text-orange-500 font-semibold text-sm hover:text-orange-600">View All</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <ChefHat className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm">First Recipe</h4>
              <p className="text-xs text-gray-500">Completed your first dish!</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Leaf className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm">Healthy Chef</h4>
              <p className="text-xs text-gray-500">Cooked 5 healthy meals</p>
            </div>
            <div className="text-center opacity-50">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm">Recipe Master</h4>
              <p className="text-xs text-gray-500">Cook 20 different recipes</p>
            </div>
            <div className="text-center opacity-50">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm">Kitchen Hero</h4>
              <p className="text-xs text-gray-500">Complete 10 meal plans</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  // Component for Ingredients View
  const IngredientsView = () => {
    const [newIngredient, setNewIngredient] = useState('');

    const handleAddIngredientClick = () => {
      if (newIngredient.trim()) {
        handleAddIngredient(newIngredient);
        setNewIngredient('');
      }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleAddIngredientClick();
      }
    };

    // Group ingredients by category
    const groupedIngredients = userIngredients.reduce((acc: any, ingredient: UserIngredient) => {
      const category = ingredient.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(ingredient);
      return acc;
    }, {});

    return (
      <div>
        <header className="bg-white border-b border-gray-200 px-4 py-6 md:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Pantry</h1>
              <p className="text-gray-600 mt-1">Manage your available ingredients</p>
            </div>
            <button className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Scan
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8 space-y-6">
          {/* Add Ingredient Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Add Ingredients</h3>
            <div className="flex gap-3">
              <input 
                type="text" 
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add ingredient (e.g., tomatoes, chicken breast...)" 
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <button 
                onClick={handleAddIngredientClick}
                disabled={addIngredientMutation.isPending}
                className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Ingredient Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Vegetables */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Carrot className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-bold text-lg text-gray-900">Vegetables</h4>
              </div>
              <div className="space-y-2">
                {(groupedIngredients.vegetables || []).map((ingredient: UserIngredient) => (
                  <div key={ingredient.id} className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                    <span className="text-gray-800 capitalize">{ingredient.ingredient}</span>
                    <button 
                      onClick={() => handleRemoveIngredient(ingredient.ingredient)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Proteins */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                  <Beef className="w-6 h-6 text-red-600" />
                </div>
                <h4 className="font-bold text-lg text-gray-900">Proteins</h4>
              </div>
              <div className="space-y-2">
                {(groupedIngredients.proteins || []).map((ingredient: UserIngredient) => (
                  <div key={ingredient.id} className="flex items-center justify-between bg-red-50 p-3 rounded-lg">
                    <span className="text-gray-800 capitalize">{ingredient.ingredient}</span>
                    <button 
                      onClick={() => handleRemoveIngredient(ingredient.ingredient)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Pantry Staples */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                  <Wheat className="w-6 h-6 text-yellow-600" />
                </div>
                <h4 className="font-bold text-lg text-gray-900">Pantry Staples</h4>
              </div>
              <div className="space-y-2">
                {(groupedIngredients.staples || []).map((ingredient: UserIngredient) => (
                  <div key={ingredient.id} className="flex items-center justify-between bg-yellow-50 p-3 rounded-lg">
                    <span className="text-gray-800 capitalize">{ingredient.ingredient}</span>
                    <button 
                      onClick={() => handleRemoveIngredient(ingredient.ingredient)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recipe Suggestions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Recipes You Can Make</h3>
              <button 
                onClick={() => generateRecipesMutation.mutate()}
                disabled={generateRecipesMutation.isPending}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                Generate More
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recipes.slice(0, 2).map((recipe: Recipe) => {
                const availableIngredients = userIngredients.map((ing: UserIngredient) => ing.ingredient.toLowerCase());
                const matchingIngredients = recipe.ingredients.filter(ingredient =>
                  availableIngredients.some(available =>
                    available.includes(ingredient.toLowerCase()) ||
                    ingredient.toLowerCase().includes(available)
                  )
                );
                const canMake = matchingIngredients.length >= Math.ceil(recipe.ingredients.length * 0.5);

                return (
                  <div key={recipe.id} className="border border-gray-200 rounded-lg p-4 hover:border-orange-500 transition-colors">
                    <h4 className="font-semibold text-gray-900 mb-2">{recipe.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      You have {matchingIngredients.length}/{recipe.ingredients.length} ingredients
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${canMake ? 'text-green-600' : 'text-yellow-600'}`}>
                        {canMake ? '✓ Ready to cook' : `Missing: ${recipe.ingredients.length - matchingIngredients.length} ingredients`}
                      </span>
                      <button 
                        onClick={() => canMake ? startCookingMode(recipe.id) : null}
                        disabled={!canMake}
                        className={`font-semibold text-sm ${canMake ? 'text-orange-500 hover:text-orange-600' : 'text-gray-400 cursor-not-allowed'}`}
                      >
                        {canMake ? 'Cook Now' : 'View Recipe'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Component for Profile View
  const ProfileView = () => (
    <div>
      <header className="bg-white border-b border-gray-200 px-4 py-6 md:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Profile & Settings</h1>
            <p className="text-gray-600 mt-1">Customize your cooking experience</p>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-8 space-y-6">
        {/* Profile Setup */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-6 text-gray-800">Your Cooking Profile</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input 
                type="text" 
                value={userProfile.name || ''}
                onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Cooking Level</label>
              <div className="flex gap-3">
                {['beginner', 'intermediate', 'advanced'].map(level => (
                  <button
                    key={level}
                    onClick={() => setUserProfile({...userProfile, cookingLevel: level})}
                    className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                      userProfile.cookingLevel === level 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Dietary Restrictions</label>
              <div className="flex flex-wrap gap-2">
                {['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo'].map(diet => (
                  <button
                    key={diet}
                    onClick={() => {
                      const newRestrictions = userProfile.dietaryRestrictions?.includes(diet)
                        ? userProfile.dietaryRestrictions.filter(d => d !== diet)
                        : [...(userProfile.dietaryRestrictions || []), diet];
                      setUserProfile({...userProfile, dietaryRestrictions: newRestrictions});
                    }}
                    className={`px-3 py-2 rounded-full text-sm transition-colors ${
                      userProfile.dietaryRestrictions?.includes(diet)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {diet}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Family Size</label>
              <input 
                type="number" 
                min="1" 
                max="10" 
                value={userProfile.familySize || 2}
                onChange={(e) => setUserProfile({...userProfile, familySize: parseInt(e.target.value)})}
                className="w-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={createProfileMutation.isPending || updateProfileMutation.isPending}
              className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              {createProfileMutation.isPending || updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>

        {/* Cooking Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Your Cooking Journey</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                <ChefHat className="w-8 h-8 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">23</p>
              <p className="text-sm text-gray-600">Recipes Cooked</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">18h</p>
              <p className="text-sm text-gray-600">Time Saved</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Heart className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{userFavorites.length}</p>
              <p className="text-sm text-gray-600">Favorite Recipes</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">4.8</p>
              <p className="text-sm text-gray-600">Avg Rating</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Component for Meal Plan View
  const MealPlanView = () => (
    <div>
      <header className="bg-white border-b border-gray-200 px-4 py-6 md:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Meal Planning</h1>
            <p className="text-gray-600 mt-1">Plan your week with AI-generated meal plans</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center">
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Plan
            </button>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Shopping List
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-8">
        {/* Week Selector */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h3 className="font-bold text-lg text-gray-900">This Week</h3>
                <p className="text-sm text-gray-600">Dec 18 - Dec 24, 2024</p>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">Weekly Nutrition</p>
              <p className="text-xs text-gray-600">2,450 cal avg/day</p>
            </div>
          </div>
        </div>

        {/* Meal Plan Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 mb-6">
          {['Monday', 'Tuesday'].map((day, index) => (
            <div key={day} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className={`text-white p-4 text-center ${index === 0 ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-green-500 to-green-600'}`}>
                <h4 className="font-bold">{day}</h4>
                <p className="text-sm opacity-90">Dec {18 + index}</p>
              </div>
              <div className="p-4 space-y-4">
                {/* Breakfast */}
                <div>
                  <div className="flex items-center mb-2">
                    <Sunrise className="w-4 h-4 text-yellow-500 mr-2" />
                    <span className="text-sm font-semibold text-gray-700">Breakfast</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h5 className="font-medium text-gray-900 text-sm">Healthy Smoothie Bowl</h5>
                    <p className="text-xs text-gray-600 mt-1">280 cal • 10 min</p>
                  </div>
                </div>
                
                {/* Lunch */}
                <div>
                  <div className="flex items-center mb-2">
                    <Sun className="w-4 h-4 text-yellow-500 mr-2" />
                    <span className="text-sm font-semibold text-gray-700">Lunch</span>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <h5 className="font-medium text-gray-900 text-sm">
                      {index === 0 ? 'Mediterranean Quinoa Bowl' : 'Creamy Mushroom Risotto'}
                    </h5>
                    <p className="text-xs text-gray-600 mt-1">
                      {index === 0 ? '320 cal • 25 min' : '420 cal • 35 min'}
                    </p>
                    <button className="mt-2 text-orange-500 text-xs font-semibold hover:text-orange-600">Cook Now</button>
                  </div>
                </div>
                
                {/* Dinner */}
                <div>
                  <div className="flex items-center mb-2">
                    <Moon className="w-4 h-4 text-blue-500 mr-2" />
                    <span className="text-sm font-semibold text-gray-700">Dinner</span>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <h5 className="font-medium text-gray-900 text-sm">
                      {index === 0 ? 'Spicy Thai Basil Chicken' : 'Grilled Salmon'}
                    </h5>
                    <p className="text-xs text-gray-600 mt-1">
                      {index === 0 ? '380 cal • 15 min' : '350 cal • 20 min'}
                    </p>
                    <button className="mt-2 text-orange-500 text-xs font-semibold hover:text-orange-600">Cook Now</button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Placeholder days for larger screens */}
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden opacity-75">
              <div className="bg-gradient-to-r from-gray-400 to-gray-500 text-white p-4 text-center">
                <h4 className="font-bold">Day {i + 3}</h4>
                <p className="text-sm opacity-90">Dec {20 + i}</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="text-center py-8 text-gray-400">
                  <Plus className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Add meals</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Nutrition Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Weekly Nutrition Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Flame className="w-8 h-8 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">2,450</p>
              <p className="text-sm text-gray-600">Avg Calories/day</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Beef className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">125g</p>
              <p className="text-sm text-gray-600">Avg Protein/day</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Wheat className="w-8 h-8 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">280g</p>
              <p className="text-sm text-gray-600">Avg Carbs/day</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Droplets className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">85g</p>
              <p className="text-sm text-gray-600">Avg Fat/day</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Component for Favorites View
  const FavoritesView = () => {
    const favoriteRecipes = (recipes as Recipe[]).filter((recipe: Recipe) => isRecipeFavorited(recipe.id));

    return (
      <div>
        <header className="bg-white border-b border-gray-200 px-4 py-6 md:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Your Favorites</h1>
              <p className="text-gray-600 mt-1">Your saved recipes collection</p>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8">
          {favoriteRecipes.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No favorites yet</h3>
              <p className="text-gray-600 mb-6">Start adding recipes to your favorites to see them here</p>
              <button 
                onClick={() => setCurrentView('home')}
                className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                Browse Recipes
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteRecipes.map((recipe: Recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Main Content */}
      <main className="md:pl-64 pb-20 md:pb-0">
        {currentView === 'home' && <HomeView />}
        {currentView === 'ingredients' && <IngredientsView />}
        {currentView === 'meal-plan' && <MealPlanView />}
        {currentView === 'favorites' && <FavoritesView />}
        {currentView === 'profile' && <ProfileView />}
      </main>

      {/* Recipe Detail Modal */}
      {showRecipeModal && selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{selectedRecipe.name}</h2>
              <button 
                onClick={() => setShowRecipeModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <img 
                    src={selectedRecipe.imageUrl || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600'} 
                    alt={selectedRecipe.name}
                    className="w-full h-64 object-cover rounded-xl mb-6"
                  />
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Ingredients</h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        {selectedRecipe.ingredients.map((ingredient, index) => (
                          <li key={index}>• {ingredient}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Instructions</h4>
                      <ol className="space-y-2 text-sm text-gray-600">
                        {selectedRecipe.instructions.map((instruction, index) => (
                          <li key={index}>{index + 1}. {instruction}</li>
                        ))}
                      </ol>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Nutrition</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="font-medium">Calories</p>
                          <p className="text-2xl font-bold text-orange-500">{selectedRecipe.nutrition.calories}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="font-medium">Protein</p>
                          <p className="text-2xl font-bold text-green-500">{selectedRecipe.nutrition.protein}g</p>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => startCookingMode(selectedRecipe.id)}
                      className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                    >
                      Start Cooking
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cooking Mode Modal */}
      {cookingMode && currentRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
          {/* Cooking Header */}
          <div className="bg-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={stopCookingMode}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{currentRecipe.name}</h2>
                <p className="text-sm text-gray-600">
                  Step {cookingMode.currentStep + 1} of {currentRecipe.instructions.length} • {formatTime(timeLeft)} remaining
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={toggleTimer}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors flex items-center"
              >
                <Timer className="w-4 h-4 mr-2" />
                <span>{formatTime(timeLeft)}</span>
              </button>
            </div>
          </div>

          {/* Cooking Content */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-orange-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChefHat className="w-10 h-10 text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Step {cookingMode.currentStep + 1}
                </h3>
                <p className="text-gray-600">
                  {currentRecipe.instructions[cookingMode.currentStep]}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{cookingMode.currentStep + 1}/{currentRecipe.instructions.length} steps</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${((cookingMode.currentStep + 1) / currentRecipe.instructions.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button 
                  onClick={previousStep}
                  disabled={cookingMode.currentStep === 0}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Previous
                </button>
                <button 
                  onClick={nextStep}
                  className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center"
                >
                  {cookingMode.currentStep + 1 === currentRecipe.instructions.length ? 'Complete' : 'Next Step'}
                  <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartRecipeApp;
