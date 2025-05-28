import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, Users, Heart, Star, Plus, Minus, Search, Filter, Camera, ShoppingCart, Calendar, Trophy, Leaf, AlertCircle, CheckCircle2, X } from 'lucide-react';

const SmartRecipeApp = () => {
  const [currentView, setCurrentView] = useState('home');
  const [userProfile, setUserProfile] = useState({
    name: '',
    dietaryRestrictions: [],
    cookingLevel: 'beginner',
    preferences: [],
    allergies: [],
    familySize: 2
  });
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [generatedRecipes, setGeneratedRecipes] = useState([]);
  const [mealPlan, setMealPlan] = useState({});
  const [favorites, setFavorites] = useState([]);
  const [cookingMode, setCookingMode] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Sample recipe database with AI-like generation
  const recipeDatabase = [
    {
      id: 1,
      name: 'Mediterranean Quinoa Bowl',
      cuisine: 'Mediterranean',
      time: 25,
      difficulty: 'easy',
      servings: 4,
      ingredients: ['quinoa', 'tomatoes', 'cucumber', 'feta cheese', 'olive oil', 'lemon', 'red onion'],
      nutrition: { calories: 320, protein: 12, carbs: 45, fat: 18 },
      rating: 4.8,
      tags: ['vegetarian', 'gluten-free', 'healthy'],
      instructions: [
        'Cook quinoa according to package directions',
        'Dice tomatoes, cucumber, and red onion',
        'Crumble feta cheese',
        'Mix olive oil and lemon juice for dressing',
        'Combine all ingredients and toss with dressing'
      ],
      tips: ['Use day-old quinoa for better texture', 'Add fresh herbs for extra flavor']
    },
    {
      id: 2,
      name: 'Spicy Thai Basil Chicken',
      cuisine: 'Thai',
      time: 15,
      difficulty: 'medium',
      servings: 2,
      ingredients: ['chicken breast', 'thai basil', 'garlic', 'chili', 'fish sauce', 'soy sauce', 'rice'],
      nutrition: { calories: 380, protein: 28, carbs: 35, fat: 12 },
      rating: 4.9,
      tags: ['spicy', 'quick', 'protein-rich'],
      instructions: [
        'Heat oil in wok over high heat',
        'Add minced garlic and chili',
        'Add chicken and stir-fry until cooked',
        'Add sauces and thai basil',
        'Serve over steamed rice'
      ],
      tips: ['Use holy basil if available', 'High heat is essential for authentic flavor']
    },
    {
      id: 3,
      name: 'Creamy Mushroom Risotto',
      cuisine: 'Italian',
      time: 35,
      difficulty: 'hard',
      servings: 4,
      ingredients: ['arborio rice', 'mushrooms', 'vegetable broth', 'white wine', 'parmesan', 'onion', 'butter'],
      nutrition: { calories: 420, protein: 14, carbs: 52, fat: 16 },
      rating: 4.7,
      tags: ['vegetarian', 'comfort-food', 'creamy'],
      instructions: [
        'Sauté mushrooms until golden, set aside',
        'Cook onion until translucent',
        'Add rice and toast for 2 minutes',
        'Add wine and stir until absorbed',
        'Gradually add warm broth, stirring constantly',
        'Fold in mushrooms, butter, and parmesan'
      ],
      tips: ['Keep broth warm throughout cooking', 'Stir constantly for creamy texture']
    }
  ];

  // AI Recipe Generator Logic
  const generateRecipes = () => {
    const filteredRecipes = recipeDatabase.filter(recipe => {
      // Check dietary restrictions
      const matchesDiet = userProfile.dietaryRestrictions.length === 0 || 
        userProfile.dietaryRestrictions.some(diet => recipe.tags.includes(diet));
      
      // Check skill level
      const skillLevels = { beginner: 1, intermediate: 2, advanced: 3 };
      const difficultyLevels = { easy: 1, medium: 2, hard: 3 };
      const matchesSkill = difficultyLevels[recipe.difficulty] <= skillLevels[userProfile.cookingLevel];
      
      // Check available ingredients (at least 50% match)
      const ingredientMatch = availableIngredients.length === 0 || 
        recipe.ingredients.filter(ing => 
          availableIngredients.some(available => 
            available.toLowerCase().includes(ing.toLowerCase()) || 
            ing.toLowerCase().includes(available.toLowerCase())
          )
        ).length >= Math.ceil(recipe.ingredients.length * 0.5);

      return matchesDiet && matchesSkill && ingredientMatch;
    });

    setGeneratedRecipes(filteredRecipes.slice(0, 6));
  };

  // Meal Planning Logic
  const generateMealPlan = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const newMealPlan = {};
    
    days.forEach(day => {
      const dayRecipes = recipeDatabase.sort(() => 0.5 - Math.random()).slice(0, 3);
      newMealPlan[day] = {
        breakfast: { name: 'Healthy Smoothie Bowl', time: 10, calories: 280 },
        lunch: dayRecipes[0],
        dinner: dayRecipes[1]
      };
    });
    
    setMealPlan(newMealPlan);
  };

  // Smart Shopping List Generator
  const generateShoppingList = () => {
    const allIngredients = new Set();
    Object.values(mealPlan).forEach(dayMeals => {
      ['lunch', 'dinner'].forEach(meal => {
        if (dayMeals[meal]?.ingredients) {
          dayMeals[meal].ingredients.forEach(ing => allIngredients.add(ing));
        }
      });
    });
    
    const missingIngredients = Array.from(allIngredients).filter(ing => 
      !availableIngredients.some(available => 
        available.toLowerCase().includes(ing.toLowerCase())
      )
    );
    
    return missingIngredients;
  };

  useEffect(() => {
    if (availableIngredients.length > 0 || userProfile.dietaryRestrictions.length > 0) {
      generateRecipes();
    }
  }, [availableIngredients, userProfile]);

  const ProfileSetup = () => (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Set Up Your Cooking Profile</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={userProfile.name}
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
                  const newRestrictions = userProfile.dietaryRestrictions.includes(diet)
                    ? userProfile.dietaryRestrictions.filter(d => d !== diet)
                    : [...userProfile.dietaryRestrictions, diet];
                  setUserProfile({...userProfile, dietaryRestrictions: newRestrictions});
                }}
                className={`px-3 py-2 rounded-full text-sm transition-colors ${
                  userProfile.dietaryRestrictions.includes(diet)
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
            value={userProfile.familySize}
            onChange={(e) => setUserProfile({...userProfile, familySize: parseInt(e.target.value)})}
            className="w-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <button
          onClick={() => {
            generateRecipes();
            generateMealPlan();
            setCurrentView('home');
          }}
          className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
        >
          Complete Setup
        </button>
      </div>
    </div>
  );

  const IngredientManager = () => {
    const [newIngredient, setNewIngredient] = useState('');
    
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800">My Ingredients</h3>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            placeholder="Add ingredient..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newIngredient.trim()) {
                setAvailableIngredients([...availableIngredients, newIngredient.trim()]);
                setNewIngredient('');
              }
            }}
          />
          <button
            onClick={() => {
              if (newIngredient.trim()) {
                setAvailableIngredients([...availableIngredients, newIngredient.trim()]);
                setNewIngredient('');
              }
            }}
            className="bg-orange-500 text-white px-4 py-3 rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {availableIngredients.map((ingredient, index) => (
            <span
              key={index}
              className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
            >
              {ingredient}
              <button
                onClick={() => setAvailableIngredients(availableIngredients.filter((_, i) => i !== index))}
                className="text-green-600 hover:text-green-800"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      </div>
    );
  };

  const RecipeCard = ({ recipe, showAddToMealPlan = false }) => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="h-48 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
        <ChefHat size={48} className="text-white" />
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-800">{recipe.name}</h3>
          <button
            onClick={() => {
              const newFavorites = favorites.includes(recipe.id) 
                ? favorites.filter(id => id !== recipe.id)
                : [...favorites, recipe.id];
              setFavorites(newFavorites);
            }}
            className={`p-1 rounded-full ${favorites.includes(recipe.id) ? 'text-red-500' : 'text-gray-400'}`}
          >
            <Heart size={20} fill={favorites.includes(recipe.id) ? 'currentColor' : 'none'} />
          </button>
        </div>
        
        <p className="text-gray-600 text-sm mb-3">{recipe.cuisine} • {recipe.difficulty}</p>
        
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1">
            <Clock size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600">{recipe.time} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600">{recipe.servings} servings</span>
          </div>
          <div className="flex items-center gap-1">
            <Star size={16} className="text-yellow-400" fill="currentColor" />
            <span className="text-sm text-gray-600">{recipe.rating}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {recipe.tags.map(tag => (
            <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
              {tag}
            </span>
          ))}
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Nutrition (per serving):</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="font-bold text-gray-800">{recipe.nutrition.calories}</div>
              <div className="text-gray-500">calories</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-gray-800">{recipe.nutrition.protein}g</div>
              <div className="text-gray-500">protein</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-gray-800">{recipe.nutrition.carbs}g</div>
              <div className="text-gray-500">carbs</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setCookingMode(recipe)}
            className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
          >
            Start Cooking
          </button>
          {showAddToMealPlan && (
            <button className="bg-green-500 text-white py-2 px-3 rounded-lg hover:bg-green-600 transition-colors">
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const CookingMode = ({ recipe }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState([]);
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    useEffect(() => {
      let interval;
      if (isTimerRunning && timer > 0) {
        interval = setInterval(() => {
          setTimer(timer - 1);
        }, 1000);
      } else if (timer === 0 && isTimerRunning) {
        setIsTimerRunning(false);
        setNotifications([...notifications, 'Timer finished!']);
      }
      return () => clearInterval(interval);
    }, [isTimerRunning, timer]);

    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{recipe.name}</h2>
            <button
              onClick={() => setCookingMode(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <h3 className="font-bold text-lg mb-3">Ingredients</h3>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-500" />
                    <span className="text-gray-700">{ingredient}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <h3 className="font-bold text-lg mb-3">Timer</h3>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="text-2xl font-mono text-center mb-3">
                    {formatTime(timer)}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setTimer(300); // 5 minutes
                        setIsTimerRunning(true);
                      }}
                      className="flex-1 bg-blue-500 text-white py-2 rounded text-sm"
                    >
                      5 min
                    </button>
                    <button
                      onClick={() => {
                        setTimer(600); // 10 minutes
                        setIsTimerRunning(true);
                      }}
                      className="flex-1 bg-blue-500 text-white py-2 rounded text-sm"
                    >
                      10 min
                    </button>
                    <button
                      onClick={() => setIsTimerRunning(false)}
                      className="flex-1 bg-red-500 text-white py-2 rounded text-sm"
                    >
                      Stop
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <h3 className="font-bold text-lg mb-3">Instructions</h3>
              <div className="space-y-4">
                {recipe.instructions.map((instruction, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      index === currentStep
                        ? 'border-orange-500 bg-orange-50'
                        : completedSteps.includes(index)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        completedSteps.includes(index)
                          ? 'bg-green-500 text-white'
                          : index === currentStep
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {completedSteps.includes(index) ? <CheckCircle2 size={16} /> : index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800">{instruction}</p>
                        {index === currentStep && (
                          <button
                            onClick={() => {
                              setCompletedSteps([...completedSteps, index]);
                              setCurrentStep(Math.min(currentStep + 1, recipe.instructions.length - 1));
                            }}
                            className="mt-3 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                          >
                            Mark Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {completedSteps.length === recipe.instructions.length && (
                <div className="mt-6 p-4 bg-green-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="text-green-600" size={24} />
                    <h3 className="font-bold text-green-800">Recipe Complete!</h3>
                  </div>
                  <p className="text-green-700">Great job! Your {recipe.name} is ready to serve.</p>
                  <button
                    onClick={() => setCookingMode(null)}
                    className="mt-3 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Finish Cooking
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const MealPlanView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Weekly Meal Plan</h2>
        <div className="flex gap-2">
          <button
            onClick={generateMealPlan}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Generate New Plan
          </button>
          <button
            onClick={() => {
              const shoppingList = generateShoppingList();
              alert(`Shopping List:\n${shoppingList.join('\n')}`);
            }}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <ShoppingCart size={16} />
            Shopping List
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {Object.entries(mealPlan).map(([day, meals]) => (
          <div key={day} className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-lg mb-4 text-gray-800">{day}</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {['breakfast', 'lunch', 'dinner'].map(mealType => (
                <div key={mealType} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-600 mb-2 capitalize">{mealType}</h4>
                  <p className="font-bold text-gray-800">{meals[mealType]?.name}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {meals[mealType]?.time} min
                    </span>
                    <span>{meals[mealType]?.calories} cal</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const Navigation = () => (
    <nav className="bg-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <ChefHat className="text-orange-500" size={32} />
            <h1 className="text-xl font-bold text-gray-800">SmartChef AI</h1>
          </div>
          
          <div className="flex gap-6">
            {[
              { id: 'home', label: 'Recipes', icon: ChefHat },
              { id: 'meal-plan', label: 'Meal Plan', icon: Calendar },
              { id: 'profile', label: 'Profile', icon: Users }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setCurrentView(id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  currentView === id 
                    ? 'bg-orange-500 text-white' 
                    : 'text-gray-600 hover:text-orange-500'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );

  if (cookingMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <CookingMode recipe={cookingMode} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'profile' && !userProfile.name && (
          <ProfileSetup />
        )}

        {currentView === 'profile' && userProfile.name && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Welcome back, {userProfile.name}!</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-lg mb-2">Your Profile</h3>
                  <p>Cooking Level: <span className="capitalize font-medium">{userProfile.cookingLevel}</span></p>
                  <p>Family Size: <span className="font-medium">{userProfile.familySize}</span></p>
                  <p>Dietary Restrictions: <span className="font-medium">{userProfile.dietaryRestrictions.join(', ') || 'None'}</span></p>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Stats</h3>
                  <p>Recipes Cooked: <span className="font-medium">12</span></p>
                  <p>Favorite Recipes: <span className="font-medium">{favorites.length}</span></p>
                  <p>Cooking Streak: <span className="font-medium">5 days</span></p>
                </div>
              </div>
            </div>
            <IngredientManager />
          </div>
        )}

        {currentView === 'home' && (
          <div className="space-y-6">
            {!userProfile.name && (
              <div className="bg-orange-100 border border-orange-200 rounded-xl p-6 text-center">
                <h2 className="text-2xl font-bold text-orange-800 mb-2">Welcome to SmartChef AI!</h2>
                <p className="text-orange-700 mb-4">Get personalized recipe recommendations based on your preferences and available ingredients.</p>
                <button
                  onClick={() => setCurrentView('profile')}
                  className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                  Set Up Your Profile
                </button>
              </div>
            )}

            {userProfile.name && (
              <>
                <IngredientManager />
                
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Recommended Recipes</h2>
                  <button
                    onClick={generateRecipes}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                  >
                    <Search size={16} />
                    Generate New Recipes
                  </button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {generatedRecipes.length > 0 ? (
                    generatedRecipes.map(recipe => (
                      <RecipeCard key={recipe.id} recipe={recipe} showAddToMealPlan={true} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <ChefHat size={48} className="text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Add some ingredients to get personalized recipe recommendations!</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {currentView === 'meal-plan' && (
          <MealPlanView />
        )}

        {notifications.length > 0 && (
          <div className="fixed bottom-4 right-4 space-y-2">
            {notifications.map((notification, index) => (
              <div key={index} className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                <AlertCircle size={16} />
                {notification}
                <button
                  onClick={() => setNotifications(notifications.filter((_, i) => i !== index))}
                  className="ml-2 text-white hover:text-gray-200"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SmartRecipeApp;