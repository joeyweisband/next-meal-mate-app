import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { APIMealPlan, APIMealPlanResponse } from '../../schemas/api-meal';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
    });

    console.log('OpenAI API response:', completion); // <-- Add this

    const mealPlanText = completion.choices[0].message.content;
    console.log('Meal plan text:', mealPlanText); // <-- Add this
    
    if (!mealPlanText) {
      throw new Error('No content received from OpenAI');
    }
    
    // Parse the JSON response
    let mealPlan: APIMealPlan;
    try {
      mealPlan = JSON.parse(mealPlanText);
    } catch {
      console.error('Failed to parse OpenAI response:', mealPlanText);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Optionally: Validate mealPlan here (runtime check)
    // You can use zod or ajv for runtime validation if desired

    const response: APIMealPlanResponse = { mealPlan };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating meal plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate meal plan' },
      { status: 500 }
    );
  }
}

function getGoalDescription(userGoal: unknown): string {
  if (!userGoal || typeof userGoal !== 'object' || userGoal === null) return 'maintain current weight';

  const goal = userGoal as {
    type?: string;
    targetWeight?: number;
    timeframe?: number;
  };

  switch (goal.type) {
    case 'lose_weight':
      return `lose weight${goal.targetWeight ? ` to ${goal.targetWeight}kg` : ''}${goal.timeframe ? ` in ${goal.timeframe} weeks` : ''}`;
    case 'gain_muscle':
      return `gain muscle mass${goal.targetWeight ? ` to ${goal.targetWeight}kg` : ''}${goal.timeframe ? ` in ${goal.timeframe} weeks` : ''}`;
    case 'maintain_weight':
    default:
      return 'maintain current weight';
  }
}

function getDietDescription(dietPreferences: unknown): string {
  if (!dietPreferences || typeof dietPreferences !== 'object' || dietPreferences === null) return 'standard diet';

  const prefs = dietPreferences as {
    dietType?: string;
    allergies?: string[];
    customRestrictions?: string;
  };

  let description = prefs.dietType || 'standard';

  if (prefs.allergies && prefs.allergies.length > 0) {
    description += `, avoiding ${prefs.allergies.join(', ')}`;
  }

  if (prefs.customRestrictions) {
    description += `, ${prefs.customRestrictions}`;
  }

  return description;
}

function getMetricsDescription(userMetrics: unknown): string {
  if (!userMetrics || typeof userMetrics !== 'object' || userMetrics === null) return 'average adult';

  const metrics = userMetrics as {
    age?: number;
    gender?: string;
    height?: number;
    weight?: number;
    activityLevel?: string;
  };

  return `${metrics.age || 30} year old ${metrics.gender || 'person'}, ${metrics.height || 170}cm, ${metrics.weight || 70}kg, ${metrics.activityLevel || 'moderate'} activity level`;
}
