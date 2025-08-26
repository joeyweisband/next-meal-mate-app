import React from "react";
import { theme } from "@/constants/theme";
import { MealRecipe } from "../types/meal";
import Image from "next/image";

interface MealCardProps {
  meal: MealRecipe;
  mealType: string;
  completed?: boolean;
  onMarkCompleted?: (completed: boolean) => void;
}

const MealCard: React.FC<MealCardProps> = ({ 
  meal, 
  mealType, 
  completed = false, 
  onMarkCompleted 
}) => {
  const formattedMealType = mealType.charAt(0).toUpperCase() + mealType.slice(1);
  
  return (
    <div
      style={{
        background: theme.colors.card,
        borderRadius: theme.borderRadius.lg,
        overflow: "hidden",
        marginBottom: theme.spacing.md,
        boxShadow: theme.shadows.small.boxShadow,
        opacity: completed ? 0.7 : 1,
        cursor: "pointer",
        border: '2px solid transparent',
        transition: 'all 0.2s ease-in-out',
        transform: 'none'
      }}
    >
      <div style={{ position: "relative", height: 150 }}>
        {meal.imageUrl ? (
          <img 
            src={meal.imageUrl} 
            alt={meal.name} 
            style={{ 
              width: "100%", 
              height: "100%", 
              objectFit: "cover" 
            }} 
            onError={(e) => {
              // If image fails to load, hide the image and show emoji placeholder
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div 
            style={{ 
              width: "100%", 
              height: "100%", 
              backgroundColor: "#f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <span style={{ fontSize: "2rem" }}>🍽️</span>
          </div>
        )}
        <div style={{
          position: "absolute",
          top: theme.spacing.sm,
          left: theme.spacing.sm,
          background: "rgba(0,0,0,0.7)",
          padding: "4px 8px",
          borderRadius: theme.borderRadius.md,
          color: "white",
          fontSize: 12,
          fontWeight: 600,
        }}>{formattedMealType}</div>
      </div>
      <div style={{ padding: theme.spacing.md }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>
              {meal.name}
            </div>
            <div style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 1.4 }}>
              {meal.description}
            </div>
          </div>
        </div>
        
        {/* Macro information */}
        <div style={{ 
          background: '#f8f9fa', 
          borderRadius: 8, 
          padding: '8px 12px', 
          marginBottom: 12,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
          fontSize: 12
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: '#e74c3c' }}>{Math.round(meal.macros.calories)}</div>
            <div style={{ color: theme.colors.textSecondary }}>cal</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: '#3498db' }}>{Math.round(meal.macros.protein)}g</div>
            <div style={{ color: theme.colors.textSecondary }}>protein</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: '#f39c12' }}>{Math.round(meal.macros.carbs)}g</div>
            <div style={{ color: theme.colors.textSecondary }}>carbs</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: '#27ae60' }}>{Math.round(meal.macros.fat)}g</div>
            <div style={{ color: theme.colors.textSecondary }}>fat</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ marginRight: 4 }}>⏱️</span>
              <span style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                {meal.prepTime + meal.cookTime} min
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ marginRight: 4 }}>🍴</span>
              <span style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                {meal.ingredients.length} ingredients
              </span>
            </div>
          </div>
          {onMarkCompleted && (
            <button
              onClick={e => { e.stopPropagation(); onMarkCompleted(!completed); }}
              style={{
                background: completed ? theme.colors.success : theme.colors.border,
                color: completed ? "white" : theme.colors.textSecondary,
                padding: "4px 12px",
                borderRadius: 9999,
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {completed ? "✓" : "Mark as eaten"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MealCard;