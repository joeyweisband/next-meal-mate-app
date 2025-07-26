"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function SignUpHandler() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isLoaded && user && !isCreatingUser && !success) {
      setIsCreatingUser(true);
      createUserRecord();
    }
  }, [isLoaded, user, success]);

  const createUserRecord = async () => {
    if (!user) return;

    try {
      console.log('SignUpHandler - Creating user record for:', user.id);
      
      // Try the test endpoint first (most reliable)
      const testResponse = await fetch('/api/test-create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: user.fullName || user.username || 'New User',
          email: user.emailAddresses[0]?.emailAddress || '',
        }),
      });
      
      const testResult = await testResponse.json();
      console.log('SignUpHandler - Test API response:', testResult);
      
      if (testResult.success) {
        setSuccess(true);
        setIsCreatingUser(false);
        
        // Redirect based on onboarding status
        if (testResult.user?.onboarding_completed) {
          router.push('/meal-plan');
        } else {
          router.push('/user-info');
        }
        return;
      }
      
      // If test endpoint fails, try the regular API endpoint
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.fullName || user.username || 'New User',
          email: user.emailAddresses[0]?.emailAddress || '',
        }),
      });
      
      const result = await response.json();
      console.log('SignUpHandler - Regular API response:', result);
      
      if (result.success) {
        setSuccess(true);
        
        // Check user status
        const userResponse = await fetch('/api/user');
        const userData = await userResponse.json();
        
        if (userData.onboardingCompleted) {
          router.push('/meal-plan');
        } else {
          router.push('/user-info');
        }
      } else {
        setError('Failed to create user record');
      }
    } catch (err) {
      console.error('Error in SignUpHandler:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsCreatingUser(false);
    }
  };

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded" 
          onClick={() => {
            setError(null);
            setIsCreatingUser(false);
            createUserRecord();
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 text-center">
      <p className="text-gray-600">
        {isCreatingUser ? 'Setting up your account...' : 'Redirecting...'}
      </p>
    </div>
  );
}
