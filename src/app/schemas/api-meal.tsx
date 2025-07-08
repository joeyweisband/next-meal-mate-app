// JSON schema for a single meal (matches OpenAI prompt)
export interface APIMeal {
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
}

// JSON schema for the full day's meal plan (matches OpenAI prompt)
export interface APIMealPlan {
  breakfast: APIMeal;
  lunch: APIMeal;
  dinner: APIMeal;
  snack: APIMeal;
}

// API response schema
export interface APIMealPlanResponse {
  mealPlan: APIMealPlan;
  error?: string;
}