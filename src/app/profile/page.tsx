"use client";
import { UserButton, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import SignOutButton from '../../components/SignOutButton';

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loadingUserData, setLoadingUserData] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoadingUserData(false);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user]);

  if (!isLoaded || loadingUserData) {
    return <div style={{ padding: 32, textAlign: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return <div style={{ padding: 32, textAlign: 'center' }}>You are not signed in.</div>;
  }

  const isProfileIncomplete = !userData?.onboardingCompleted;

  return (
    <div style={{ 
      maxWidth: 600, 
      margin: '40px auto', 
      padding: 24, 
      background: '#fff', 
      borderRadius: 12, 
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
    }}>
      {/* Profile Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <UserButton afterSignOutUrl="/landing" />
        <div>
          <div style={{ fontWeight: 600, fontSize: 22 }}>
            {user.fullName || user.username || user.emailAddresses[0]?.emailAddress}
          </div>
          <div style={{ color: '#888', fontSize: 14 }}>
            {user.emailAddresses[0]?.emailAddress}
          </div>
        </div>
      </div>

      {/* Profile Completion Warning */}
      {isProfileIncomplete && (
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ 
            color: '#856404', 
            fontWeight: '600', 
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ⚠️ Profile Incomplete
          </div>
          <div style={{ color: '#856404', fontSize: '14px', marginBottom: '12px' }}>
            Complete your profile to get personalized meal recommendations.
          </div>
          <button
            onClick={() => router.push('/user-info')}
            style={{
              background: '#ffc107',
              color: '#212529',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Complete Profile
          </button>
        </div>
      )}

      {/* Profile Information */}
      {userData && userData.onboardingCompleted && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '16px',
            color: '#2c3e50'
          }}>
            Profile Information
          </h3>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            {userData.metrics && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666', fontSize: '14px' }}>Height:</span>
                  <span style={{ fontWeight: '500' }}>
                    {userData.metrics.feet}'{userData.metrics.inches}"
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666', fontSize: '14px' }}>Weight:</span>
                  <span style={{ fontWeight: '500' }}>{userData.metrics.weight} lbs</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666', fontSize: '14px' }}>Age:</span>
                  <span style={{ fontWeight: '500' }}>{userData.metrics.age} years</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666', fontSize: '14px' }}>Gender:</span>
                  <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>
                    {userData.metrics.gender}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666', fontSize: '14px' }}>Activity Level:</span>
                  <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>
                    {userData.metrics.activityLevel?.replace('_', ' ')}
                  </span>
                </div>
              </>
            )}
            
            {userData.goal && userData.goal.type && userData.goal.type.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666', fontSize: '14px' }}>Goals:</span>
                <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>
                  {userData.goal.type.map((goal: string) => 
                    goal.replace('_', ' ')
                  ).join(', ')}
                </span>
              </div>
            )}
            
            {userData.dietPreferences?.allergies && userData.dietPreferences.allergies.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666', fontSize: '14px' }}>Allergies:</span>
                <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>
                  {userData.dietPreferences.allergies.join(', ')}
                </span>
              </div>
            )}
            
            {userData.dietPreferences?.dietType && userData.dietPreferences.dietType.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666', fontSize: '14px' }}>Diet:</span>
                <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>
                  {userData.dietPreferences.dietType.map((diet: string) => 
                    diet.replace('_', ' ')
                  ).join(', ')}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => router.push('/user-info')}
            style={{
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              marginTop: '16px',
              width: '100%'
            }}
          >
            Edit Profile
          </button>
        </div>
      )}

      {/* Sign Out */}
      <div style={{ marginTop: 32 }}>
        <SignOutButton afterSignOutUrl="/landing" />
      </div>
    </div>
  );
}
