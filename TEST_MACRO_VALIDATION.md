# Macro Validation Testing Guide

## Overview
This document explains how to test the new macro validation features to ensure AI-generated meal plans have accurate nutritional information.

## What Was Implemented

### 1. Macro Validation Utility (`src/utils/macro-validator.ts`)
- **calculateCaloriesFromMacros**: Calculates calories using the standard 4-4-9 formula
  - Protein: 4 calories per gram
  - Carbs: 4 calories per gram
  - Fat: 9 calories per gram

- **validateMealMacros**: Validates individual meal macros
  - Checks for negative values
  - Verifies calorie calculations match the 4-4-9 formula (within 5% tolerance)
  - Warns about unrealistically high macro values

- **validateMealPlan**: Validates entire meal plan
  - Validates all 4 meals (breakfast, lunch, dinner, snack)
  - Checks total calories against target
  - Returns all errors and warnings

- **correctMacros**: Auto-corrects minor discrepancies
  - Recalculates calories from protein/carbs/fat if within tolerance

### 2. Enhanced AI Prompt (`src/app/api/generate-meal-plan/route.ts`)
The prompt now includes:
- Explicit 4-4-9 formula explanation
- Examples of correct vs incorrect macro calculations
- Step-by-step instructions for the AI to follow
- Warning symbols to emphasize importance

### 3. Post-Generation Validation
After the AI generates a meal plan:
1. Validates all macros using the 4-4-9 formula
2. Logs warnings for minor issues
3. Attempts auto-correction if errors are found
4. Rejects the meal plan if validation fails after correction
5. Provides detailed error messages for debugging

## How to Test

### Manual Testing Steps

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Generate a meal plan:**
   - Navigate to the meal plan page
   - Click "Generate AI Meal Plan"
   - Check the browser console and server logs

3. **What to look for in logs:**
   ```
   ✓ All meal macros are mathematically accurate
   ```
   OR
   ```
   Macro validation warnings:
     - Minor discrepancy in calories...
   Attempting to auto-correct macro discrepancies...
   ✓ Macro discrepancies successfully corrected
   ```

4. **Verify the displayed macros:**
   - For each meal, manually verify: (Protein × 4) + (Carbs × 4) + (Fat × 9) = Calories
   - Example: If a meal shows 30g protein, 40g carbs, 15g fat:
     - Expected calories: (30×4) + (40×4) + (15×9) = 120 + 160 + 135 = 415
     - The displayed calories should be 415 (±5%)

### Test Cases

#### Test Case 1: Valid Meal Plan
Generate a meal plan and verify all macros are valid.

Expected:
- No errors in console
- Message: "✓ All meal macros are mathematically accurate"

#### Test Case 2: Auto-Correction
If the AI returns slightly off macros (within 5% tolerance), they should be auto-corrected.

Expected:
- Warnings logged
- Message: "✓ Macro discrepancies successfully corrected"
- Displayed calories match the calculated calories

#### Test Case 3: Major Errors
If the AI returns severely incorrect macros (>5% off), the meal plan should be rejected.

Expected:
- Error message returned to user
- Message: "Generated meal plan has invalid macros..."
- User prompted to try generating again

## Example Validation

### Correct Macros ✓
```json
{
  "calories": 415,
  "protein": 30,
  "carbs": 40,
  "fat": 15
}
```
Calculation: (30×4) + (40×4) + (15×9) = 120 + 160 + 135 = 415 ✓

### Incorrect Macros ✗
```json
{
  "calories": 500,
  "protein": 30,
  "carbs": 40,
  "fat": 15
}
```
Calculation: (30×4) + (40×4) + (15×9) = 415, but reported as 500 ✗
Error: 20.5% difference (exceeds 5% tolerance)

### Minor Discrepancy (Auto-Corrected) ⚠
```json
{
  "calories": 420,
  "protein": 30,
  "carbs": 40,
  "fat": 15
}
```
Calculation: Should be 415, reported as 420
Error: 1.2% difference (within 5% tolerance)
Action: Auto-corrected to 415

## Monitoring in Production

After deploying, monitor these metrics:

1. **Validation Success Rate**: How often meals pass validation on first try
2. **Auto-Correction Rate**: How often minor corrections are needed
3. **Rejection Rate**: How often meal plans are completely rejected
4. **User Feedback**: Are users reporting accurate nutritional information?

## Troubleshooting

### If macros are still inaccurate:
1. Check server logs for validation messages
2. Verify the tolerance percentage (currently 5%)
3. Review the AI prompt - may need further enhancement
4. Consider adjusting the tolerance or adding stricter validation

### If too many meal plans are rejected:
1. The AI may be struggling with the prompt
2. Consider increasing tolerance slightly (5% → 7%)
3. Review rejected meal plans to identify patterns
4. May need to simplify the prompt or add more examples

## Expected Impact

With these changes, users should receive:
- ✓ Mathematically accurate macro calculations
- ✓ Reliable calorie counts
- ✓ Trustworthy nutritional information
- ✓ Better alignment with their fitness goals
