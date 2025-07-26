"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import FormField from '@/components/FormField';
import RadioGroup from '@/components/RadioGroup';
import CheckboxGroup from '@/components/CheckboxGroup';
import Button from '@/components/Button';
import { 
  Gender, ActivityLevel, GoalType, DietType, Allergy,
  UserMetrics, UserGoal, DietPreferences, User
} from '@/types/user';
import axios from 'axios';

export default function UserInfoPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    metrics: Partial<UserMetrics>;
    goal: Partial<UserGoal>;
    dietPreferences: Partial<DietPreferences>;
  }>({
    metrics: {
      feet: undefined,
      inches: undefined,
      weight: undefined,
      age: undefined,
      gender: undefined,
      activityLevel: undefined,
    },
    goal: {
      type: [],
      targetWeight: undefined,
      timeframe: undefined,
    },
    dietPreferences: {
      dietType: [],
      allergies: [],
      customRestrictions: '',
    },
  });

  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
  ];

  const activityOptions = [
    { label: 'Sedentary (little or no exercise)', value: 'sedentary' },
    { label: 'Light (light exercise 1-3 days/week)', value: 'light' },
    { label: 'Moderate (moderate exercise 3-5 days/week)', value: 'moderate' },
    { label: 'Active (hard exercise 6-7 days/week)', value: 'active' },
    { label: 'Very Active (physical job or training twice a day)', value: 'very_active' },
  ];

  const goalOptions = [
    { label: 'Lose Weight', value: 'lose_weight' },
    { label: 'Maintain Weight', value: 'maintain_weight' },
    { label: 'Gain Muscle', value: 'gain_muscle' },
  ];

  const dietOptions = [
    { label: 'Standard', value: 'standard' },
    { label: 'Low Carb', value: 'low_carb' },
    { label: 'Keto', value: 'keto' },
    { label: 'Mediterranean', value: 'mediterranean' },
    { label: 'Vegetarian', value: 'vegetarian' },
    { label: 'Vegan', value: 'vegan' },
    { label: 'Paleo', value: 'paleo' },
    { label: 'Custom', value: 'custom' },
  ];

  const allergyOptions = [
    { label: 'Dairy', value: 'dairy' },
    { label: 'Gluten', value: 'gluten' },
    { label: 'Nuts', value: 'nuts' },
    { label: 'Shellfish', value: 'shellfish' },
    { label: 'Soy', value: 'soy' },
    { label: 'Eggs', value: 'eggs' },
    { label: 'Fish', value: 'fish' },
    { label: 'Other', value: 'other' },
  ];

  useEffect(() => {
    if (isLoaded && clerkUser) {
      // Fetch user info from our database
      fetchUserInfo();
    }
  }, [isLoaded, clerkUser]);

  const fetchUserInfo = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/user');
      
      // User exists in our database
      const userData = response.data;
      
      setUserInfo({
        metrics: userData.metrics || userInfo.metrics,
        goal: userData.goal || userInfo.goal,
        dietPreferences: userData.dietPreferences || userInfo.dietPreferences,
      });
      
      setIsNewUser(!userData.onboardingCompleted);
    } catch (error) {
      // User doesn't exist in our database yet
      setIsNewUser(true);
      
      // If we have user data from Clerk, use it
      if (clerkUser) {
        // Initialize with data from Clerk if available
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserInfo = async () => {
    try {
      setIsSaving(true);
      
      await axios.post('/api/user', {
        ...userInfo,
        name: clerkUser?.fullName || clerkUser?.username,
        email: clerkUser?.emailAddresses[0]?.emailAddress,
      });
      
      // After successful save, redirect to meal plan page
      router.push('/meal-plan');
    } catch (error) {
      console.error('Error saving user info:', error);
      alert('Failed to save your information. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateMetrics = (key: keyof UserMetrics, value: any) => {
    setUserInfo(prev => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        [key]: value,
      },
    }));
  };

  const updateGoal = (key: keyof UserGoal, value: any) => {
    setUserInfo(prev => ({
      ...prev,
      goal: {
        ...prev.goal,
        [key]: value,
      },
    }));
  };

  const updateDietPreferences = (key: keyof DietPreferences, value: any) => {
    setUserInfo(prev => ({
      ...prev,
      dietPreferences: {
        ...prev.dietPreferences,
        [key]: value,
      },
    }));
  };

  if (!isLoaded || isLoading) {
    return <div style={{ padding: 32, textAlign: 'center' }}>Loading...</div>;
  }

  if (!clerkUser) {
    return <div style={{ padding: 32, textAlign: 'center' }}>Please sign in to continue.</div>;
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001' }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>
        {isNewUser ? 'Complete Your Profile' : 'Update Your Profile'}
      </h1>
      
      {isNewUser && (
        <div style={{ padding: 16, backgroundColor: '#f0f8ff', borderRadius: 8, marginBottom: 24 }}>
          <p>Welcome to MealMate! Please provide your information to help us create personalized meal plans for you.</p>
        </div>
      )}
      
      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 16 }}>Personal Metrics</h2>
      
      <FormField
        label="Age"
        type="number"
        value={userInfo.metrics.age?.toString() || ''}
        onChange={val => updateMetrics('age', parseInt(val) || undefined)}
        placeholder="Enter your age"
      />
      
      <div style={{ display: 'flex', gap: 16 }}>
        <FormField
          label="Height (ft)"
          type="number"
          value={userInfo.metrics.feet?.toString() || ''}
          onChange={val => updateMetrics('feet', parseFloat(val) || undefined)}
          placeholder="Feet"
          style={{ flex: 1 }}
        />
        
        <FormField
          label="(in)"
          type="number"
          value={userInfo.metrics.inches?.toString() || ''}
          onChange={val => updateMetrics('inches', parseFloat(val) || undefined)}
          placeholder="Inches"
          style={{ flex: 1 }}
        />
      </div>
      
      <FormField
        label="Weight (lbs)"
        type="number"
        value={userInfo.metrics.weight?.toString() || ''}
        onChange={val => updateMetrics('weight', parseFloat(val) || undefined)}
        placeholder="Enter your weight in pounds"
      />
      
      <RadioGroup
        label="Gender"
        options={genderOptions}
        value={userInfo.metrics.gender || ''}
        onChange={val => updateMetrics('gender', val as Gender)}
      />
      
      <RadioGroup
        label="Activity Level"
        options={activityOptions}
        value={userInfo.metrics.activityLevel || ''}
        onChange={val => updateMetrics('activityLevel', val as ActivityLevel)}
      />
      
      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 16 }}>Your Goals</h2>
      
      <CheckboxGroup
        label="Goals"
        options={goalOptions}
        value={userInfo.goal.type as string[] || []}
        onChange={val => updateGoal('type', val as GoalType[])}
      />
      
      {userInfo.goal.type && userInfo.goal.type.includes('lose_weight' as GoalType) && (
        <>
          <FormField
            label="Target Weight (lbs)"
            type="number"
            value={userInfo.goal.targetWeight?.toString() || ''}
            onChange={val => updateGoal('targetWeight', parseFloat(val) || undefined)}
            placeholder="Enter your target weight"
          />
          
          <FormField
            label="Timeframe (weeks)"
            type="number"
            value={userInfo.goal.timeframe?.toString() || ''}
            onChange={val => updateGoal('timeframe', parseInt(val) || undefined)}
            placeholder="Enter your goal timeframe"
          />
        </>
      )}
      
      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 16 }}>Diet Preferences</h2>
      
      <CheckboxGroup
        label="Diet Type"
        options={dietOptions}
        value={userInfo.dietPreferences.dietType as string[] || []}
        onChange={val => updateDietPreferences('dietType', val as DietType[])}
      />
      
      <CheckboxGroup
        label="Allergies"
        options={allergyOptions}
        value={userInfo.dietPreferences.allergies as string[] || []}
        onChange={val => updateDietPreferences('allergies', val as Allergy[])}
      />
      
      <FormField
        label="Custom Restrictions"
        value={userInfo.dietPreferences.customRestrictions || ''}
        onChange={val => updateDietPreferences('customRestrictions', val)}
        placeholder="Enter any other dietary restrictions"
      />
      
      <div style={{ marginTop: 32 }}>
        <Button
          title={isSaving ? 'Saving...' : 'Save Profile'}
          onClick={saveUserInfo}
          disabled={isSaving}
          fullWidth
        />
      </div>
    </div>
  );
}
