'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function WelcomePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [animationStage, setAnimationStage] = useState<'pullUp' | 'show' | 'spinDown'>('pullUp');

  useEffect(() => {
    if (!isLoaded || !user) return;

    // Animation sequence
    const timer1 = setTimeout(() => {
      setAnimationStage('show');
    }, 600); // Pull up completes

    const timer2 = setTimeout(() => {
      setAnimationStage('spinDown');
    }, 2800); // Show welcome for 2.2 seconds

    const timer3 = setTimeout(async () => {
      // Check if user has completed onboarding to decide where to redirect
      try {
        const response = await fetch('/api/user');
        const userData = await response.json();

        if (userData.onboardingCompleted) {
          router.push('/meal-plan');
        } else {
          router.push('/user-info');
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        // Default to user-info if there's an error
        router.push('/user-info');
      }
    }, 3600); // Spin down completes

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isLoaded, user, router]);

  if (!isLoaded || !user) {
    return null;
  }

  const firstName = user.firstName || 'there';

  return (
    <>
      <div className="welcome-backdrop" />
      <div className="welcome-container">
        <div className={`welcome-card ${animationStage}`}>
          <div className="welcome-icon">🎉</div>
          <h1 className="welcome-title">Welcome{firstName && `, ${firstName}`}!</h1>
          <p className="welcome-subtitle">Ready to start your personalized meal planning journey?</p>
        </div>
      </div>

      <style jsx>{`
        .welcome-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          z-index: 9998;
        }

        .welcome-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .welcome-card {
          background: white;
          border-radius: 24px;
          padding: 48px 32px;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          max-width: 400px;
          width: 100%;
        }

        .welcome-card.pullUp {
          animation: pullUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .welcome-card.show {
          animation: none;
          transform: translateY(0) scale(1);
          opacity: 1;
        }

        .welcome-card.spinDown {
          animation: spinDown 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }

        .welcome-icon {
          font-size: 80px;
          margin-bottom: 24px;
          animation: bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.3s backwards;
        }

        .welcome-title {
          font-size: 32px;
          font-weight: bold;
          color: #1a202c;
          margin-bottom: 12px;
          animation: fadeInUp 0.6s ease-out 0.5s backwards;
        }

        .welcome-subtitle {
          font-size: 18px;
          color: #718096;
          animation: fadeInUp 0.6s ease-out 0.7s backwards;
        }

        @keyframes pullUp {
          from {
            transform: translateY(100vh) scale(0.8);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        @keyframes spinDown {
          0% {
            transform: translateY(0) scale(1) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) scale(0.4) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes bounceIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @media (max-width: 640px) {
          .welcome-card {
            padding: 40px 24px;
          }

          .welcome-icon {
            font-size: 64px;
          }

          .welcome-title {
            font-size: 28px;
          }

          .welcome-subtitle {
            font-size: 16px;
          }
        }
      `}</style>
    </>
  );
}
