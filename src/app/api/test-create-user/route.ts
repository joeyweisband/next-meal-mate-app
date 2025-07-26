import { NextRequest, NextResponse } from 'next/server';
import prisma, { initializeDatabase } from '@/utils/prisma-db';

export async function POST(request: NextRequest) {
  try {
    // Initialize database connection
    await initializeDatabase();
    
    const data = await request.json();
    console.log("TEST API - Received data:", data);
    
    if (!data.userId) {
      return NextResponse.json({ error: 'No userId provided' }, { status: 400 });
    }
    
    // Directly create a user for testing
    const result = await prisma.user.upsert({
      where: { id: data.userId },
      update: {
        name: data.name || "Test User",
        email: data.email || "test@example.com",
      },
      create: {
        id: data.userId,
        clerkId: data.userId,
        name: data.name || "Test User",
        email: data.email || "test@example.com",
        goal_type: [],
        diet_type: [],
        allergies: [],
        onboarding_completed: false
      }
    });
    
    console.log("TEST API - User created:", result);
    
    return NextResponse.json({ 
      success: true, 
      message: "User created successfully via test endpoint",
      user: result 
    });
  } catch (error) {
    console.error('TEST API - Error creating user:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
