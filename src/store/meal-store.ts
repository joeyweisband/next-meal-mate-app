import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MealPlan, MealRecipe, DailyProgress, FavoriteMeal } from '../types/meal';
import { User } from '../types/user';
import { generateDailyMealPlan } from '../utils/llm';

interface MealState {
  mealPlans: MealPlan[];
  currentDate: string;
  dailyProgress: Record<string, DailyProgress>;
  isLoading: boolean;
  error: string | null;
  userProfile: User | null;
  favoriteMealIds: string[];

  // Actions
  fetchActiveMealPlan: () => Promise<void>;
  generateAIMealPlan: (date?: string) => Promise<void>;
  markMealAsCompleted: (date: string, mealIndex: number, completed: boolean) => void;
  swapMeal: (date: string, mealType: string, newMeal: MealRecipe) => void;
  getDailyProgress: (date: string) => DailyProgress | null;
  setCurrentDate: (date: string) => void;
  setUserProfile: (user: User) => void;
  addToFavorites: (meal: MealRecipe, mealType: string) => Promise<void>;
  removeFromFavorites: (mealName: string) => Promise<void>;
  fetchFavoriteMealIds: () => Promise<void>;
  isMealFavorited: (mealName: string) => boolean;
}

export const useMealStore = create<MealState>()(
  persist(
    (set, get) => ({
      mealPlans: [],
      currentDate: new Date().toISOString().split('T')[0],
      dailyProgress: {},
      isLoading: false,
      error: null,
      userProfile: null,
      favoriteMealIds: [],

      fetchActiveMealPlan: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/active-meal-plan');

          if (!response.ok) {
            throw new Error('Failed to fetch active meal plan');
          }

          const data = await response.json();

          if (data.mealPlans && data.mealPlans.length > 0) {
            set((state: MealState) => ({
              mealPlans: data.mealPlans,
              isLoading: false
            }));

            // Initialize daily progress for each meal plan
            const newDailyProgress: Record<string, DailyProgress> = {};
            data.mealPlans.forEach((mealPlan: MealPlan) => {
              const totalMeals = Object.values(mealPlan.meals).flat().length;
              newDailyProgress[mealPlan.date] = {
                date: mealPlan.date,
                targetMacros: mealPlan.totalMacros,
                consumedMacros: {
                  calories: 0,
                  protein: 0,
                  carbs: 0,
                  fat: 0
                },
                waterIntake: 0,
                completedMeals: 0,
                totalMeals
              };
            });

            set((state: MealState) => ({
              dailyProgress: {
                ...state.dailyProgress,
                ...newDailyProgress
              }
            }));
          } else {
            set({ mealPlans: [], isLoading: false });
          }
        } catch (error) {
          console.error('Failed to fetch active meal plan:', error);
          set({
            error: error instanceof Error ? error.message : "Failed to fetch meal plan",
            isLoading: false
          });
        }
      },

      generateAIMealPlan: async (date?: string) => {
        const state = get();
        set({ isLoading: true, error: null });
        try {
          const targetDate = date || new Date().toISOString().split('T')[0];

          // Call the API to generate meal plan
          const response = await fetch('/api/generate-meal-plan', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ date: targetDate })
          });

          if (!response.ok) {
            throw new Error('Failed to generate meal plan');
          }

          // After generation, fetch the active meal plan from database
          await get().fetchActiveMealPlan();
        } catch (error) {
          console.error('AI meal plan generation failed:', error);
          set({
            error: error instanceof Error ? error.message : "Failed to generate AI meal plan",
            isLoading: false
          });
        }
      },

      markMealAsCompleted: (date: string, mealIndex: number, completed: boolean) => {
        set((state: MealState) => {
          const mealPlanIndex = state.mealPlans.findIndex((plan: MealPlan) => plan.date === date);
          if (mealPlanIndex === -1) return state;
          const mealPlan = state.mealPlans[mealPlanIndex];
          const updatedCompletedStatus = [...(mealPlan.completed || [])];
          updatedCompletedStatus[mealIndex] = completed;
          const updatedMealPlans = [...state.mealPlans];
          updatedMealPlans[mealPlanIndex] = {
            ...mealPlan,
            completed: updatedCompletedStatus
          };
          const mealTypes = Object.keys(mealPlan.meals);
          const mealType = mealTypes[mealIndex];
          const meal = mealPlan.meals[mealType as keyof typeof mealPlan.meals];
          if (!meal) return { mealPlans: updatedMealPlans };
          const currentProgress = state.dailyProgress[date] || {
            date,
            targetMacros: mealPlan.totalMacros,
            consumedMacros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
            waterIntake: 0,
            completedMeals: 0,
            totalMeals: mealTypes.length
          };
          let updatedProgress;
          if (Array.isArray(meal)) {
            if (completed) {
              const snacksMacros = meal.reduce((total, snack) => ({
                calories: total.calories + snack.macros.calories,
                protein: total.protein + snack.macros.protein,
                carbs: total.carbs + snack.macros.carbs,
                fat: total.fat + snack.macros.fat
              }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
              updatedProgress = {
                ...currentProgress,
                consumedMacros: {
                  calories: currentProgress.consumedMacros.calories + snacksMacros.calories,
                  protein: currentProgress.consumedMacros.protein + snacksMacros.protein,
                  carbs: currentProgress.consumedMacros.carbs + snacksMacros.carbs,
                  fat: currentProgress.consumedMacros.fat + snacksMacros.fat
                },
                completedMeals: currentProgress.completedMeals + 1
              };
            } else {
              const snacksMacros = meal.reduce((total, snack) => ({
                calories: total.calories + snack.macros.calories,
                protein: total.protein + snack.macros.protein,
                carbs: total.carbs + snack.macros.carbs,
                fat: total.fat + snack.macros.fat
              }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
              updatedProgress = {
                ...currentProgress,
                consumedMacros: {
                  calories: Math.max(0, currentProgress.consumedMacros.calories - snacksMacros.calories),
                  protein: Math.max(0, currentProgress.consumedMacros.protein - snacksMacros.protein),
                  carbs: Math.max(0, currentProgress.consumedMacros.carbs - snacksMacros.carbs),
                  fat: Math.max(0, currentProgress.consumedMacros.fat - snacksMacros.fat)
                },
                completedMeals: Math.max(0, currentProgress.completedMeals - 1)
              };
            }
          } else {
            if (completed) {
              updatedProgress = {
                ...currentProgress,
                consumedMacros: {
                  calories: currentProgress.consumedMacros.calories + meal.macros.calories,
                  protein: currentProgress.consumedMacros.protein + meal.macros.protein,
                  carbs: currentProgress.consumedMacros.carbs + meal.macros.carbs,
                  fat: currentProgress.consumedMacros.fat + meal.macros.fat
                },
                completedMeals: currentProgress.completedMeals + 1
              };
            } else {
              updatedProgress = {
                ...currentProgress,
                consumedMacros: {
                  calories: Math.max(0, currentProgress.consumedMacros.calories - meal.macros.calories),
                  protein: Math.max(0, currentProgress.consumedMacros.protein - meal.macros.protein),
                  carbs: Math.max(0, currentProgress.consumedMacros.carbs - meal.macros.carbs),
                  fat: Math.max(0, currentProgress.consumedMacros.fat - meal.macros.fat)
                },
                completedMeals: Math.max(0, currentProgress.completedMeals - 1)
              };
            }
          }
          return {
            mealPlans: updatedMealPlans,
            dailyProgress: {
              ...state.dailyProgress,
              [date]: updatedProgress
            }
          };
        });
      },

      swapMeal: (date: string, mealType: string, newMeal: MealRecipe) => {
        set((state: MealState) => {
          const mealPlanIndex = state.mealPlans.findIndex((plan: MealPlan) => plan.date === date);
          if (mealPlanIndex === -1) return state;
          const mealPlan = state.mealPlans[mealPlanIndex];
          const updatedMeals = { ...mealPlan.meals };
          // Type assertion to help TypeScript understand the structure
          if (mealType === 'snacks') {
            (updatedMeals[mealType as keyof typeof updatedMeals] as MealRecipe[] | undefined) = [newMeal];
          } else {
            (updatedMeals[mealType as keyof typeof updatedMeals] as MealRecipe | undefined) = newMeal;
          }
          const totalMacros = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
          };
          Object.entries(updatedMeals).forEach(([, value]) => {
            if (value) {
              if (Array.isArray(value)) {
                value.forEach((snack: MealRecipe) => {
                  totalMacros.calories += snack.macros.calories;
                  totalMacros.protein += snack.macros.protein;
                  totalMacros.carbs += snack.macros.carbs;
                  totalMacros.fat += snack.macros.fat;
                });
              } else {
                const mealValue = value as MealRecipe;
                totalMacros.calories += mealValue.macros.calories;
                totalMacros.protein += mealValue.macros.protein;
                totalMacros.carbs += mealValue.macros.carbs;
                totalMacros.fat += mealValue.macros.fat;
              }
            }
          });
          const updatedMealPlans = [...state.mealPlans];
          updatedMealPlans[mealPlanIndex] = {
            ...mealPlan,
            meals: updatedMeals,
            totalMacros
          };
          const currentProgress = state.dailyProgress[date];
          if (currentProgress) {
            const updatedProgress = {
              ...currentProgress,
              targetMacros: totalMacros
            };
            return {
              mealPlans: updatedMealPlans,
              dailyProgress: {
                ...state.dailyProgress,
                [date]: updatedProgress
              }
            };
          }
          return { mealPlans: updatedMealPlans };
        });
      },

      getDailyProgress: (date: string) => {
        return get().dailyProgress[date] || null;
      },

      setCurrentDate: (date: string) => {
        set({ currentDate: date });
      },

      setUserProfile: (user: User) => {
        set({ userProfile: user });
      },

      fetchFavoriteMealIds: async () => {
        try {
          const response = await fetch('/api/favorites');
          if (!response.ok) {
            // Don't throw error, just return empty array
            console.log('Failed to fetch favorites, user may not be authenticated yet');
            set({ favoriteMealIds: [] });
            return;
          }

          const data = await response.json();
          const favorites = data.favorites || [];

          // Store meal names as the identifier for favorited meals
          const favoriteMealIds = favorites.map((fav: FavoriteMeal) => fav.name);
          set({ favoriteMealIds });
        } catch (error) {
          console.error('Failed to fetch favorite meal IDs:', error);
          set({ favoriteMealIds: [] });
        }
      },

      addToFavorites: async (meal: MealRecipe, mealType: string) => {
        try {
          // Convert MealRecipe ingredients to string array
          const ingredientsArray = meal.ingredients.map(ing =>
            typeof ing === 'string' ? ing : `${ing.amount} ${ing.unit} ${ing.name}`
          );

          const response = await fetch('/api/favorites', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: meal.name,
              type: mealType,
              ingredients: ingredientsArray,
              preparation: meal.instructions || [],
              calories: meal.macros.calories,
              protein: meal.macros.protein,
              carbs: meal.macros.carbs,
              fat: meal.macros.fat,
              reasoning: meal.description || '',
            }),
          });

          if (!response.ok) throw new Error('Failed to add to favorites');

          // Update the favoriteMealIds array
          set((state: MealState) => ({
            favoriteMealIds: [...state.favoriteMealIds, meal.name]
          }));
        } catch (error) {
          console.error('Failed to add to favorites:', error);
          set({ error: 'Failed to add to favorites' });
        }
      },

      removeFromFavorites: async (mealName: string) => {
        try {
          // First, find the favorite ID by fetching all favorites
          const response = await fetch('/api/favorites');
          if (!response.ok) throw new Error('Failed to fetch favorites');

          const data = await response.json();
          const favorites = data.favorites || [];
          const favorite = favorites.find((fav: FavoriteMeal) => fav.name === mealName);

          if (!favorite) {
            console.error('Favorite not found');
            return;
          }

          // Delete the favorite
          const deleteResponse = await fetch('/api/favorites', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ favoriteId: favorite.id }),
          });

          if (!deleteResponse.ok) throw new Error('Failed to remove from favorites');

          // Update the favoriteMealIds array
          set((state: MealState) => ({
            favoriteMealIds: state.favoriteMealIds.filter(id => id !== mealName)
          }));
        } catch (error) {
          console.error('Failed to remove from favorites:', error);
          set({ error: 'Failed to remove from favorites' });
        }
      },

      isMealFavorited: (mealName: string) => {
        return get().favoriteMealIds.includes(mealName);
      }
    }),
    {
      name: 'meal-storage',
    }
  )
);