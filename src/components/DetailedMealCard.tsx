import React from 'react';
import { MealRecipe } from '../types/meal';

export interface DetailedMealCardProps {
  meal: MealRecipe;
  onClose: () => void;
}

export default function DetailedMealCard({ meal, onClose }: DetailedMealCardProps) {
  const getMealTypeColor = (name: string) => {
    if (name.toLowerCase().includes('breakfast')) return 'bg-orange-500';
    if (name.toLowerCase().includes('lunch')) return 'bg-green-500';
    if (name.toLowerCase().includes('dinner')) return 'bg-blue-500';
    if (name.toLowerCase().includes('snack')) return 'bg-purple-500';
    return 'bg-gray-500';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md z-20"
        >
          ✕
        </button>
        
        {/* Meal header */}
        <div className="h-40 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-2xl flex items-end p-6 relative">
          <div className={`absolute top-4 left-4 ${getMealTypeColor(meal.name)} text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg`}>
            {meal.name.toLowerCase().includes('breakfast') ? '🌅 Breakfast' : 
             meal.name.toLowerCase().includes('lunch') ? '☀️ Lunch' : 
             meal.name.toLowerCase().includes('dinner') ? '🌙 Dinner' : '🍎 Snack'}
          </div>
          <div className="text-white">
            <h1 className="text-2xl font-bold">{meal.name}</h1>
            <p className="text-white/80 text-sm mt-1">{meal.prepTime + meal.cookTime} minutes to prepare</p>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Macros */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gradient-to-r from-red-50 to-red-100 p-3 rounded-xl">
              <div className="text-red-600 text-sm font-medium">Calories</div>
              <div className="text-red-800 font-bold text-lg">{Math.round(meal.macros.calories)}</div>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-xl">
              <div className="text-blue-600 text-sm font-medium">Protein</div>
              <div className="text-blue-800 font-bold text-lg">{Math.round(meal.macros.protein)}g</div>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-3 rounded-xl">
              <div className="text-yellow-600 text-sm font-medium">Carbs</div>
              <div className="text-yellow-800 font-bold text-lg">{Math.round(meal.macros.carbs)}g</div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-xl">
              <div className="text-green-600 text-sm font-medium">Fat</div>
              <div className="text-green-800 font-bold text-lg">{Math.round(meal.macros.fat)}g</div>
            </div>
          </div>
          
          {/* Description */}
          <div className="bg-gray-50 p-4 rounded-xl mb-6">
            <p className="text-gray-700 text-sm italic">&quot;{meal.description}&quot;</p>
          </div>
          
          {/* Ingredients */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Ingredients</h2>
            <ul className="space-y-2">
              {meal.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span className="text-gray-700">{ingredient.name}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Instructions */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h2>
            <ol className="space-y-3">
              {meal.instructions.map((step, index) => (
                <li key={index} className="flex items-start">
                  <span className="bg-purple-100 text-purple-700 w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}