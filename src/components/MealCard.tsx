import React from "react";
import { theme } from "@/constants/theme";
import { MealRecipe } from "../types/meal";

interface MealCardProps {
  meal: MealRecipe;
  mealType: string;
  completed?: boolean;
  onPress: () => void;
  onMarkCompleted?: (completed: boolean) => void;
}

const MealCard: React.FC<MealCardProps> = ({ meal, mealType, completed = false, onPress, onMarkCompleted }) => {
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
      }}
      onClick={onPress}
    >
      <div style={{ position: "relative", height: 150 }}>
        <img src={meal.imageUrl} alt={meal.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontWeight: 600, fontSize: 18 }}>{meal.name}</span>
          <span style={{ color: theme.colors.textSecondary, fontSize: 20 }}>&#8250;</span>
        </div>
        <div style={{ color: theme.colors.textSecondary, fontSize: 14, marginBottom: 8 }}>{meal.description}</div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", marginRight: 16 }}>
            <span style={{ marginRight: 4 }}>⏱️</span>
            <span style={{ fontSize: 12, color: theme.colors.textSecondary }}>{meal.prepTime + meal.cookTime} min</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", marginRight: 16 }}>
            <span style={{ marginRight: 4 }}>🍴</span>
            <span style={{ fontSize: 12, color: theme.colors.textSecondary }}>{meal.ingredients.length} ingredients</span>
          </div>
          {onMarkCompleted && (
            <button
              onClick={e => { e.stopPropagation(); onMarkCompleted(!completed); }}
              style={{
                marginLeft: "auto",
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