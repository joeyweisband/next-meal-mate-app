import { MealPlan, MealRecipe } from '../types/meal';
import type { APIMealPlanResponse } from '../app/schemas/api-meal';

interface AIMealData {
  title: string;
  ingredients: string[];
  preparation: string[];
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  reasoning: string;
}

export async function generateDailyMealPlan(
  userGoal?: unknown,
  dietPreferences?: unknown,
  userMetrics?: unknown
): Promise<MealPlan> {
  try {
    const response = await fetch('/api/generate-meal-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userGoal,
        dietPreferences,
        userMetrics,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate meal plan: ${response.statusText}`);
    }

    const data: APIMealPlanResponse = await response.json();
    const { mealPlan } = data;

    // Convert AI response to our MealPlan format
    const currentDate = new Date().toISOString().split('T')[0];
    
    const convertAIMealToRecipe = (aiMeal: AIMealData, mealType: string): MealRecipe => ({
      id: `${mealType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: aiMeal.title,
      description: aiMeal.reasoning,
      // imageUrl: `/meal-placeholder.svg`, // You can add meal image generation later
      prepTime: 15, // Default prep time
      cookTime: 20, // Default cook time
      servings: 1,
      ingredients: aiMeal.ingredients.map((ingredient) => ({
        name: ingredient,
        amount: 1, // Default amount
        unit: 'unit', // Default unit
      })),
      instructions: aiMeal.preparation,
      macros: aiMeal.macros,
    });

    const breakfast = convertAIMealToRecipe(mealPlan.breakfast, 'breakfast');
    const lunch = convertAIMealToRecipe(mealPlan.lunch, 'lunch');
    const dinner = convertAIMealToRecipe(mealPlan.dinner, 'dinner');
    const snack = convertAIMealToRecipe(mealPlan.snack, 'snack');

    // Calculate total macros
    const totalMacros = {
      calories: breakfast.macros.calories + lunch.macros.calories + dinner.macros.calories + snack.macros.calories,
      protein: breakfast.macros.protein + lunch.macros.protein + dinner.macros.protein + snack.macros.protein,
      carbs: breakfast.macros.carbs + lunch.macros.carbs + dinner.macros.carbs + snack.macros.carbs,
      fat: breakfast.macros.fat + lunch.macros.fat + dinner.macros.fat + snack.macros.fat,
    };

    return {
      id: `plan-${Date.now()}`,
      date: currentDate,
      meals: {
        breakfast,
        lunch,
        dinner,
        snacks: [snack],
      },
      totalMacros,
      completed: [false, false, false, false],
    };
  } catch (error) {
    console.error('Error generating daily meal plan:', error);
    throw new Error('Failed to generate meal plan');
  }
}
