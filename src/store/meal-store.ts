import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MealPlan, MealRecipe, DailyProgress } from '../types/meal';
import { mockMealPlans } from '../mocks/meals';

interface MealState {
  mealPlans: MealPlan[];
  currentDate: string;
  dailyProgress: Record<string, DailyProgress>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchMealPlans: () => Promise<void>;
  generateMealPlan: () => Promise<void>;
  markMealAsCompleted: (date: string, mealIndex: number, completed: boolean) => void;
  swapMeal: (date: string, mealType: string, newMeal: MealRecipe) => void;
  getDailyProgress: (date: string) => DailyProgress | null;
  setCurrentDate: (date: string) => void;
}

export const useMealStore = create<MealState>()(
  persist(
    (set, get) => ({
      mealPlans: [],
      currentDate: new Date().toISOString().split('T')[0],
      dailyProgress: {},
      isLoading: false,
      error: null,

      fetchMealPlans: async () => {
        set({ isLoading: true, error: null });
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          set({ 
            mealPlans: mockMealPlans,
            isLoading: false 
          });
          const progress: Record<string, DailyProgress> = {};
          mockMealPlans.forEach((plan: MealPlan) => {
            const totalMeals = Object.keys(plan.meals).length;
            progress[plan.date] = {
              date: plan.date,
              targetMacros: plan.totalMacros,
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
          set({ dailyProgress: progress });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to fetch meal plans", 
            isLoading: false 
          });
        }
      },

      generateMealPlan: async () => {
        set({ isLoading: true, error: null });
        try {
          await new Promise(resolve => setTimeout(resolve, 1500));
          const newPlan: MealPlan = { ...mockMealPlans[0] };
          newPlan.id = Date.now().toString();
          newPlan.date = new Date().toISOString().split('T')[0];
          set((state: MealState) => ({ 
            mealPlans: [...state.mealPlans, newPlan],
            isLoading: false 
          }));
          const totalMeals = Object.keys(newPlan.meals).length;
          set((state: MealState) => ({
            dailyProgress: {
              ...state.dailyProgress,
              [newPlan.date]: {
                date: newPlan.date,
                targetMacros: newPlan.totalMacros,
                consumedMacros: {
                  calories: 0,
                  protein: 0,
                  carbs: 0,
                  fat: 0
                },
                waterIntake: 0,
                completedMeals: 0,
                totalMeals
              }
            }
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to generate meal plan", 
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
      }
    }),
    {
      name: 'meal-storage',
    }
  )
);