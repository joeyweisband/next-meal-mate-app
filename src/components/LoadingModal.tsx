"use client";
import React, { useEffect, useState } from 'react';

interface LoadingModalProps {
  isVisible: boolean;
}

const LoadingModal: React.FC<LoadingModalProps> = ({ isVisible }) => {
  const [cookingStep, setCookingStep] = useState(0);

  const cookingMessages = [
    "🔍 Analyzing your dietary preferences...",
    "📊 Calculating optimal macros...",
    "🥗 Selecting fresh ingredients...",
    "👨‍🍳 Crafting delicious recipes...",
    "✨ Personalizing your meal plan...",
    "🍽️ Almost ready..."
  ];

  useEffect(() => {
    if (!isVisible) {
      setCookingStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCookingStep((prev) => (prev + 1) % cookingMessages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: 'fadeIn 0.3s ease-in',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '1.5rem',
          padding: '3rem 2rem',
          maxWidth: '400px',
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Animated cooking pot */}
        <div
          style={{
            fontSize: '5rem',
            marginBottom: '1.5rem',
            animation: 'bounce 1s ease-in-out infinite',
            display: 'inline-block',
          }}
        >
          🍳
        </div>

        {/* Loading spinner */}
        <div
          style={{
            width: '60px',
            height: '60px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            margin: '1.5rem auto',
            animation: 'spin 1s linear infinite',
          }}
        />

        {/* Cooking message */}
        <div
          style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#2c3e50',
            marginBottom: '0.5rem',
          }}
        >
          Creating Your Perfect Meal Plan
        </div>

        <div
          style={{
            fontSize: '0.95rem',
            color: '#667eea',
            minHeight: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeInText 0.5s ease-in',
          }}
          key={cookingStep}
        >
          {cookingMessages[cookingStep]}
        </div>

        {/* Progress dots */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'center',
            marginTop: '2rem',
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#667eea',
                animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @keyframes fadeInText {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingModal;
