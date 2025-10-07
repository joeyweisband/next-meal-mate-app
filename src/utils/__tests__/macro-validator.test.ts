import { validateMealMacros, validateMealPlan, calculateCaloriesFromMacros, correctMacros } from '../macro-validator';

describe('Macro Validator', () => {
  describe('calculateCaloriesFromMacros', () => {
    test('should correctly calculate calories using 4-4-9 formula', () => {
      expect(calculateCaloriesFromMacros(30, 40, 15)).toBe(415); // (30×4) + (40×4) + (15×9) = 415
      expect(calculateCaloriesFromMacros(25, 50, 10)).toBe(390); // (25×4) + (50×4) + (10×9) = 390
      expect(calculateCaloriesFromMacros(0, 0, 0)).toBe(0);
    });
  });

  describe('validateMealMacros', () => {
    test('should validate correct macros', () => {
      const result = validateMealMacros({
        calories: 415,
        protein: 30,
        carbs: 40,
        fat: 15,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect incorrect calorie calculations', () => {
      const result = validateMealMacros({
        calories: 500, // Wrong! Should be 415
        protein: 30,
        carbs: 40,
        fat: 15,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('don\'t match calculated calories');
    });

    test('should detect negative values', () => {
      const result = validateMealMacros({
        calories: 300,
        protein: -10,
        carbs: 40,
        fat: 15,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('cannot be negative'))).toBe(true);
    });

    test('should allow small discrepancies within tolerance', () => {
      const result = validateMealMacros({
        calories: 417, // 2 calories off from 415
        protein: 30,
        carbs: 40,
        fat: 15,
      }, 'test', 5); // 5% tolerance

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0); // Should have warning for minor discrepancy
    });

    test('should warn about very high macro values', () => {
      const result = validateMealMacros({
        calories: 1220,
        protein: 250, // Very high
        carbs: 40,
        fat: 15,
      }, 'test', 5);

      expect(result.warnings.some(w => w.includes('Very high protein'))).toBe(true);
    });
  });

  describe('validateMealPlan', () => {
    test('should validate a complete meal plan', () => {
      const mealPlan = {
        breakfast: {
          macros: { calories: 415, protein: 30, carbs: 40, fat: 15 },
        },
        lunch: {
          macros: { calories: 540, protein: 40, carbs: 50, fat: 18 },
        },
        dinner: {
          macros: { calories: 540, protein: 40, carbs: 50, fat: 18 },
        },
        snack: {
          macros: { calories: 153, protein: 5, carbs: 20, fat: 5 },
        },
      };

      const result = validateMealPlan(mealPlan, 1648);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect errors in any meal', () => {
      const mealPlan = {
        breakfast: {
          macros: { calories: 415, protein: 30, carbs: 40, fat: 15 },
        },
        lunch: {
          macros: { calories: 700, protein: 40, carbs: 50, fat: 18 }, // Wrong calories
        },
        dinner: {
          macros: { calories: 540, protein: 40, carbs: 50, fat: 18 },
        },
        snack: {
          macros: { calories: 153, protein: 5, carbs: 20, fat: 5 },
        },
      };

      const result = validateMealPlan(mealPlan);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Lunch'))).toBe(true);
    });
  });

  describe('correctMacros', () => {
    test('should auto-correct minor discrepancies', () => {
      const corrected = correctMacros({
        calories: 500, // Should be 415
        protein: 30,
        carbs: 40,
        fat: 15,
      });

      expect(corrected.calories).toBe(415); // Auto-corrected
      expect(corrected.protein).toBe(30);
      expect(corrected.carbs).toBe(40);
      expect(corrected.fat).toBe(15);
    });

    test('should not modify already correct macros', () => {
      const original = {
        calories: 415,
        protein: 30,
        carbs: 40,
        fat: 15,
      };

      const corrected = correctMacros(original);

      expect(corrected).toEqual(original);
    });
  });
});
