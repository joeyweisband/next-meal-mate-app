export interface DetailedMealCardProps {
  meal: {
    id: string;
    title: string;
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    ingredients: string[];
    preparation: string[];
    macros: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    reasoning: string;
    imageUrl?: string;
  };
  isSelected: boolean;
  onSelect: () => void;
}

const getMealTypeColor = (type: string) => {
  switch (type) {
    case 'breakfast': return 'bg-orange-500';
    case 'lunch': return 'bg-green-500';
    case 'dinner': return 'bg-blue-500';
    case 'snack': return 'bg-purple-500';
    default: return 'bg-gray-500';
  }
};

const getMealTypeIcon = (type: string) => {
  switch (type) {
    case 'breakfast': return '🌅';
    case 'lunch': return '☀️';
    case 'dinner': return '🌙';
    case 'snack': return '🍎';
    default: return '🍽️';
  }
};

export default function DetailedMealCard({ meal, isSelected, onSelect }: DetailedMealCardProps) {
  return (
    <div 
      className={`bg-white rounded-2xl shadow-sm border transition-all duration-200 cursor-pointer hover:shadow-md transform hover:-translate-y-1 ${
        isSelected ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-100'
      }`}
      onClick={onSelect}
    >
      {/* Meal Type Badge - Fixed positioning */}
      <div className="relative">
        <div className={`absolute top-4 left-4 ${getMealTypeColor(meal.type)} text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg z-10 flex items-center gap-1.5`}>
          <span>{getMealTypeIcon(meal.type)}</span>
          <span className="capitalize">{meal.type}</span>
        </div>
        
        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-4 right-4 bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center z-10">
            ✓
          </div>
        )}
        
        {/* Meal Image */}
        <div className="h-48 relative overflow-hidden rounded-t-2xl">
          {/* <Image
            src={meal.imageUrl || '/meal-placeholder.svg'}
            alt={meal.title}
            fill
            className="object-cover"
          /> */}
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
      </div>

      <div className="p-6">
        {/* Meal Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
          {meal.title}
        </h3>

        {/* Macros in colorful cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gradient-to-r from-red-50 to-red-100 p-3 rounded-xl">
            <div className="text-red-600 text-sm font-medium">Calories</div>
            <div className="text-red-800 font-bold text-lg">{meal.macros.calories}</div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-xl">
            <div className="text-blue-600 text-sm font-medium">Protein</div>
            <div className="text-blue-800 font-bold text-lg">{meal.macros.protein}g</div>
          </div>
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-3 rounded-xl">
            <div className="text-yellow-600 text-sm font-medium">Carbs</div>
            <div className="text-yellow-800 font-bold text-lg">{meal.macros.carbs}g</div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-xl">
            <div className="text-green-600 text-sm font-medium">Fat</div>
            <div className="text-green-800 font-bold text-lg">{meal.macros.fat}g</div>
          </div>
        </div>

        {/* Reasoning */}
        <div className="bg-gray-50 p-4 rounded-xl mb-4">
          <p className="text-gray-700 text-sm italic">&quot;{meal.reasoning}&quot;</p>
        </div>

        {/* Ingredients */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">Ingredients:</h4>
          <div className="flex flex-wrap gap-2">
            {meal.ingredients.slice(0, 3).map((ingredient, index) => (
              <span 
                key={index}
                className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
              >
                {ingredient}
              </span>
            ))}
            {meal.ingredients.length > 3 && (
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                +{meal.ingredients.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Preparation Steps Preview */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Quick Steps:</h4>
          <ol className="text-sm text-gray-600 space-y-1">
            {meal.preparation.slice(0, 2).map((step, index) => (
              <li key={index} className="flex">
                <span className="text-purple-500 font-medium mr-2">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
            {meal.preparation.length > 2 && (
              <li className="text-gray-400 italic">
                +{meal.preparation.length - 2} more steps...
              </li>
            )}
          </ol>
        </div>
      </div>
    </div>
  );
}