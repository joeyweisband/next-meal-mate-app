import React from 'react';
import { MealRecipe } from '../types/meal';

interface SelectedMealsSummaryProps {
  meals: MealRecipe[];
  onClearSelection: () => void;
}

const SelectedMealsSummary: React.FC<SelectedMealsSummaryProps> = ({ meals, onClearSelection }) => {
  if (meals.length === 0) return null;

  const totalMacros = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.macros.calories,
      protein: acc.protein + meal.macros.protein,
      carbs: acc.carbs + meal.macros.carbs,
      fat: acc.fat + meal.macros.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'white',
      borderTopLeftRadius: '1rem',
      borderTopRightRadius: '1rem',
      boxShadow: '0 -4px 12px rgba(0,0,0,0.15)',
      padding: '1rem',
      zIndex: 1000,
      animation: 'slideUp 0.3s ease-out'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '0.75rem'
      }}>
        <h4 style={{ 
          margin: 0, 
          fontSize: '1.125rem', 
          fontWeight: '600',
          color: '#2c3e50'
        }}>
          Selected Meals ({meals.length})
        </h4>
        <button
          onClick={onClearSelection}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#6c757d',
            padding: '0.25rem'
          }}
        >
          ×
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            color: '#e74c3c',
            marginBottom: '0.25rem'
          }}>
            {Math.round(totalMacros.calories)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#7f8c8d' }}>Calories</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            color: '#3498db',
            marginBottom: '0.25rem'
          }}>
            {Math.round(totalMacros.protein)}g
          </div>
          <div style={{ fontSize: '0.75rem', color: '#7f8c8d' }}>Protein</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            color: '#f39c12',
            marginBottom: '0.25rem'
          }}>
            {Math.round(totalMacros.carbs)}g
          </div>
          <div style={{ fontSize: '0.75rem', color: '#7f8c8d' }}>Carbs</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            color: '#27ae60',
            marginBottom: '0.25rem'
          }}>
            {Math.round(totalMacros.fat)}g
          </div>
          <div style={{ fontSize: '0.75rem', color: '#7f8c8d' }}>Fat</div>
        </div>
      </div>

      <div style={{ fontSize: '0.875rem', color: '#7f8c8d', textAlign: 'center' }}>
        Combined nutrition from selected meals
      </div>
    </div>
  );
};

export default SelectedMealsSummary;
