"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import FormField from '../../components/FormField';
import Button from '../../components/Button';
import RadioGroup from '../../components/RadioGroup';
import CheckboxGroup from '../../components/CheckboxGroup';

const UserInfoPage: React.FC = () => {
  const { user } = useUser();
  const router = useRouter();
  
  // Form state
  const [weight, setWeight] = useState('');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [fitnessGoals, setFitnessGoals] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [dietType, setDietType] = useState<string[]>([]);
  const [targetWeight, setTargetWeight] = useState('');
  const [timeframe, setTimeframe] = useState('');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Load existing user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const userData = await response.json();
          
          // Populate form with existing data
          if (userData.metrics) {
            setWeight(userData.metrics.weight?.toString() || '');
            setHeightFeet(userData.metrics.feet?.toString() || '');
            setHeightInches(userData.metrics.inches?.toString() || '');
            setAge(userData.metrics.age?.toString() || '');
            setGender(userData.metrics.gender || '');
            setActivityLevel(userData.metrics.activityLevel || '');
          }
          
          if (userData.goal) {
            setFitnessGoals(userData.goal.type || []);
            setTargetWeight(userData.goal.targetWeight?.toString() || '');
            setTimeframe(userData.goal.timeframe?.toString() || '');
          }
          
          if (userData.dietPreferences) {
            setAllergies(userData.dietPreferences.allergies || []);
            setDietType(userData.dietPreferences.dietType || []);
          }
          
          // If user has completed onboarding, set editing mode
          if (userData.onboardingCompleted) {
            setIsEditing(true);
          }
        }
      } catch (err) {
        console.error('Error loading user data:', err);
      }
    };

    if (user) {
      loadUserData();
    }
  }, [user]);

  const validateForm = () => {
    if (!weight || parseFloat(weight) <= 0) {
      setError('Please enter a valid weight');
      return false;
    }
    
    if (!heightFeet || parseInt(heightFeet) <= 0 || parseInt(heightFeet) > 8) {
      setError('Please enter a valid height (feet)');
      return false;
    }
    
    if (!heightInches || parseInt(heightInches) < 0 || parseInt(heightInches) >= 12) {
      setError('Please enter valid inches (0-11)');
      return false;
    }
    
    if (!age || parseInt(age) <= 0 || parseInt(age) > 120) {
      setError('Please enter a valid age');
      return false;
    }
    
    if (!gender) {
      setError('Please select your gender');
      return false;
    }
    
    if (!activityLevel) {
      setError('Please select your activity level');
      return false;
    }
    
    if (fitnessGoals.length === 0) {
      setError('Please select at least one fitness goal');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const userData = {
        name: user?.fullName || user?.username || 'User',
        email: user?.emailAddresses?.[0]?.emailAddress || '',        
        metrics: {
          weight: parseFloat(weight),
          feet: parseInt(heightFeet),
          inches: parseInt(heightInches),
          age: parseInt(age),
          gender,
          activityLevel,
        },
        goal: {
          type: fitnessGoals,
          targetWeight: targetWeight ? parseFloat(targetWeight) : undefined,
          timeframe: timeframe ? parseInt(timeframe) : undefined,    
        },
        dietPreferences: {
          dietType,
          allergies,
        },
        onboardingCompleted: true,
      };

      console.log('Submitting user data:', userData);      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        router.push('/meal-plan');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save user information');
      }
    } catch (err) {
      console.error('Error saving user info:', err);
      setError('Failed to save user information');
    } finally {
      setIsLoading(false);
    }
  };

  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
  ];

  const activityOptions = [
    { label: 'Sedentary (little to no exercise)', value: 'sedentary' },
    { label: 'Light (light exercise 1-3 days/week)', value: 'light' },
    { label: 'Moderate (moderate exercise 3-5 days/week)', value: 'moderate' },
    { label: 'Active (hard exercise 6-7 days/week)', value: 'active' },
    { label: 'Very Active (very hard exercise, physical job)', value: 'very_active' },
  ];

  const fitnessGoalOptions = [
    { label: 'Lose Weight', value: 'lose_weight' },
    { label: 'Maintain Weight', value: 'maintain_weight' },
    { label: 'Gain Weight', value: 'gain_weight' },
    { label: 'Gain Muscle', value: 'gain_muscle' },
    { label: 'Improve Overall Health', value: 'improve_health' },
    { label: 'Increase Energy', value: 'increase_energy' },
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

  const dietTypeOptions = [
    { label: 'Standard', value: 'standard' },
    { label: 'Low Carb', value: 'low_carb' },
    { label: 'Keto', value: 'keto' },
    { label: 'Mediterranean', value: 'mediterranean' },
    { label: 'Vegetarian', value: 'vegetarian' },
    { label: 'Vegan', value: 'vegan' },
    { label: 'Paleo', value: 'paleo' },
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa',
      padding: '2rem 1rem'
    }}>
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto', 
        backgroundColor: '#fff',
        borderRadius: '1rem',
        padding: '2rem',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            color: '#2c3e50',
            marginBottom: '0.5rem'
          }}>
            {isEditing ? 'Update Your Profile' : 'Complete Your Profile'}
          </h1>
          <p style={{ 
            color: '#7f8c8d', 
            fontSize: '1rem',
            lineHeight: '1.5'
          }}>
            {isEditing 
              ? 'Update your information to get better meal recommendations'
              : 'Help us create personalized meal plans just for you!'
            }
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fed7d7',
            color: '#e53e3e',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Weight */}
          <FormField
            label="Weight (pounds)"
            value={weight}
            onChange={setWeight}
            placeholder="Enter your weight"
            type="number"
          />

          {/* Height */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '600',
              color: '#2c3e50'
            }}>
              Height
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <FormField
                                  value={heightFeet}
                                  onChange={setHeightFeet}
                                  placeholder="Feet"
                                  type="number" label={''}                />
                <small style={{ color: '#7f8c8d', fontSize: '0.75rem' }}>Feet</small>
              </div>
              <div style={{ flex: 1 }}>
                <FormField
                                  value={heightInches}
                                  onChange={setHeightInches}
                                  placeholder="Inches"
                                  type="number" label={''}                />
                <small style={{ color: '#7f8c8d', fontSize: '0.75rem' }}>Inches (0-11)</small>
              </div>
            </div>
          </div>

          {/* Age */}
          <FormField
            label="Age"
            value={age}
            onChange={setAge}
            placeholder="Enter your age"
            type="number"
          />

          {/* Gender */}
          <RadioGroup
            label="Gender"
            options={genderOptions}
            value={gender}
            onChange={setGender}
          />

          {/* Activity Level */}
          <RadioGroup
            label="Activity Level"
            options={activityOptions}
            value={activityLevel}
            onChange={setActivityLevel}
          />

          {/* Fitness Goals */}
          <CheckboxGroup
            label="Fitness Goals (select all that apply)"
            options={fitnessGoalOptions}
            value={fitnessGoals}
            onChange={setFitnessGoals}
          />

          {/* Target Weight (optional) */}
          {fitnessGoals.includes('lose_weight') || fitnessGoals.includes('gain_weight') || fitnessGoals.includes('gain_muscle') ? (
            <FormField
              label={`Target Weight (pounds) - ${fitnessGoals.includes('lose_weight') ? 'Goal weight' : 'Target weight'}`}
              value={targetWeight}
              onChange={setTargetWeight}
              placeholder="Enter target weight (optional)"
              type="number"
            />
          ) : null}

          {/* Timeframe */}
          {(fitnessGoals.includes('lose_weight') || fitnessGoals.includes('gain_weight') || fitnessGoals.includes('gain_muscle')) && targetWeight ? (
            <FormField
              label="Timeframe (weeks)"
              value={timeframe}
              onChange={setTimeframe}
              placeholder="Enter timeframe in weeks (optional)"
              type="number"
            />
          ) : null}

          {/* Diet Preferences */}
          <CheckboxGroup
            label="Diet Preferences (optional)"
            options={dietTypeOptions}
            value={dietType}
            onChange={setDietType}
          />

          {/* Allergies */}
          <CheckboxGroup
            label="Allergies & Dietary Restrictions"
            options={allergyOptions}
            value={allergies}
            onChange={setAllergies}
          />

          {/* Submit Button */}
          <Button
            title={isEditing ? 'Update Profile' : 'Complete Profile'}
            onClick={handleSubmit}
            loading={isLoading}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              padding: '1rem',
              fontSize: '1.125rem',
              fontWeight: '600',
              marginTop: '1rem',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
            }}
          />

          {isEditing && (
            <button
              onClick={() => router.push('/meal-plan')}
              style={{
                background: 'transparent',
                color: '#667eea',
                border: '2px solid #667eea',
                borderRadius: '0.75rem',
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserInfoPage;
