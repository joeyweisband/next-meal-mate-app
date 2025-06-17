"use client";
import React, { useState } from 'react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import MealCard from '../../components/MealCard';
import { useMealStore } from '../../store/meal-store';

export default function MealPlanScreen() {
  const {
    mealPlans,
    currentDate,
    setCurrentDate,
    generateMealPlan,
    isLoading
  } = useMealStore();

  const [selectedDate, setSelectedDate] = useState(currentDate);
  const selectedPlan = mealPlans.find((plan: any) => plan.date === selectedDate);

  const handleMealPress = (mealId: string) => {
    window.location.href = `/meal/${mealId}`;
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
    generateMealPlan();
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
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: '#fff', borderBottom: '1px solid #eee' }}>
        <button onClick={handlePreviousDay} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>{'<'}</button>
        <span style={{ fontSize: 20, fontWeight: 600 }}>{formatDate(selectedDate)}</span>
        <button onClick={handleNextDay} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>{'>'}</button>
      </div>
      {!selectedPlan ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <h2>No meal plan for this day</h2>
          <p style={{ color: '#888', marginBottom: 24 }}>
            Would you like to generate a new meal plan for {formatDate(selectedDate)}?
          </p>
          <Button title="Generate Meal Plan" onClick={handleGeneratePlan} loading={isLoading} style={{ marginTop: 16 }} />
        </div>
      ) : (
        <div style={{ padding: 24 }}>
          <Card style={{ marginBottom: 24 }}>
            <h3>Daily Macros</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, color: '#4caf50' }}>{Math.round(selectedPlan.totalMacros.calories)}</div>
                <div style={{ color: '#888' }}>Calories</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, color: '#4caf50' }}>{Math.round(selectedPlan.totalMacros.protein)}g</div>
                <div style={{ color: '#888' }}>Protein</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, color: '#4caf50' }}>{Math.round(selectedPlan.totalMacros.carbs)}g</div>
                <div style={{ color: '#888' }}>Carbs</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, color: '#4caf50' }}>{Math.round(selectedPlan.totalMacros.fat)}g</div>
                <div style={{ color: '#888' }}>Fat</div>
              </div>
            </div>
          </Card>
          <h3>Meals</h3>
          {selectedPlan.meals.breakfast && (
            <MealCard
              meal={selectedPlan.meals.breakfast}
              mealType="breakfast"
              onPress={() => handleMealPress(selectedPlan.meals.breakfast!.id)}
            />
          )}
          {selectedPlan.meals.lunch && (
            <MealCard
              meal={selectedPlan.meals.lunch}
              mealType="lunch"
              onPress={() => handleMealPress(selectedPlan.meals.lunch!.id)}
            />
          )}
          {selectedPlan.meals.dinner && (
            <MealCard
              meal={selectedPlan.meals.dinner}
              mealType="dinner"
              onPress={() => handleMealPress(selectedPlan.meals.dinner!.id)}
            />
          )}
          {selectedPlan.meals.snacks && selectedPlan.meals.snacks.map((snack: any) => (
            <MealCard
              key={snack.id}
              meal={snack}
              mealType="snack"
              onPress={() => handleMealPress(snack.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
