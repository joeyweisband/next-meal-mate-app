export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type GoalType = 'lose_weight' | 'maintain_weight' | 'gain_muscle';
export type DietType = 'standard' | 'low_carb' | 'keto' | 'mediterranean' | 'vegetarian' | 'vegan' | 'paleo' | 'custom';
export type Allergy = 'dairy' | 'gluten' | 'nuts' | 'shellfish' | 'soy' | 'eggs' | 'fish' | 'other';

export interface UserMetrics {
  height: number; // in cm
  weight: number; // in kg
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
}

export interface UserGoal {
  type: GoalType;
  targetWeight?: number; // in kg
  timeframe?: number; // in weeks
}

export interface DietPreferences {
  dietType: DietType;
  allergies: Allergy[];
  customRestrictions?: string;
  mealsPerDay: number;
}

export interface User {
  id?: string;
  name: string;
  email: string;
  metrics?: UserMetrics;
  goal?: UserGoal;
  dietPreferences?: DietPreferences;
  onboardingCompleted: boolean;
}