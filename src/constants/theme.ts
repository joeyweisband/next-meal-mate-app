import Colors from './colors';

export const theme = {
  colors: Colors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 9999,
  },
  typography: {
    h1: {
      fontSize: 28,
      fontWeight: '700',
      color: Colors.text,
    },
    h2: {
      fontSize: 24,
      fontWeight: '700',
      color: Colors.text,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      color: Colors.text,
    },
    h4: {
      fontSize: 18,
      fontWeight: '600',
      color: Colors.text,
    },
    body: {
      fontSize: 16,
      color: Colors.text,
    },
    bodySmall: {
      fontSize: 14,
      color: Colors.textSecondary,
    },
    caption: {
      fontSize: 12,
      color: Colors.textSecondary,
    },
  },
  shadows: {
    small: {
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    },
    medium: {
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    large: {
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
    },
  },
};

// Note: globalStyles is not used in web. Use CSS, CSS modules, or styled-components for layout.
export const globalStyles = {};