import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import prisma, { initializeDatabase } from '@/utils/prisma-db';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();

    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the date range from query params (7-day window from today)
    const today = new Date().toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    const maxDateString = maxDate.toISOString().split('T')[0];

    // Fetch all active meal plans within the date range
    const mealPlans = await prisma.mealPlan.findMany({
      where: {
        userId: userId,
        status: 'active',
        date: {
          gte: today,
          lte: maxDateString
        }
      },
      include: {
        meals: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    if (mealPlans.length === 0) {
      return NextResponse.json({ mealPlans: [] });
    }

    // Transform database structure to frontend format
    const transformedMealPlans = mealPlans.map(mealPlan => ({
      id: mealPlan.id,
      date: mealPlan.date,
      meals: {
        breakfast: transformMeal(mealPlan.meals.find(m => m.type === 'breakfast')),
        lunch: transformMeal(mealPlan.meals.find(m => m.type === 'lunch')),
        dinner: transformMeal(mealPlan.meals.find(m => m.type === 'dinner')),
        snacks: mealPlan.meals
          .filter(m => m.type === 'snack')
          .map(transformMeal)
      },
      totalMacros: calculateTotalMacros(mealPlan.meals),
      completed: [] // Initialize empty, will be tracked separately
    }));

    return NextResponse.json({ mealPlans: transformedMealPlans });
  } catch (error) {
    console.error('Error fetching active meal plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active meal plans' },
      { status: 500 }
    );
  }
}

// Helper function to transform meal from DB to frontend format
function transformMeal(meal: any) {
  if (!meal) return null;

  // Parse ingredients from string array to structured format
  const parsedIngredients = meal.ingredients.map((ing: string) => {
    // Try to parse format like "2 eggs" or "1 cup rice"
    const match = ing.match(/^([\d./]+\s*\w*)\s+(.+)$/);
    if (match) {
      const [, amount, name] = match;
      return { name, amount: parseFloat(amount) || 1, unit: amount.replace(/[\d./]/g, '').trim() || 'item' };
    }
    return { name: ing, amount: 1, unit: 'item' };
  });

  return {
    id: meal.id,
    name: meal.name, // Changed from 'title' to 'name'
    description: meal.reasoning || 'A delicious and nutritious meal',
    imageUrl: undefined,
    prepTime: 10, // Default prep time
    cookTime: 20, // Default cook time
    servings: 1,
    ingredients: parsedIngredients,
    instructions: meal.preparation, // Changed from 'preparation' to 'instructions'
    macros: {
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat
    }
  };
}

// Helper function to calculate total macros
function calculateTotalMacros(meals: any[]) {
  return meals.reduce((total, meal) => ({
    calories: total.calories + meal.calories,
    protein: total.protein + meal.protein,
    carbs: total.carbs + meal.carbs,
    fat: total.fat + meal.fat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
}
