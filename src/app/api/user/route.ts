import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import prisma, { initializeDatabase } from '@/utils/prisma-db';

export async function GET(request: NextRequest) {
  try {
    // Initialize database connection
    await initializeDatabase();
    
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const dbUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      metrics: {
        feet: dbUser.feet,
        inches: dbUser.inches,
        weight: dbUser.weight,
        age: dbUser.age,
        gender: dbUser.gender,
        activityLevel: dbUser.activity_level,
      },
      goal: {
        type: dbUser.goal_type,
        targetWeight: dbUser.target_weight,
        timeframe: dbUser.timeframe,
      },
      dietPreferences: {
        dietType: dbUser.diet_type,
        allergies: dbUser.allergies,
        customRestrictions: dbUser.custom_restrictions,
      },
      onboardingCompleted: dbUser.onboarding_completed,
      welcomeShown: dbUser.welcome_shown,
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Initialize database connection
    await initializeDatabase();
    
    const { userId } = getAuth(request);
    console.log("API - User ID from Clerk:", userId);
    
    if (!userId) {
      console.log("API - No user ID found in request");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    console.log("API - Received user data:", { ...data, userId });
    
    // Upsert user (create if doesn't exist, update if exists)
    const result = await prisma.user.upsert({
      where: { id: userId },
      update: {
        feet: data.metrics?.feet,
        inches: data.metrics?.inches,
        weight: data.metrics?.weight,
        age: data.metrics?.age,
        gender: data.metrics?.gender,
        activity_level: data.metrics?.activityLevel,
        goal_type: data.goal?.type,
        target_weight: data.goal?.targetWeight,
        timeframe: data.goal?.timeframe,
        diet_type: data.dietPreferences?.dietType,
        allergies: data.dietPreferences?.allergies,
        custom_restrictions: data.dietPreferences?.customRestrictions,
        onboarding_completed: data.onboardingCompleted !== undefined ? data.onboardingCompleted : true,
        welcome_shown: data.welcome_shown !== undefined ? data.welcome_shown : undefined
      },
      create: {
        id: userId,
        clerkId: userId, // Save Clerk ID
        name: data.name || "New User",
        email: data.email || "",
        feet: data.metrics?.feet,
        inches: data.metrics?.inches,
        weight: data.metrics?.weight,
        age: data.metrics?.age,
        gender: data.metrics?.gender,
        activity_level: data.metrics?.activityLevel,
        goal_type: data.goal?.type || [],
        target_weight: data.goal?.targetWeight,
        timeframe: data.goal?.timeframe,
        diet_type: data.dietPreferences?.dietType || [],
        allergies: data.dietPreferences?.allergies || [],
        custom_restrictions: data.dietPreferences?.customRestrictions,
        onboarding_completed: data.onboardingCompleted || false,
        welcome_shown: data.welcome_shown || false
      }
    });
    
    console.log("API - User upserted successfully:", result);
    return NextResponse.json({ success: true, user: result });
  } catch (error) {
    console.error('Error updating user data:', error);
    // Detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
