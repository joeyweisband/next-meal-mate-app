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

    const prompt = `Generate a ${targetCalories}-calorie meal plan as JSON using USDA FoodData Central nutritional data.

${userContext}
${previousMealsSection}
CALORIE TARGETS:
- Breakfast: ${Math.round(targetCalories * 0.25)} cal (25%)
- Lunch: ${Math.round(targetCalories * 0.35)} cal (35%)
- Dinner: ${Math.round(targetCalories * 0.35)} cal (35%)
- Snack: ${Math.round(targetCalories * 0.05)} cal (5%)

CRITICAL NUTRITIONAL ACCURACY REQUIREMENTS:
⚠️ Use U.S. Department of Agriculture (USDA) FoodData Central as your authoritative source for all nutritional information.

For each ingredient:
1. Look up accurate USDA nutritional data based on the specific ingredient and preparation
2. Use exact weights showing BOTH grams and ounces for user convenience
3. Specify if ingredients are raw or cooked (cooking changes nutritional values)
4. Sum up the macros from all ingredients to get the total meal macros

IMPORTANT NOTES ABOUT MACROS:
- Real food contains fiber, alcohol, and other factors, so calories may not perfectly follow the 4-4-9 formula
- Prioritize USDA accuracy over mathematical perfection
- Macros should be reasonably close to the standard formula, but small variances (5-10%) are acceptable for real food
- Account for cooking losses/gains in water weight when relevant

INGREDIENT FORMAT - SHOW BOTH UNITS:
Use precise ingredient descriptions with weights in grams AND ounces:
✓ GOOD: "170g (6oz) raw chicken breast, skinless", "185g (6.5oz) raw brown rice", "100g (3.5oz) raw broccoli florets"
✗ BAD: "chicken breast", "1 cup rice", "6oz chicken" (missing grams)

REQUIREMENTS:
- Use common, accessible ingredients with exact weights in BOTH grams and ounces
- Simple 30-min recipes with clear preparation steps
- Vary ingredients and cooking methods for diversity
- Avoid repeating previous meals
- Total meal plan should equal ${targetCalories} ±100 calories
- Each meal's macros should be based on actual USDA data, not manually calculated

JSON FORMAT:
{
  "breakfast": {
    "title": "Meal Name",
    "ingredients": ["170g (6oz) raw chicken breast, skinless", "185g (6.5oz) raw brown rice, cooked", "15ml (1 tbsp) olive oil"],
    "preparation": ["Step 1", "Step 2"],
    "macros": {"calories": 520, "protein": 42, "carbs": 48, "fat": 14},
    "reasoning": "Brief explanation of nutritional benefits"
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

    // Parse the JSON response
    let mealPlan: APIMealPlan;
    try {
      const responseContent = completion.choices[0].message.content;
      if (!responseContent) {
        throw new Error('No content received from OpenAI');
      }

      mealPlan = JSON.parse(responseContent);
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Validate macro accuracy using 4-4-9 formula
    console.log('Validating meal plan macros...');
    const validation = validateMealPlan(mealPlan, targetCalories);

    // Log all warnings (acceptable variance from 4-4-9 formula due to fiber, etc.)
    if (validation.warnings.length > 0) {
      console.warn('Macro validation warnings (acceptable variance for real food):');
      validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }

    // Only reject if validation fails (>10% error - indicates bad data)
    if (!validation.isValid) {
      console.error('Macro validation errors found (exceeds 10% tolerance):');
      validation.errors.forEach(error => console.error(`  - ${error}`));
      return NextResponse.json(
        {
          error: 'Generated meal plan has invalid nutritional data. Please try generating again.',
          details: validation.errors
        },
        { status: 422 }
      );
    } else {
      console.log('✓ Meal plan macros validated successfully (within 10% tolerance for real food data)');
    }

    // Validate calorie totals
    const totalCalories = mealPlan.breakfast.macros.calories +
                        mealPlan.lunch.macros.calories +
                        mealPlan.dinner.macros.calories +
                        mealPlan.snack.macros.calories;

    const calorieVariance = Math.abs(totalCalories - targetCalories);
    console.log(`Meal plan calories: ${totalCalories}, Target: ${targetCalories}, Variance: ${calorieVariance}`);

    if (calorieVariance > 150) {
      console.warn(`Warning: Meal plan calories (${totalCalories}) differ from target (${targetCalories}) by ${calorieVariance} cal`);
    }

    // Save meal plan for the selected date
    if (userId) {
      await saveMealPlanToDatabase(userId, selectedDate, mealPlan);
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

// Helper function to save meal plan to database for a specific date
async function saveMealPlanToDatabase(userId: string, date: string, mealPlan: APIMealPlan): Promise<void> {
  // Delete existing meal plan for this date if it exists
  await prisma.mealPlan.deleteMany({
    where: {
      userId: userId,
      date: date
    }
  });

  // Create new meal plan for this date
  await prisma.mealPlan.create({
    data: {
      userId: userId,
      date: date,
      status: 'active',
      meals: {
        create: [
          createMealData('breakfast', mealPlan.breakfast),
          createMealData('lunch', mealPlan.lunch),
          createMealData('dinner', mealPlan.dinner),
          createMealData('snack', mealPlan.snack)
        ]
      }
    }
  });
  console.log('Meal plan saved to database for user:', userId, 'date:', date);
}

// Helper function to create meal data object
function createMealData(type: string, meal: APIMealPlan['breakfast']) {
  return {
    type,
    name: meal.title,
    ingredients: meal.ingredients,
    preparation: meal.preparation,
    calories: meal.macros.calories,
    protein: meal.macros.protein,
    carbs: meal.macros.carbs,
    fat: meal.macros.fat,
    reasoning: meal.reasoning
  };
}
