import React, { useState, useEffect } from 'react';
import { MealRecipe } from '../types/meal';
import { useMealStore } from '../store/meal-store';
import { Heart } from 'lucide-react';

export interface DetailedMealCardProps {
  meal: MealRecipe;
  mealType?: string;
  onClose: () => void;
}

export default function DetailedMealCard({ meal, mealType, onClose }: DetailedMealCardProps) {
  const { addToFavorites, removeFromFavorites, isMealFavorited, fetchFavoriteMealIds, favoriteMealIds } = useMealStore();
  const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false);

  useEffect(() => {
    // Fetch favorites on mount
    fetchFavoriteMealIds();
  }, []);

  // Check if meal is favorited based on the store state
  const isFavorited = isMealFavorited(meal.name);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdatingFavorite(true);

    try {
      if (isFavorited) {
        await removeFromFavorites(meal.name);
      } else {
        // Determine meal type from meal name if not provided
        const type = mealType ||
          (meal.name.toLowerCase().includes('breakfast') ? 'breakfast' :
           meal.name.toLowerCase().includes('lunch') ? 'lunch' :
           meal.name.toLowerCase().includes('dinner') ? 'dinner' : 'snack');
        await addToFavorites(meal, type);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsUpdatingFavorite(false);
    }
  };
  const getMealTypeColor = (type?: string) => {
    if (!type) return 'bg-gray-500';
    const lowerType = type.toLowerCase();
    if (lowerType === 'breakfast') return 'bg-orange-500';
    if (lowerType === 'lunch') return 'bg-green-500';
    if (lowerType === 'dinner') return 'bg-blue-600';
    if (lowerType === 'snack') return 'bg-purple-500';
    return 'bg-gray-500';
  };

  const getMealTypeLabel = (type?: string) => {
    if (!type) return '🍽️ Meal';
    const lowerType = type.toLowerCase();
    if (lowerType === 'breakfast') return '🌅 Breakfast';
    if (lowerType === 'lunch') return '☀️ Lunch';
    if (lowerType === 'dinner') return '🌙 Dinner';
    if (lowerType === 'snack') return '🍎 Snack';
    return '🍽️ Meal';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 modal-overlay">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto modal-content">
        {/* Close and Favorite buttons */}
        <div className="absolute top-4 right-4 flex gap-2 z-20">
          <button
            onClick={handleToggleFavorite}
            disabled={isUpdatingFavorite}
            className={`bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md transition-all ${
              isUpdatingFavorite ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
            }`}
            title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              size={20}
              color={isFavorited ? '#e74c3c' : '#6c757d'}
              fill={isFavorited ? '#e74c3c' : 'none'}
            />
          </button>
          <button
            onClick={onClose}
            className="bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:scale-110 transition-all"
          >
            ✕
          </button>
        </div>
        
        {/* Meal image header - Replace gradient with actual image */}
        <div className="h-64 relative rounded-t-2xl overflow-hidden">
          {/* Always show gradient background */}
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-5xl">🍽️</span>
          </div>
          
          {/* Show image on top if available */}
          {meal.imageUrl && (
            <img 
              src={meal.imageUrl} 
              alt={meal.name} 
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                // If image fails to load, hide it to show gradient background
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 to-black/60"></div>

          <div className={`absolute top-4 left-4 ${getMealTypeColor(mealType)} text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg`}>
            {getMealTypeLabel(mealType)}
          </div>

          <div className="absolute bottom-4 left-6">
            <h1 className="text-2xl font-black drop-shadow-lg" style={{
              color: '#ffffff',
              textShadow: '3px 3px 6px rgba(0,0,0,1), 0px 0px 10px rgba(0,0,0,1), 1px 1px 3px rgba(0,0,0,1), -1px -1px 0px rgba(0,0,0,0.9)'
            }}>{meal.name || 'Meal'}</h1>
            <p className="text-sm mt-1 font-semibold drop-shadow-md" style={{
              color: '#ffffff',
              textShadow: '2px 2px 4px rgba(0,0,0,1), 0px 0px 6px rgba(0,0,0,1), 1px 1px 2px rgba(0,0,0,1)'
            }}>{(meal.prepTime || 0) + (meal.cookTime || 0)} minutes to prepare</p>
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