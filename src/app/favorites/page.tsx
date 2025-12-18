"use client";
import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import Card from '../../components/Card';
import DetailedMealCard from '../../components/DetailedMealCard';
import { FavoriteMeal } from '../../types/meal';
import { MealRecipe, Ingredient } from '../../types/meal';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<FavoriteMeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailedMeal, setDetailedMeal] = useState<MealRecipe | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/favorites');

      if (!response.ok) {
        // Don't show error for authentication issues, just show empty state
        if (response.status === 401) {
          console.log('User not authenticated yet');
          setFavorites([]);
          setIsLoading(false);
          return;
        }
        throw new Error('Failed to fetch favorites');
      }

      const data = await response.json();
      setFavorites(data.favorites || []);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      // Only show error if it's a real server error, not auth issues
      setError('Failed to load favorites. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      setError(null);
      const response = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ favoriteId }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove favorite');
      }

      // Refresh favorites list
      await fetchFavorites();
    } catch (err) {
      console.error('Error removing favorite:', err);
      setError('Failed to remove favorite. Please try again.');
    }
  };

  const handleMealDetailView = (favorite: FavoriteMeal) => {
    // Convert FavoriteMeal to MealRecipe format for the detail view
    const mealRecipe: MealRecipe = {
      id: favorite.id,
      name: favorite.name,
      description: favorite.reasoning || '',
      prepTime: 0, // Not stored in favorites
      cookTime: 0, // Not stored in favorites
      servings: 1,
      ingredients: favorite.ingredients.map((ing): Ingredient => ({
        name: ing,
        amount: 0,
        unit: ''
      })),
      instructions: favorite.preparation,
      macros: {
        calories: favorite.calories,
        protein: favorite.protein,
        carbs: favorite.carbs,
        fat: favorite.fat,
      },
    };
    setDetailedMeal(mealRecipe);
  };

  const handleCloseDetailView = () => {
    setDetailedMeal(null);
  };

  const formatMealType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      paddingBottom: '2rem'
    }}>
      {/* Header */}
      <div style={{
        padding: '1.5rem 1rem',
        background: '#fff',
        borderBottom: '1px solid #eee',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Heart size={28} strokeWidth={2} color="#e74c3c" fill="#e74c3c" />
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#2c3e50',
            margin: 0
          }}>
            Favorite Meals
          </h1>
        </div>
        <p style={{
          color: '#7f8c8d',
          margin: 0,
          fontSize: '0.875rem'
        }}>
          {favorites.length} {favorites.length === 1 ? 'meal' : 'meals'} saved
        </p>
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

      {/* Loading state */}
      {isLoading ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: '#7f8c8d'
        }}>
          Loading favorites...
        </div>
      ) : favorites.length === 0 ? (
        /* Empty state */
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          margin: '1rem'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❤️</div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#2c3e50',
              marginBottom: '0.5rem'
            }}>
              No favorites yet
            </h2>
            <p style={{
              color: '#7f8c8d',
              fontSize: '1rem',
              lineHeight: '1.5'
            }}>
              Start adding your favorite meals from the Meal Plan tab to see them here!
            </p>
          </div>
        </div>
      ) : (
        /* Favorites list */
        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {favorites.map((favorite) => (
              <Card key={favorite.id} style={{ position: 'relative' }}>
                <div
                  onClick={() => handleMealDetailView(favorite)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Meal type badge */}
                  <div style={{
                    display: 'inline-block',
                    background: 'rgba(102, 126, 234, 0.1)',
                    padding: '4px 12px',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#667eea',
                    marginBottom: '0.75rem'
                  }}>
                    {formatMealType(favorite.type)}
                  </div>

                  {/* Meal name */}
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#2c3e50',
                    margin: '0 0 0.75rem 0'
                  }}>
                    {favorite.name}
                  </h3>

                  {/* Macros */}
                  <div style={{
                    background: '#f8f9fa',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    marginBottom: '0.75rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.5rem',
                    fontSize: '0.875rem'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: '600', color: '#e74c3c' }}>
                        {Math.round(favorite.calories)}
                      </div>
                      <div style={{ color: '#7f8c8d', fontSize: '0.75rem' }}>cal</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: '600', color: '#3498db' }}>
                        {Math.round(favorite.protein)}g
                      </div>
                      <div style={{ color: '#7f8c8d', fontSize: '0.75rem' }}>protein</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: '600', color: '#f39c12' }}>
                        {Math.round(favorite.carbs)}g
                      </div>
                      <div style={{ color: '#7f8c8d', fontSize: '0.75rem' }}>carbs</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: '600', color: '#27ae60' }}>
                        {Math.round(favorite.fat)}g
                      </div>
                      <div style={{ color: '#7f8c8d', fontSize: '0.75rem' }}>fat</div>
                    </div>
                  </div>

                  {/* Ingredients count */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#7f8c8d',
                    fontSize: '0.875rem',
                    marginBottom: '0.75rem'
                  }}>
                    <span>🍴</span>
                    <span>{favorite.ingredients.length} ingredients</span>
                    <span style={{ margin: '0 0.25rem' }}>•</span>
                    <span>{favorite.preparation.length} steps</span>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFavorite(favorite.id);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#fff',
                    border: '2px solid #e74c3c',
                    borderRadius: '0.5rem',
                    color: '#e74c3c',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#e74c3c';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.color = '#e74c3c';
                  }}
                >
                  <Heart size={16} fill="currentColor" />
                  Remove from Favorites
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Detailed meal card modal */}
      {detailedMeal && (
        <DetailedMealCard meal={detailedMeal} onClose={handleCloseDetailView} />
      )}
    </div>
  );
}
