import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { APIMealPlan, APIMealPlanResponse } from '../../schemas/api-meal';
import { getAuth } from '@clerk/nextjs/server';
import prisma, { initializeDatabase } from '@/utils/prisma-db';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const selectedDate = data.date || new Date().toISOString().split('T')[0];
    
    console.log("Meal Plan API - Generating meal plan for date:", selectedDate);
    console.log("Meal Plan API - User ID:", userId);

    // Get user data from database to include in meal generation
    let userData = null;
    try {
      userData = await prisma.user.findUnique({
        where: { id: userId }
      });
      console.log("Meal Plan API - User data found:", userData ? 'Yes' : 'No');
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Continue without user data if there's an error
    }

    // Get previous meal plans from the last 7 days
    let previousMeals: any[] = [];
    try {
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
    
    // Build user context for meal generation
    let userContext = '';
    if (userData) {
      userContext = `
User Profile:
- Age: ${userData.age || 'Not specified'}
- Gender: ${userData.gender || 'Not specified'}
- Weight: ${userData.weight ? `${userData.weight} lbs` : 'Not specified'}
- Height: ${userData.feet && userData.inches ? `${userData.feet}'${userData.inches}"` : 'Not specified'}
- Activity Level: ${userData.activity_level || 'Not specified'}
- Goals: ${userData.goal_type && userData.goal_type.length > 0 ? userData.goal_type.join(', ') : 'General health'}
- Allergies/Restrictions: ${userData.allergies && userData.allergies.length > 0 ? userData.allergies.join(', ') : 'None specified'}
- Diet Preferences: ${userData.diet_type && userData.diet_type.length > 0 ? userData.diet_type.join(', ') : 'Standard'}
${userData.target_weight ? `- Target Weight: ${userData.target_weight} lbs` : ''}
${userData.timeframe ? `- Timeframe: ${userData.timeframe} weeks` : ''}

Please tailor the meal plan to support these specific goals and accommodate any restrictions.`;
    } else {
      userContext = `
User Profile: Limited information available. Creating a balanced, healthy meal plan suitable for general wellness.`;
    }
    
    // Add previously suggested meals to avoid repetition
    let previousMealsSection = '';
    if (previousMeals.length > 0) {
      previousMealsSection = `
Previously Suggested Meals (DO NOT SUGGEST AGAIN):
${previousMeals.join(', ')}

`;
    }
    
    // Calculate target calories based on user profile
    let targetCalories = 2000; // Default
    if (userData) {
      // Basic calorie calculation based on user data
      let bmr = 1500; // Base metabolic rate default
      
      // Use target weight if available, otherwise fall back to current weight
      const weightForCalculation = userData.target_weight || userData.weight;
      
      if (userData.age && weightForCalculation && userData.gender) {
        // Simplified BMR calculation (Mifflin-St Jeor) using target weight
        if (userData.gender === 'male') {
          bmr = 10 * (weightForCalculation * 0.453592) + 6.25 * (((userData.feet || 5) * 12 + (userData.inches || 8)) * 2.54) - 5 * userData.age + 5;
        } else {
          bmr = 10 * (weightForCalculation * 0.453592) + 6.25 * (((userData.feet || 5) * 12 + (userData.inches || 6)) * 2.54) - 5 * userData.age - 161;
        }
        
        console.log(`BMR calculated using ${userData.target_weight ? 'target' : 'current'} weight: ${weightForCalculation} lbs`);
      }
      
      // Activity level multiplier
      const activityMultipliers = {
        'sedentary': 1.2,
        'light': 1.375,
        'moderate': 1.55,
        'active': 1.725,
        'very_active': 1.9
      };
      const activityMultiplier = activityMultipliers[userData.activity_level as keyof typeof activityMultipliers] || 1.55;
      
      // Calculate TDEE (Total Daily Energy Expenditure)
      let tdee = bmr * activityMultiplier;
      
      // Adjust based on goals - be more conservative with target weight approach
      if (userData.target_weight && userData.weight && userData.target_weight !== userData.weight) {
        // When using target weight, we need to be more conservative
        const weightDifference = Math.abs(userData.target_weight - userData.weight);
        
        if (userData.target_weight < userData.weight) {
          // Weight loss: Use a moderate deficit approach
          const currentWeightBMR = userData.gender === 'male' 
            ? 10 * (userData.weight * 0.453592) + 6.25 * (((userData.feet || 5) * 12 + (userData.inches || 8)) * 2.54) - 5 * (userData.age || 30) + 5
            : 10 * (userData.weight * 0.453592) + 6.25 * (((userData.feet || 5) * 12 + (userData.inches || 6)) * 2.54) - 5 * (userData.age || 30) - 161;
          const currentTDEE = currentWeightBMR * activityMultiplier;
          targetCalories = Math.max(1200, currentTDEE - 400); // 400 calorie deficit
          console.log(`Weight loss: Using current weight TDEE (${currentTDEE}) with 400 cal deficit = ${targetCalories}`);
        } else {
          // Weight gain: Use a moderate surplus approach
          targetCalories = tdee - 200; // Target weight TDEE minus 200 for gradual approach
          console.log(`Weight gain: Using target weight TDEE (${tdee}) minus 200 cal buffer = ${targetCalories}`);
        }
      } else {
        // Traditional deficit/surplus approach when no target weight specified
        if (userData.goal_type && userData.goal_type.includes('lose_weight')) {
          targetCalories = Math.max(1200, tdee - 500); // 500 calorie deficit for 1lb/week loss
        } else if (userData.goal_type && userData.goal_type.includes('gain_muscle')) {
          targetCalories = tdee + 300; // 300 calorie surplus for muscle gain
        } else {
          targetCalories = tdee; // Maintenance
        }
      }
      
      // Round to nearest 50
      targetCalories = Math.round(targetCalories / 50) * 50;
      
      // Safety bounds
      targetCalories = Math.max(1200, Math.min(3000, targetCalories));
    }

    console.log(`Target calories calculated: ${targetCalories} for user profile`);

    const prompt = `You are an expert AI nutritionist and practical meal planner. Your job is to create a full day's worth of realistic, varied, and goal-aligned meals for a typical home user who wants to eat healthy and stay consistent.

${userContext}
${previousMealsSection}CRITICAL CALORIE REQUIREMENT:
The meals MUST total approximately ${targetCalories} calories for the entire day. This is not optional.
- Breakfast: ${Math.round(targetCalories * 0.25)} calories (25%)
- Lunch: ${Math.round(targetCalories * 0.35)} calories (35%) 
- Dinner: ${Math.round(targetCalories * 0.35)} calories (35%)
- Snack: ${Math.round(targetCalories * 0.05)} calories (5%)

Your task:
Generate 3 meals (breakfast, lunch, dinner) and 1 snack that:
- Help the user reach their health and fitness goal
- Use familiar, everyday ingredients with **exact quantities and units**
- Are easy to cook using common kitchen equipment
- Vary in ingredients, flavors, and cooking techniques
- Are completely different from any previously suggested meals listed above
- **MUST total ${targetCalories} calories across all meals (±50 calories tolerance)**

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
- **CALORIE COMPLIANCE IS MANDATORY**: The total calories across all meals must equal ${targetCalories} (±50 calories)
- Macros must match the user's dietary goal across the day
- Ensure each meal contains accurate estimates for:
  - Calories (MUST match the target distribution above)
  - Protein (grams) - aim for 1.2-2.0g per kg body weight
  - Carbohydrates (grams) - adjust based on activity level and goals
  - Fat (grams) - should be 20-35% of total calories

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
        
        // Validate calorie totals
        const totalCalories = mealPlan.breakfast.macros.calories + 
                            mealPlan.lunch.macros.calories + 
                            mealPlan.dinner.macros.calories + 
                            mealPlan.snack.macros.calories;
        
        const calorieVariance = Math.abs(totalCalories - targetCalories);
        console.log(`Meal plan calories: ${totalCalories}, Target: ${targetCalories}, Variance: ${calorieVariance}`);
        
        if (calorieVariance > 100) {
          console.warn(`Warning: Meal plan calories (${totalCalories}) differ significantly from target (${targetCalories})`);
        }
        
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

    // Generate images for each meal
    // const mealPlanWithImages = await generateImagesForMeals(mealPlan);

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

// New function to generate images
// NOTE: Image generation temporarily disabled for performance
/*
async function generateImagesForMeals(mealPlan: APIMealPlan): Promise<APIMealPlan> {
  try {
    // Create a copy of the meal plan to avoid modifying the original
    const mealPlanWithImages = { ...mealPlan };
    
    // Generate images for each meal type
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
    
    for (const mealType of mealTypes) {
      try {
        const meal = mealPlanWithImages[mealType];
        const imagePrompt = `A professional food photography style image of ${meal.title}, showing a delicious homemade meal on a plate. Top-down view, natural lighting, no text, no watermarks.`;
        
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: imagePrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        });
        
        const imageUrl = response.data && response.data[0]?.url;
        if (imageUrl) {
          mealPlanWithImages[mealType].imageUrl = imageUrl;
        }
      } catch (imageError) {
        console.error(`Failed to generate image for ${mealType}:`, imageError);
        // Continue with other meals if one fails
      }
    }
    
    return mealPlanWithImages;
  } catch (error) {
    console.error('Error generating meal images:', error);
    // Return original meal plan if image generation fails
    return mealPlan;
  }
}
*/

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
