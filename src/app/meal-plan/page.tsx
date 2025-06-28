"use client";
import React, { useState } from 'react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import MealCard from '../../components/MealCard';
import SelectedMealsSummary from '../../components/SelectedMealsSummary';
import { useMealStore } from '../../store/meal-store';
import { MealPlan, MealRecipe } from '../../types/meal';

export default function MealPlanScreen() {
  const {
    mealPlans,
    currentDate,
    generateMealPlan,
    generateAIMealPlan,
    isLoading,
    error
  } = useMealStore();
  const [selectedDate, setSelectedDate] = useState(currentDate);  const [selectedMealIds, setSelectedMealIds] = useState<string[]>([]);
  const selectedPlan = mealPlans.find((plan: MealPlan) => plan.date === selectedDate);
  
  // Get selected meals for summary
  const selectedMeals = selectedPlan ? [
    ...(selectedPlan.meals.breakfast && selectedMealIds.includes(selectedPlan.meals.breakfast.id) ? [selectedPlan.meals.breakfast] : []),
    ...(selectedPlan.meals.lunch && selectedMealIds.includes(selectedPlan.meals.lunch.id) ? [selectedPlan.meals.lunch] : []),
    ...(selectedPlan.meals.dinner && selectedMealIds.includes(selectedPlan.meals.dinner.id) ? [selectedPlan.meals.dinner] : []),
    ...(selectedPlan.meals.snacks?.filter(snack => selectedMealIds.includes(snack.id)) || [])
  ] : [];
  const handleMealPress = (mealId: string) => {
    // Toggle selection
    setSelectedMealIds(prev => 
      prev.includes(mealId) 
        ? prev.filter(id => id !== mealId)
        : [...prev, mealId]
    );
  };

  const handlePreviousDay = () => {
    const currentDateObj = new Date(selectedDate);
    currentDateObj.setDate(currentDateObj.getDate() - 1);
    const newDate = currentDateObj.toISOString().split('T')[0];
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const currentDateObj = new Date(selectedDate);
    currentDateObj.setDate(currentDateObj.getDate() + 1);
    const newDate = currentDateObj.toISOString().split('T')[0];
    setSelectedDate(newDate);
  };
  const handleGeneratePlan = () => {
    generateMealPlan(selectedDate);
  };

  const handleGenerateAIPlan = () => {
    generateAIMealPlan(selectedDate);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa',
      paddingBottom: '2rem'
    }}>      {/* Header with date navigation */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '1rem', 
        background: '#fff', 
        borderBottom: '1px solid #eee',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <button 
          onClick={handlePreviousDay} 
          style={{ 
            background: 'none', 
            border: 'none', 
            fontSize: '1.5rem', 
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '50%',
            transition: 'background-color 0.2s'
          }}
        >
          ←
        </button>
        
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#2c3e50' }}>
            {formatDate(selectedDate)}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>
            Meal Plan
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {selectedPlan && (
            <button 
              onClick={handleGenerateAIPlan}
              disabled={isLoading}
              style={{ 
                background: isLoading ? '#f8f9fa' : '#667eea',
                color: isLoading ? '#6c757d' : 'white',
                border: 'none', 
                fontSize: '0.875rem', 
                cursor: isLoading ? 'not-allowed' : 'pointer',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              title="Regenerate with AI"
            >
              {isLoading ? '...' : '🤖'}
            </button>
          )}
          
          <button 
            onClick={handleNextDay} 
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '1.5rem', 
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '50%',
              transition: 'background-color 0.2s'
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          margin: '1rem',
          padding: '1rem',
          backgroundColor: '#fed7d7',
          color: '#e53e3e',
          borderRadius: '0.5rem',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}

      {!selectedPlan ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem 1rem',
          margin: '1rem'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍽️</div>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              color: '#2c3e50',
              marginBottom: '0.5rem'
            }}>
              No meal plan for this day
            </h2>
            <p style={{ 
              color: '#7f8c8d', 
              marginBottom: '2rem',
              fontSize: '1rem',
              lineHeight: '1.5'
            }}>
              Generate a personalized meal plan for {formatDate(selectedDate)}
            </p>
            
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.75rem',
              maxWidth: '300px',
              margin: '0 auto'
            }}>
              <Button 
                title="🤖 Generate AI Meal Plan" 
                onClick={handleGenerateAIPlan} 
                loading={isLoading}
                style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                }} 
              />
              <Button 
                title="📝 Generate Basic Plan" 
                onClick={handleGeneratePlan} 
                loading={isLoading}
                style={{ 
                  background: '#fff',
                  color: '#667eea',
                  border: '2px solid #667eea',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontWeight: '600'
                }} 
              />
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '1rem' }}>
          {/* Daily Macros Summary */}
          <Card style={{ 
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ 
                margin: '0 0 0.5rem 0', 
                fontSize: '1.125rem',
                fontWeight: '600'
              }}>
                Daily Nutrition
              </h3>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                {selectedMealIds.length > 0 ? `${selectedMealIds.length} meals selected` : 'Tap meals to select'}
              </div>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  {Math.round(selectedPlan.totalMacros.calories)}
                </div>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Calories</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  {Math.round(selectedPlan.totalMacros.protein)}g
                </div>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Protein</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  {Math.round(selectedPlan.totalMacros.carbs)}g
                </div>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Carbs</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  {Math.round(selectedPlan.totalMacros.fat)}g
                </div>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Fat</div>
              </div>
            </div>          </Card>

          {/* Regenerate Options */}
          <Card style={{ marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ 
                margin: '0 0 0.5rem 0', 
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#2c3e50'
              }}>
                🔄 Regenerate Meal Plan
              </h3>
              <div style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>
                Generate a new meal plan for {formatDate(selectedDate)}
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '0.75rem', 
              flexWrap: 'wrap'
            }}>
              <Button 
                title="🤖 AI-Powered Plan" 
                onClick={handleGenerateAIPlan} 
                loading={isLoading}
                style={{ 
                  flex: 1,
                  minWidth: '140px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                }} 
              />
            </div>
          </Card>

          {/* Selection Actions */}
          {selectedMealIds.length > 0 && (
            <Card style={{ marginBottom: '1.5rem', background: '#e3f2fd', border: '1px solid #90caf9' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#1565c0', marginBottom: '0.25rem' }}>
                    {selectedMealIds.length} meal{selectedMealIds.length !== 1 ? 's' : ''} selected
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#1976d2' }}>
                    View combined nutrition below
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMealIds([])}
                  style={{
                    background: '#fff',
                    color: '#1565c0',
                    border: '1px solid #90caf9',
                    borderRadius: '0.5rem',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Clear Selection
                </button>
              </div>
            </Card>
          )}

          {/* Meals */}
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ 
              margin: '0 0 1rem 0', 
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#2c3e50'
            }}>
              Today&#39s Meals
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {selectedPlan.meals.breakfast && (
              <MealCard
                meal={selectedPlan.meals.breakfast}
                mealType="breakfast"
                onPress={() => handleMealPress(selectedPlan.meals.breakfast!.id)}
                isSelected={selectedMealIds.includes(selectedPlan.meals.breakfast.id)}
              />
            )}
            {selectedPlan.meals.lunch && (
              <MealCard
                meal={selectedPlan.meals.lunch}
                mealType="lunch"
                onPress={() => handleMealPress(selectedPlan.meals.lunch!.id)}
                isSelected={selectedMealIds.includes(selectedPlan.meals.lunch.id)}
              />
            )}
            {selectedPlan.meals.dinner && (
              <MealCard
                meal={selectedPlan.meals.dinner}
                mealType="dinner"
                onPress={() => handleMealPress(selectedPlan.meals.dinner!.id)}
                isSelected={selectedMealIds.includes(selectedPlan.meals.dinner.id)}
              />
            )}
            {selectedPlan.meals.snacks && selectedPlan.meals.snacks.map((snack: MealRecipe) => (
              <MealCard
                key={snack.id}
                meal={snack}
                mealType="snack"
                onPress={() => handleMealPress(snack.id)}
                isSelected={selectedMealIds.includes(snack.id)}
              />
            ))}          </div>
        </div>
      )}
      
      {/* Selected meals summary */}
      <SelectedMealsSummary 
        meals={selectedMeals}
        onClearSelection={() => setSelectedMealIds([])}
      />

      {/* Regeneration Section */}
      {selectedPlan?.meals.breakfast && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Generate New Meal Plan
          </h3>
          <div className="space-y-4">
            <button
              onClick={handleGenerateAIPlan}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Generating AI Meal Plan...
                </div>
              ) : (
                <>
                  🤖 Generate AI-Powered Meal Plan
                </>
              )}
            </button>
            <p className="text-sm text-gray-600 text-center">
              Get personalized meals based on your goals, preferences, and dietary needs
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
