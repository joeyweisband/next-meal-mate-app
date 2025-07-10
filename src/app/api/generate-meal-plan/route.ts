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
    
    const prompt = `You are an expert AI nutritionist with deep knowledge of global cuisines. Generate a CREATIVE and VARIED full day's meal plan (3 meals and 1 snack) that helps them achieve their weight goal.

User Profile:
${metricsDescription}
Goal: ${goalDescription}
Diet Preferences: ${dietDescription}

Important guidelines:
- Each meal should feature a DIFFERENT cuisine or cooking style
- Use unusual ingredient combinations while maintaining palatability
- Vary cooking methods across meals (baking, sautéing, steaming, etc.)
- Include at least one unexpected or trendy ingredient in each meal
- Balance familiar comfort foods with adventurous options
- Every set of meals per day should be distinct and not repeat previous suggestions

For each meal, include:
- Creative Meal Title
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

Make sure the macros add up to appropriate daily totals for the user's goal and the meals are practical to prepare.
IMPORTANT: Return ONLY valid JSON. Use double quotes for all keys and string values. Ensure your response is properly formatted and can be directly parsed using JSON.parse().`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125",
      messages: [{ role: "user", content: prompt }],
      functions: [
        {
          name: "generateMealPlan",
          description: "Generate a meal plan based on user requirements",
          parameters: {
            type: "object",
            properties: {
              breakfast: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  ingredients: { type: "array", items: { type: "string" } },
                  preparation: { type: "array", items: { type: "string" } },
                  macros: { 
                    type: "object", 
                    properties: {
                      calories: { type: "number" },
                      protein: { type: "number" },
                      carbs: { type: "number" },
                      fat: { type: "number" }
                    },
                    required: ["calories", "protein", "carbs", "fat"]
                  },
                  reasoning: { type: "string" }
                },
                required: ["title", "ingredients", "preparation", "macros", "reasoning"]
              },
              lunch: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  ingredients: { type: "array", items: { type: "string" } },
                  preparation: { type: "array", items: { type: "string" } },
                  macros: { 
                    type: "object", 
                    properties: {
                      calories: { type: "number" },
                      protein: { type: "number" },
                      carbs: { type: "number" },
                      fat: { type: "number" }
                    },
                    required: ["calories", "protein", "carbs", "fat"]
                  },
                  reasoning: { type: "string" }
                },
                required: ["title", "ingredients", "preparation", "macros", "reasoning"]
              },
              dinner: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  ingredients: { type: "array", items: { type: "string" } },
                  preparation: { type: "array", items: { type: "string" } },
                  macros: { 
                    type: "object", 
                    properties: {
                      calories: { type: "number" },
                      protein: { type: "number" },
                      carbs: { type: "number" },
                      fat: { type: "number" }
                    },
                    required: ["calories", "protein", "carbs", "fat"]
                  },
                  reasoning: { type: "string" }
                },
                required: ["title", "ingredients", "preparation", "macros", "reasoning"]
              },
              snack: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  ingredients: { type: "array", items: { type: "string" } },
                  preparation: { type: "array", items: { type: "string" } },
                  macros: { 
                    type: "object", 
                    properties: {
                      calories: { type: "number" },
                      protein: { type: "number" },
                      carbs: { type: "number" },
                      fat: { type: "number" }
                    },
                    required: ["calories", "protein", "carbs", "fat"]
                  },
                  reasoning: { type: "string" }
                },
                required: ["title", "ingredients", "preparation", "macros", "reasoning"]
              }
            },
            required: ["breakfast", "lunch", "dinner", "snack"]
          }
        }
      ],
      function_call: { name: "generateMealPlan" }
    });

    console.log('OpenAI API response:', completion); // <-- Add this

    // Parse the function call args
    const functionCall = completion.choices[0].message.function_call;
    let mealPlan: APIMealPlan;
    if (functionCall && functionCall.name === "generateMealPlan") {
      try {
        mealPlan = JSON.parse(functionCall.arguments);
      } catch (error) {
        console.error('Failed to parse function arguments:', error);
        throw new Error('Invalid function response from OpenAI');
      }
    } else {
      throw new Error('No valid function call received from OpenAI');
    }

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
