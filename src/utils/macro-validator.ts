/**
 * Macro Validation Utility
 * Ensures nutritional accuracy using the standard calorie formula:
 * Calories = (Protein × 4) + (Carbs × 4) + (Fat × 9)
 */

interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  calculatedCalories?: number;
  reportedCalories?: number;
  percentageError?: number;
}

// Constants for caloric values per gram
const CALORIES_PER_GRAM = {
  PROTEIN: 4,
  CARBS: 4,
  FAT: 9,
} as const;

/**
 * Calculate calories from macronutrients using the 4-4-9 formula
 */
export function calculateCaloriesFromMacros(protein: number, carbs: number, fat: number): number {
  return Math.round(
    protein * CALORIES_PER_GRAM.PROTEIN +
    carbs * CALORIES_PER_GRAM.CARBS +
    fat * CALORIES_PER_GRAM.FAT
  );
}

/**
 * Validate individual meal macros
 * @param macros - The macros to validate
 * @param mealType - Type of meal (for context in error messages)
 * @param tolerancePercent - Acceptable error percentage (default 5%)
 */
export function validateMealMacros(
  macros: Macros,
  mealType: string = 'meal',
  tolerancePercent: number = 5
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for negative or zero values
  if (macros.calories <= 0) {
    errors.push(`${mealType}: Calories must be greater than 0 (got ${macros.calories})`);
  }
  if (macros.protein < 0) {
    errors.push(`${mealType}: Protein cannot be negative (got ${macros.protein}g)`);
  }
  if (macros.carbs < 0) {
    errors.push(`${mealType}: Carbs cannot be negative (got ${macros.carbs}g)`);
  }
  if (macros.fat < 0) {
    errors.push(`${mealType}: Fat cannot be negative (got ${macros.fat}g)`);
  }

  // Calculate calories from macros using 4-4-9 formula
  const calculatedCalories = calculateCaloriesFromMacros(macros.protein, macros.carbs, macros.fat);
  const reportedCalories = Math.round(macros.calories);

  // Calculate percentage error
  const difference = Math.abs(calculatedCalories - reportedCalories);
  const percentageError = (difference / reportedCalories) * 100;

  // Validate calorie calculation
  if (percentageError > tolerancePercent) {
    errors.push(
      `${mealType}: Reported calories (${reportedCalories}) don't match calculated calories (${calculatedCalories}) from macros. ` +
      `Error: ${percentageError.toFixed(1)}% (tolerance: ${tolerancePercent}%). ` +
      `Formula: (${macros.protein}g protein × 4) + (${macros.carbs}g carbs × 4) + (${macros.fat}g fat × 9) = ${calculatedCalories} cal`
    );
  } else if (percentageError > 2) {
    // Warning for errors between 2-5%
    warnings.push(
      `${mealType}: Minor discrepancy in calories. Reported: ${reportedCalories}, Calculated: ${calculatedCalories} (${percentageError.toFixed(1)}% difference)`
    );
  }

  // Sanity checks for macro distributions
  if (macros.protein === 0 && macros.carbs === 0 && macros.fat === 0 && macros.calories > 0) {
    errors.push(`${mealType}: Meal has calories but no macronutrients specified`);
  }

  // Check for unrealistic macro values
  if (macros.protein > 200) {
    warnings.push(`${mealType}: Very high protein (${macros.protein}g) - please verify this is correct`);
  }
  if (macros.carbs > 300) {
    warnings.push(`${mealType}: Very high carbs (${macros.carbs}g) - please verify this is correct`);
  }
  if (macros.fat > 150) {
    warnings.push(`${mealType}: Very high fat (${macros.fat}g) - please verify this is correct`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    calculatedCalories,
    reportedCalories,
    percentageError,
  };
}

/**
 * Validate an entire meal plan
 */
export function validateMealPlan(mealPlan: {
  breakfast: { macros: Macros };
  lunch: { macros: Macros };
  dinner: { macros: Macros };
  snack: { macros: Macros };
}, targetCalories?: number): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Validate individual meals
  const breakfastValidation = validateMealMacros(mealPlan.breakfast.macros, 'Breakfast');
  const lunchValidation = validateMealMacros(mealPlan.lunch.macros, 'Lunch');
  const dinnerValidation = validateMealMacros(mealPlan.dinner.macros, 'Dinner');
  const snackValidation = validateMealMacros(mealPlan.snack.macros, 'Snack');

  allErrors.push(...breakfastValidation.errors);
  allErrors.push(...lunchValidation.errors);
  allErrors.push(...dinnerValidation.errors);
  allErrors.push(...snackValidation.errors);

  allWarnings.push(...breakfastValidation.warnings);
  allWarnings.push(...lunchValidation.warnings);
  allWarnings.push(...dinnerValidation.warnings);
  allWarnings.push(...snackValidation.warnings);

  // Validate total calories if target is provided
  if (targetCalories) {
    const totalReportedCalories =
      mealPlan.breakfast.macros.calories +
      mealPlan.lunch.macros.calories +
      mealPlan.dinner.macros.calories +
      mealPlan.snack.macros.calories;

    const totalCalculatedCalories =
      calculateCaloriesFromMacros(
        mealPlan.breakfast.macros.protein + mealPlan.lunch.macros.protein +
        mealPlan.dinner.macros.protein + mealPlan.snack.macros.protein,
        mealPlan.breakfast.macros.carbs + mealPlan.lunch.macros.carbs +
        mealPlan.dinner.macros.carbs + mealPlan.snack.macros.carbs,
        mealPlan.breakfast.macros.fat + mealPlan.lunch.macros.fat +
        mealPlan.dinner.macros.fat + mealPlan.snack.macros.fat
      );

    const calorieVariance = Math.abs(totalReportedCalories - targetCalories);

    if (calorieVariance > 100) {
      allWarnings.push(
        `Total calories (${totalReportedCalories}) differ from target (${targetCalories}) by ${calorieVariance} calories`
      );
    }

    // Also check if total reported vs calculated differs
    const totalDifference = Math.abs(totalReportedCalories - totalCalculatedCalories);
    if (totalDifference > 20) {
      allWarnings.push(
        `Total reported calories (${totalReportedCalories}) vs calculated from all macros (${totalCalculatedCalories}) differ by ${totalDifference} calories`
      );
    }
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * Auto-correct macro discrepancies by recalculating calories from P/C/F
 * Uses the 4-4-9 formula to calculate the correct calorie value
 */
export function correctMacros(macros: Macros, tolerancePercent?: number): Macros {
  // Calculate the correct calories from protein/carbs/fat using 4-4-9 formula
  const calculatedCalories = calculateCaloriesFromMacros(macros.protein, macros.carbs, macros.fat);

  // Always use the calculated calories to ensure accuracy
  return {
    ...macros,
    calories: calculatedCalories,
  };
}
