import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { APIMealPlan, APIMealPlanResponse } from '../../schemas/api-meal';
import { getAuth } from '@clerk/nextjs/server';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { userGoal, dietPreferences, userMetrics } = await request.json();
    
    // Get the current user ID from the auth context
    const auth = request.headers.get('Authorization');
    let userId = '';
    
    // Try to get user ID from Clerk auth first (for server-side)
    const { userId: clerkUserId } = getAuth(request);
    if (clerkUserId) {
      userId = clerkUserId;
    }
    // Fallback to the auth header if provided (for client-side)
    else if (auth && auth.startsWith('Bearer ')) {
      // Extract user ID from auth token
      const token = auth.split(' ')[1];
      if (token && token !== 'undefined' && token !== 'null') {
        userId = token;
      }
    }

    // Get previous meal plans from the last 7 days
    let previousMeals: any[] = [];
    if (userId) {
      try {
        // Import prisma client
        const { prisma } = await import('@/utils/prisma-db');
        
        // Fetch meal plans from the last 7 days
        const pastMealPlans = await prisma.mealPlan.findMany({
          where: {
            userId: userId,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
        
        // Extract meal names
        previousMeals = pastMealPlans.flatMap((plan: { breakfast_name: any; lunch_name: any; dinner_name: any; snack_name: any; }) => [
          plan.breakfast_name,
          plan.lunch_name,
          plan.dinner_name,
          plan.snack_name
        ]);
        
        console.log('Previous meals from the last 7 days:', previousMeals);
      } catch (dbError) {
        console.error('Failed to fetch previous meal plans:', dbError);
        // Continue even if DB fetch fails
      }
    }
    
    // Construct the prompt based on user data
    const goalDescription = getGoalDescription(userGoal);
    const dietDescription = getDietDescription(dietPreferences);
    const metricsDescription = getMetricsDescription(userMetrics);
    
    // Add previously suggested meals to avoid repetition
    let previousMealsSection = '';
    if (previousMeals.length > 0) {
      previousMealsSection = `
Previously Suggested Meals (DO NOT SUGGEST AGAIN):
${previousMeals.join(', ')}

`;
    }
    
    const prompt = `You are an expert AI nutritionist and practical meal planner. Your job is to create a full day's worth of realistic, varied, and goal-aligned meals for a typical home user who wants to eat healthy and stay consistent.

User Profile:
${metricsDescription}
Goal:
${goalDescription}
Diet Preferences:
${dietDescription}
${previousMealsSection}
Your task:
Generate 3 meals (breakfast, lunch, dinner) and 1 snack that:
- Help the user reach their health and fitness goal
- Use familiar, everyday ingredients with **exact quantities and units**
- Are easy to cook using common kitchen equipment
- Vary in ingredients, flavors, and cooking techniques
- Are completely different from any previously suggested meals listed above

Meal Design Requirements:
- Prioritize **simple, accessible, and recognizable meals** (e.g., grilled chicken bowl, turkey wrap, scrambled eggs with toast)
- Add occasional creativity or flair (e.g., using Greek yogurt for sauces, adding herbs, swapping rice for quinoa) — but only if practical
- Avoid hard-to-find or highly exotic ingredients (no niche global meals unless it's a common variation in American kitchens)
- Do not repeat the same ingredient more than twice in a day (e.g., don't use chicken in all meals)
- Vary the cooking methods (e.g., don't bake every meal)
- Do not generate meals that resemble each other in structure (e.g., don't generate three rice bowls)
- Do not reuse meals or variations that are too similar to previous suggestions
- Ensure meals are prep-friendly and can be made in under ~30 minutes (unless clearly stated otherwise)

Ingredients:
- Include a list of ingredients for each meal as an array of strings
- **Each ingredient must include a specific amount and unit**, like:
  - "150g chicken breast"
  - "1 tbsp olive oil"
  - "1 slice whole grain bread"
- Avoid listing just "chicken" or "rice" without amounts

Macros:
- Macros must match the user's dietary goal across the day
- Ensure each meal contains accurate estimates for:
  - Calories
  - Protein (grams)
  - Carbohydrates (grams)
  - Fat (grams)

Return Format:
Respond ONLY with a valid JSON object that can be parsed by \`JSON.parse()\`.

Structure:

{
  "breakfast": {
    "title": "Scrambled Eggs on Toast with Avocado",
    "ingredients": [
      "2 eggs",
      "1 slice whole grain bread",
      "50g avocado",
      "1 tsp olive oil"
    ],
    "preparation": [
      "Crack the eggs into a bowl and beat well.",
      "Heat olive oil in a non-stick pan and scramble the eggs.",
      "Toast the bread slice.",
      "Top the toast with eggs and sliced avocado."
    ],
    "macros": {
      "calories": 350,
      "protein": 18,
      "carbs": 20,
      "fat": 22
    },
    "reasoning": "This meal provides healthy fats and protein to start the day, keeping the user full and energized."
  },
  "lunch": { ... },
  "dinner": { ... },
  "snack": { ... }
}

Important:
- Format strictly in JSON with **double quotes** on all keys and strings
- Do not include any text outside the JSON block
- Meals should be balanced, realistic, and achievable`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-2025-04-14",
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

    // If we have a user ID, save the meal plan to the database
    if (userId) {
      try {
        // Import prisma client
        const { prisma } = await import('@/utils/prisma-db');
        
        // Save meal plan to the database
        await prisma.mealPlan.create({
          data: {
            userId: userId,
            breakfast_name: mealPlan.breakfast.title,
            lunch_name: mealPlan.lunch.title,
            dinner_name: mealPlan.dinner.title,
            snack_name: mealPlan.snack.title
          }
        });
        
        console.log('Meal plan saved to database for user:', userId);
      } catch (dbError) {
        console.error('Failed to save meal plan to database:', dbError);
        // We'll continue even if saving to DB fails
      }
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
