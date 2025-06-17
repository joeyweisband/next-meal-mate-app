import React from 'react';
import { theme } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({ children, style }) => {
  return (
    <div
      style={{
        background: theme.colors.card,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        boxShadow: theme.shadows.small.boxShadow,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default Card;