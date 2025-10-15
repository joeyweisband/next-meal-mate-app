import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { APIMealPlan, APIMealPlanResponse } from '../../schemas/api-meal';
import { getAuth } from '@clerk/nextjs/server';
import prisma, { initializeDatabase } from '@/utils/prisma-db';
import { validateMealPlan, correctMacros } from '@/utils/macro-validator';

// Initialize OpenAI client with timeout
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 second timeout
  maxRetries: 2,
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

    // Get user data and previous meals in parallel (non-blocking)
    const [userData, previousMeals] = await Promise.allSettled([
      // Get user data
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          age: true,
          gender: true,
          weight: true,
          feet: true,
          inches: true,
          activity_level: true,
          goal_type: true,
          allergies: true,
          diet_type: true,
          target_weight: true,
          timeframe: true
        }
      }),
      // Get previous meal plans (simplified query)
      prisma.mealPlan.findMany({
        where: {
          userId: userId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          breakfast_name: true,
          lunch_name: true,
          dinner_name: true,
          snack_name: true
        },
        take: 10 // Limit to last 10 meal plans
      })
    ]);

    // Extract user data safely
    const userInfo = userData.status === 'fulfilled' ? userData.value : null;
    console.log("Meal Plan API - User data found:", userInfo ? 'Yes' : 'No');

    // Extract previous meals safely
    const pastMealNames = previousMeals.status === 'fulfilled' 
      ? previousMeals.value.flatMap(plan => [
          plan.breakfast_name,
          plan.lunch_name,
          plan.dinner_name,
          plan.snack_name
        ]).filter(Boolean)
      : [];
    
    console.log('Previous meals from the last 7 days:', pastMealNames.length);
    
    // Build user context for meal generation
    let userContext = '';
    if (userInfo) {
      userContext = `
User Profile:
- Age: ${userInfo.age || 'Not specified'}
- Gender: ${userInfo.gender || 'Not specified'}
- Weight: ${userInfo.weight ? `${userInfo.weight} lbs` : 'Not specified'}
- Height: ${userInfo.feet && userInfo.inches ? `${userInfo.feet}'${userInfo.inches}"` : 'Not specified'}
- Activity Level: ${userInfo.activity_level || 'Not specified'}
- Goals: ${userInfo.goal_type && userInfo.goal_type.length > 0 ? userInfo.goal_type.join(', ') : 'General health'}
- Allergies/Restrictions: ${userInfo.allergies && userInfo.allergies.length > 0 ? userInfo.allergies.join(', ') : 'None specified'}
- Diet Preferences: ${userInfo.diet_type && userInfo.diet_type.length > 0 ? userInfo.diet_type.join(', ') : 'Standard'}
${userInfo.target_weight ? `- Target Weight: ${userInfo.target_weight} lbs` : ''}
${userInfo.timeframe ? `- Timeframe: ${userInfo.timeframe} weeks` : ''}

Please tailor the meal plan to support these specific goals and accommodate any restrictions.`;
    } else {
      userContext = `
User Profile: Limited information available. Creating a balanced, healthy meal plan suitable for general wellness.`;
    }
    
    // Add previously suggested meals to avoid repetition
    let previousMealsSection = '';
    if (pastMealNames.length > 0) {
      previousMealsSection = `
Previously Suggested Meals (DO NOT SUGGEST AGAIN):
${pastMealNames.join(', ')}

`;
    }
    
    // Calculate target calories based on user profile
    let targetCalories = 2000; // Default
    if (userInfo) {
      // Basic calorie calculation based on user data
      let bmr = 1500; // Base metabolic rate default
      
      // Use target weight if available, otherwise fall back to current weight
      const weightForCalculation = userInfo.target_weight || userInfo.weight;
      
      if (userInfo.age && weightForCalculation && userInfo.gender) {
        // Simplified BMR calculation (Mifflin-St Jeor) using target weight
        if (userInfo.gender === 'male') {
          bmr = 10 * (weightForCalculation * 0.453592) + 6.25 * (((userInfo.feet || 5) * 12 + (userInfo.inches || 8)) * 2.54) - 5 * userInfo.age + 5;
        } else {
          bmr = 10 * (weightForCalculation * 0.453592) + 6.25 * (((userInfo.feet || 5) * 12 + (userInfo.inches || 6)) * 2.54) - 5 * userInfo.age - 161;
        }
        
        console.log(`BMR calculated using ${userInfo.target_weight ? 'target' : 'current'} weight: ${weightForCalculation} lbs`);
      }
      
      // Activity level multiplier
      const activityMultipliers = {
        'sedentary': 1.2,
        'light': 1.375,
        'moderate': 1.55,
        'active': 1.725,
        'very_active': 1.9
      };
      const activityMultiplier = activityMultipliers[userInfo.activity_level as keyof typeof activityMultipliers] || 1.55;
      
      // Calculate TDEE (Total Daily Energy Expenditure)
      let tdee = bmr * activityMultiplier;
      
      // Adjust based on goals - be more conservative with target weight approach
      if (userInfo.target_weight && userInfo.weight && userInfo.target_weight !== userInfo.weight) {
        // When using target weight, we need to be more conservative
        const weightDifference = Math.abs(userInfo.target_weight - userInfo.weight);
        
        if (userInfo.target_weight < userInfo.weight) {
          // Weight loss: Use a moderate deficit approach
          const currentWeightBMR = userInfo.gender === 'male' 
            ? 10 * (userInfo.weight * 0.453592) + 6.25 * (((userInfo.feet || 5) * 12 + (userInfo.inches || 8)) * 2.54) - 5 * (userInfo.age || 30) + 5
            : 10 * (userInfo.weight * 0.453592) + 6.25 * (((userInfo.feet || 5) * 12 + (userInfo.inches || 6)) * 2.54) - 5 * (userInfo.age || 30) - 161;
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
        if (userInfo.goal_type && userInfo.goal_type.includes('lose_weight')) {
          targetCalories = Math.max(1200, tdee - 500); // 500 calorie deficit for 1lb/week loss
        } else if (userInfo.goal_type && userInfo.goal_type.includes('gain_muscle')) {
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

    const prompt = `Generate a ${targetCalories}-calorie meal plan as JSON.

${userContext}
${previousMealsSection}
CALORIE TARGETS:
- Breakfast: ${Math.round(targetCalories * 0.25)} cal (25%)
- Lunch: ${Math.round(targetCalories * 0.35)} cal (35%)
- Dinner: ${Math.round(targetCalories * 0.35)} cal (35%)
- Snack: ${Math.round(targetCalories * 0.05)} cal (5%)

CRITICAL MACRO CALCULATION REQUIREMENTS:
⚠️ MACROS MUST BE MATHEMATICALLY ACCURATE using this formula:
   Calories = (Protein grams × 4) + (Carbs grams × 4) + (Fat grams × 9)

Example of CORRECT macros:
- Protein: 30g, Carbs: 40g, Fat: 15g
- Calculation: (30×4) + (40×4) + (15×9) = 120 + 160 + 135 = 415 calories ✓

Example of INCORRECT macros:
- Protein: 30g, Carbs: 40g, Fat: 15g, Calories: 500 ✗ (Should be 415)

For each meal:
1. First determine realistic protein/carbs/fat amounts for the ingredients
2. Calculate calories using the 4-4-9 formula
3. Verify your calculation before finalizing
4. Ensure the calculated calories match your reported calories EXACTLY

REQUIREMENTS:
- Use common ingredients with exact amounts
- Simple 30-min recipes
- Vary ingredients and cooking methods
- Avoid repeating previous meals
- Total must equal ${targetCalories} ±50 calories
- Each meal's macros MUST follow the 4-4-9 formula (no exceptions)

When generating meals and macros, explicitly label whether each ingredient is raw or cooked, and ensure units are in grams whenever possible.
For example:
    •    ‘200g raw lean beef (5% fat)’ instead of ‘200g lean beef strips’
    •    ‘185g raw brown rice’ instead of ‘1 cup brown rice’
    •    ‘100g raw broccoli’ instead of ‘1 cup broccoli’
Always assume ingredients are raw unless otherwise specified, and calculate macros based on raw weights.

JSON FORMAT:
{
  "breakfast": {
    "title": "Meal Name",
    "ingredients": ["2 eggs", "1 slice bread"],
    "preparation": ["Step 1", "Step 2"],
    "macros": {"calories": 500, "protein": 25, "carbs": 30, "fat": 15},
    "reasoning": "Brief explanation"
  },
  "lunch": {...},
  "dinner": {...},
  "snack": {...}
}

Return ONLY valid JSON.`;

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('OpenAI request timeout')), 25000); // 25 second timeout
    });

    const completion = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "You are a nutrition expert that generates meal plans in JSON format. Always respond with valid JSON only." 
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000
      }),
      timeoutPromise
    ]) as OpenAI.Chat.Completions.ChatCompletion;

    console.log('OpenAI API response:', completion);

    // Parse the JSON response directly
    let mealPlan: APIMealPlan;
    try {
      const responseContent = completion.choices[0].message.content;
      if (!responseContent) {
        throw new Error('No content received from OpenAI');
      }

      mealPlan = JSON.parse(responseContent);

      // Validate macro accuracy using 4-4-9 formula
      console.log('Validating meal plan macros...');
      const validation = validateMealPlan(mealPlan, targetCalories);

      // Log all warnings
      if (validation.warnings.length > 0) {
        console.warn('Macro validation warnings:');
        validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
      }

      // If there are errors, try to auto-correct minor discrepancies
      if (!validation.isValid) {
        console.error('Macro validation errors found:');
        validation.errors.forEach(error => console.error(`  - ${error}`));

        // Attempt auto-correction for minor issues
        console.log('Attempting to auto-correct macro discrepancies...');
        mealPlan.breakfast.macros = correctMacros(mealPlan.breakfast.macros);
        mealPlan.lunch.macros = correctMacros(mealPlan.lunch.macros);
        mealPlan.dinner.macros = correctMacros(mealPlan.dinner.macros);
        mealPlan.snack.macros = correctMacros(mealPlan.snack.macros);

        // Re-validate after correction
        const revalidation = validateMealPlan(mealPlan, targetCalories);
        if (!revalidation.isValid) {
          // If still invalid after correction, reject the meal plan
          console.error('Macro validation failed even after auto-correction:');
          revalidation.errors.forEach(error => console.error(`  - ${error}`));
          throw new Error(
            'Generated meal plan has invalid macros that could not be auto-corrected. ' +
            'Please try generating again. Errors: ' + revalidation.errors.join('; ')
          );
        } else {
          console.log('✓ Macro discrepancies successfully corrected');
        }
      } else {
        console.log('✓ All meal macros are mathematically accurate');
      }

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
      console.error('Failed to parse OpenAI response:', error);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Save meal plan to database asynchronously (non-blocking)
    if (userId) {
      // Don't await this - let it run in background
      prisma.mealPlan.create({
        data: {
          userId: userId,
          breakfast_name: mealPlan.breakfast.title,
          lunch_name: mealPlan.lunch.title,
          dinner_name: mealPlan.dinner.title,
          snack_name: mealPlan.snack.title
        }
      }).then(() => {
        console.log('Meal plan saved to database for user:', userId);
      }).catch(dbError => {
        console.error('Failed to save meal plan to database:', dbError);
      });
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
