"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import axios from 'axios';

export default function RedirectAfterSignUp() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      console.log("User loaded in RedirectAfterSignUp:", user);
      console.log("User ID:", user.id);
      console.log("User email:", user.emailAddresses);
      // Create user record in our database first
      createUserRecord(user);
    } else if (isLoaded && !user) {
      console.log("User not loaded yet or not signed in");
    }
  }, [isLoaded, user]);

  const createUserRecord = async (user: any) => {
    try {
      // Always try to create or update the user record first
      console.log('Creating user record for:', user.id);
      
      const userData = {
        name: user.fullName || user.username || 'New User',
        email: user.emailAddresses[0]?.emailAddress || '',
        // Add minimal data to ensure user creation
        onboardingCompleted: false
      };
      
      console.log('Sending user data:', userData);
      
      const response = await axios.post('/api/user', userData);
      console.log('API response:', response.data);

      // Check if the user already exists and has completed onboarding
      try {
        const userResponse = await axios.get('/api/user');
        console.log('User data response:', userResponse.data);
        const userData = userResponse.data;
        
        if (userData.onboardingCompleted) {
          // User has already completed onboarding, redirect to meal-plan
          router.push('/meal-plan');
        } else {
          // User exists but hasn't completed onboarding, redirect to user-info
          router.push('/user-info');
        }
      } catch (error) {
        // If there's an error, just redirect to user-info to complete profile
        console.error('Error checking user data:', error);
        router.push('/user-info');
      }
    } catch (error) {
      console.error('Error creating user record:', error);
      // Still redirect to user-info page even if there's an error
      router.push('/user-info');
    }
  };

  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      Setting up your account...
    </div>
  );
}
