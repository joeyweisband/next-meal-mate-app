export interface Nutrient {
  name: string;
  amount: number;
  unit: string;
}

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface MealRecipe {
  id: string;
  name: string;
  description: string;
  imageUrl?: string; // Update to make it required once implemented
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  macros: Macros;
  nutrients?: Nutrient[];
}

export interface MealPlan {
  id: string;
  date: string;
  meals: {
    breakfast?: MealRecipe;
    lunch?: MealRecipe;
    dinner?: MealRecipe;
    snacks?: MealRecipe[];
  };
  totalMacros: Macros;
  completed: boolean[];
}

export interface DailyProgress {
  date: string;
  targetMacros: Macros;
  consumedMacros: Macros;
  waterIntake: number; // in ml
  completedMeals: number;
  totalMeals: number;
}

export interface FavoriteMeal {
  id: string;
  name: string;
  type: string; // "breakfast", "lunch", "dinner", "snack"
  ingredients: string[];
  preparation: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  reasoning?: string;
  createdAt: string;
}