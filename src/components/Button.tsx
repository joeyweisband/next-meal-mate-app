import React from "react";
import { theme } from "@/constants/theme";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  title: string;
  onClick: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: React.CSSProperties;
  textStyle?: React.CSSProperties;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const getButtonStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      borderRadius: theme.borderRadius.md,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      width: fullWidth ? "100%" : undefined,
      border: "none",
      cursor: disabled || loading ? "not-allowed" : "pointer",
      transition: "background 0.2s, color 0.2s, opacity 0.2s",
    };

    // Size styles
    switch (size) {
      case "sm":
        baseStyle.padding = `${theme.spacing.xs}px ${theme.spacing.sm}px`;
        break;
      case "lg":
        baseStyle.padding = `${theme.spacing.md}px ${theme.spacing.lg}px`;
        break;
      case "md":
      default:
        baseStyle.padding = `${theme.spacing.sm}px ${theme.spacing.md}px`;
    }

    // Variant styles
    switch (variant) {
      case "secondary":
        baseStyle.background = theme.colors.secondary;
        baseStyle.color = "white";
        break;
      case "outline":
        baseStyle.background = "transparent";
        baseStyle.border = `1px solid ${theme.colors.primary}`;
        baseStyle.color = theme.colors.primary;
        break;
      case "ghost":
        baseStyle.background = "transparent";
        baseStyle.color = theme.colors.primary;
        break;
      case "primary":
      default:
        baseStyle.background = theme.colors.primary;
        baseStyle.color = "white";
    }

    // Disabled state
    if (disabled) {
      baseStyle.opacity = 0.5;
    }

    return { ...baseStyle, ...style };
  };

  const getTextStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      fontWeight: 600,
    };

    // Size styles
    switch (size) {
      case "sm":
        baseStyle.fontSize = 14;
        break;
      case "lg":
        baseStyle.fontSize = 18;
        break;
      case "md":
      default:
        baseStyle.fontSize = 16;
    }

    return { ...baseStyle, ...textStyle };
  };

  return (
    <button
      style={getButtonStyle()}
      onClick={onClick}
      disabled={disabled || loading}
      type="button"
    >
      {loading ? (
        <span style={{ marginRight: 8 }}>
          <span
            className="spinner"
            style={{
              width: 16,
              height: 16,
              border: "2px solid #f3f3f3",
              borderTop: `2px solid ${
                variant === "outline" || variant === "ghost"
                  ? theme.colors.primary
                  : "white"
              }`,
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 1s linear infinite",
              verticalAlign: "middle",
            }}
          />
          <style>
            {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
          </style>
        </span>
      ) : null}
      <span style={getTextStyle()}>{title}</span>
    </button>
  );
};

export default Button;