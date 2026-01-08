"use client";
import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import MealCard from '../../components/MealCard';
import DetailedMealCard from '../../components/DetailedMealCard';
import LoadingModal from '../../components/LoadingModal';
// Removed SelectedMealsSummary import
import { useMealStore } from '../../store/meal-store';
import { MealPlan, MealRecipe } from '../../types/meal';

export default function MealPlanScreen() {
  const {
    mealPlans,
    generateAIMealPlan,
    fetchActiveMealPlan,
    isLoading,
    error
  } = useMealStore();
  // Always use today's date as the base
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  // Removed selectedMealIds and selectedMeals state
  const [detailedMeal, setDetailedMeal] = useState<MealRecipe | null>(null);
  const [detailedMealType, setDetailedMealType] = useState<string>('');
  const selectedPlan = mealPlans.find((plan: MealPlan) => plan.date === selectedDate);

  // Fetch active meal plan on mount
  useEffect(() => {
    fetchActiveMealPlan();
  }, []);

  // If you want to force reset to today on mount (optional, but ensures consistency)
  useEffect(() => {
    setSelectedDate(today);
  }, [today]);

  // Removed handleMealPress and setSelectedMealIds

  const handleMealDetailView = (meal: MealRecipe, mealType: string) => {
    setDetailedMeal(meal);
    setDetailedMealType(mealType);
  };

  const handleCloseDetailView = () => {
    setDetailedMeal(null);
    setDetailedMealType('');
  };

  const handlePreviousDay = () => {
    // Prevent going before today
    const currentDateObj = new Date(selectedDate);
    currentDateObj.setDate(currentDateObj.getDate() - 1);
    const newDate = currentDateObj.toISOString().split('T')[0];
    if (newDate >= today) {
      setSelectedDate(newDate);
    }
  };

  const handleNextDay = () => {
    // Prevent going more than 7 days ahead
    const currentDateObj = new Date(selectedDate);
    currentDateObj.setDate(currentDateObj.getDate() + 1);
    const maxDateObj = new Date(today);
    maxDateObj.setDate(maxDateObj.getDate() + 7);
    const newDate = currentDateObj.toISOString().split('T')[0];
    if (currentDateObj <= maxDateObj) {
      setSelectedDate(newDate);
    }
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
    }}>
      {/* Header with date navigation */}
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
          disabled={selectedDate === today}
          style={{ 
            background: 'none', 
            border: 'none', 
            fontSize: '1.5rem', 
            cursor: selectedDate === today ? 'not-allowed' : 'pointer',
            padding: '0.5rem',
            borderRadius: '50%',
            transition: 'background-color 0.2s',
            opacity: selectedDate === today ? 0.5 : 1,
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

        <button 
            onClick={handleNextDay} 
            disabled={
              (() => {
                const maxDateObj = new Date(today);
                maxDateObj.setDate(maxDateObj.getDate() + 7);
                return new Date(selectedDate).toISOString().split('T')[0] === maxDateObj.toISOString().split('T')[0];
              })()
            }
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: (() => {
                const maxDateObj = new Date(today);
                maxDateObj.setDate(maxDateObj.getDate() + 7);
                return new Date(selectedDate).toISOString().split('T')[0] === maxDateObj.toISOString().split('T')[0]
                  ? 'not-allowed'
                  : 'pointer';
              })(),
              padding: '0.5rem',
              borderRadius: '50%',
              transition: 'background-color 0.2s',
              opacity: (() => {
                const maxDateObj = new Date(today);
                maxDateObj.setDate(maxDateObj.getDate() + 7);
                return new Date(selectedDate).toISOString().split('T')[0] === maxDateObj.toISOString().split('T')[0]
                  ? 0.5
                  : 1;
              })(),
            }}
          >
            →
          </button>
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
                title="Generate AI Meal Plan"
                onClick={handleGenerateAIPlan}
                disabled={isLoading}
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
              {/* Removed selectedMealIds.length and selection text */}
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
            </div>
          </Card>

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
                title="AI-Powered Plan"
                onClick={handleGenerateAIPlan}
                disabled={isLoading}
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

          {/* Meals */}
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ 
              margin: '0 0 1rem 0', 
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#2c3e50'
            }}>
              Today&#39;s Meals
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {selectedPlan?.meals?.breakfast?.id && (
              <div
                onClick={() => handleMealDetailView(selectedPlan.meals.breakfast!, 'breakfast')}
                style={{ cursor: 'pointer' }}
              >
                <MealCard
                  meal={selectedPlan.meals.breakfast!}
                  mealType="breakfast"
                  // Removed onPress and isSelected props
                />
              </div>
            )}
            {selectedPlan?.meals?.lunch?.id && (
              <div
                onClick={() => handleMealDetailView(selectedPlan.meals.lunch!, 'lunch')}
                style={{ cursor: 'pointer' }}
              >
                <MealCard
                  meal={selectedPlan.meals.lunch!}
                  mealType="lunch"
                  // Removed onPress and isSelected props
                />
              </div>
            )}
            {selectedPlan?.meals?.dinner?.id && (
              <div
                onClick={() => handleMealDetailView(selectedPlan.meals.dinner!, 'dinner')}
                style={{ cursor: 'pointer' }}
              >
                <MealCard
                  meal={selectedPlan.meals.dinner!}
                  mealType="dinner"
                  // Removed onPress and isSelected props
                />
              </div>
            )}
            {Array.isArray(selectedPlan?.meals?.snacks) && selectedPlan.meals.snacks.map((snack: MealRecipe) => (
              <div
                key={snack.id}
                onClick={() => handleMealDetailView(snack, 'snack')}
                style={{ cursor: 'pointer' }}
              >
                <MealCard
                  meal={snack}
                  mealType="snack"
                  // Removed onPress and isSelected props
                />
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Removed SelectedMealsSummary component */}
      {/* Detailed meal card modal */}
      {detailedMeal && (
        <DetailedMealCard meal={detailedMeal} mealType={detailedMealType} onClose={handleCloseDetailView} />
      )}

      {/* Loading Modal */}
      <LoadingModal isVisible={isLoading} />
    </div>
  );
}
