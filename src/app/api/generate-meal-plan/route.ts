import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface DailyMealPlan {
  breakfast: {
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
  };
  lunch: {
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
  };
  dinner: {
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
  };
  snack: {
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
  };
}

export async function POST(request: NextRequest) {
  try {
    const { userGoal, dietPreferences, userMetrics } = await request.json();
    
    // Construct the prompt based on user data
    const goalDescription = getGoalDescription(userGoal);
    const dietDescription = getDietDescription(dietPreferences);
    const metricsDescription = getMetricsDescription(userMetrics);
    
    const prompt = `You are an expert AI nutritionist. Generate a full day's meal plan (3 meals and 1 snack) that helps them achieve their weight goal.

User Profile:
${metricsDescription}
Goal: ${goalDescription}
Diet Preferences: ${dietDescription}

For each meal, include:
- Meal Title
- Ingredients (as an array of strings)
- Preparation Steps (as an array of simple and clear steps)
- Macros: Calories, Protein (g), Carbs (g), Fat (g)
- One-sentence reasoning why the meal supports the user's goal

Return the response as a JSON object with the following structure:
{
  "breakfast": {
    "title": "...",
    "ingredients": ["...", "..."],
    "preparation": ["...", "..."],
    "macros": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0},
    "reasoning": "..."
  },
  "lunch": { ... },
  "dinner": { ... },
  "snack": { ... }
}

Make sure the macros add up to appropriate daily totals for the user's goal and the meals are practical to prepare.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert nutritionist. Always respond with valid JSON only, no additional text or formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });    const mealPlanText = completion.choices[0].message.content;
    
    if (!mealPlanText) {
      throw new Error('No content received from OpenAI');
    }
    
    // Parse the JSON response
    let mealPlan: DailyMealPlan;
    try {
      mealPlan = JSON.parse(mealPlanText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', mealPlanText);
      throw new Error('Invalid JSON response from OpenAI');
    }

    return NextResponse.json({ mealPlan });
  } catch (error) {
    console.error('Error generating meal plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate meal plan' },
      { status: 500 }
    );
  }
}

function getGoalDescription(userGoal: any): string {
  if (!userGoal) return 'maintain current weight';
  
  switch (userGoal.type) {
    case 'lose_weight':
      return `lose weight${userGoal.targetWeight ? ` to ${userGoal.targetWeight}kg` : ''}${userGoal.timeframe ? ` in ${userGoal.timeframe} weeks` : ''}`;
    case 'gain_muscle':
      return `gain muscle mass${userGoal.targetWeight ? ` to ${userGoal.targetWeight}kg` : ''}${userGoal.timeframe ? ` in ${userGoal.timeframe} weeks` : ''}`;
    case 'maintain_weight':
    default:
      return 'maintain current weight';
  }
}

function getDietDescription(dietPreferences: any): string {
  if (!dietPreferences) return 'standard diet';
  
  let description = dietPreferences.dietType || 'standard';
  
  if (dietPreferences.allergies && dietPreferences.allergies.length > 0) {
    description += `, avoiding ${dietPreferences.allergies.join(', ')}`;
  }
  
  if (dietPreferences.customRestrictions) {
    description += `, ${dietPreferences.customRestrictions}`;
  }
  
  return description;
}

function getMetricsDescription(userMetrics: any): string {
  if (!userMetrics) return 'average adult';
  
  return `${userMetrics.age || 30} year old ${userMetrics.gender || 'person'}, ${userMetrics.height || 170}cm, ${userMetrics.weight || 70}kg, ${userMetrics.activityLevel || 'moderate'} activity level`;
}
