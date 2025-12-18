import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import prisma, { initializeDatabase } from '@/utils/prisma-db';

// GET - Fetch all favorites for the user
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();

    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const favorites = await prisma.favoriteMeal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// POST - Add a meal to favorites
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, type, ingredients, preparation, calories, protein, carbs, fat, reasoning } = data;

    // Validate required fields
    if (!name || !type || !ingredients || !preparation || calories === undefined || protein === undefined || carbs === undefined || fat === undefined) {
      return NextResponse.json({
        error: 'Missing required fields',
        required: ['name', 'type', 'ingredients', 'preparation', 'calories', 'protein', 'carbs', 'fat']
      }, { status: 400 });
    }

    // Create the favorite meal
    const favorite = await prisma.favoriteMeal.create({
      data: {
        userId,
        name,
        type,
        ingredients: Array.isArray(ingredients) ? ingredients : [],
        preparation: Array.isArray(preparation) ? preparation : [],
        calories: parseFloat(calories.toString()),
        protein: parseFloat(protein.toString()),
        carbs: parseFloat(carbs.toString()),
        fat: parseFloat(fat.toString()),
        reasoning: reasoning || null,
      }
    });

    return NextResponse.json({
      success: true,
      favorite
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// DELETE - Remove a meal from favorites
export async function DELETE(request: NextRequest) {
  try {
    await initializeDatabase();

    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { favoriteId } = data;

    if (!favoriteId) {
      return NextResponse.json({
        error: 'Missing favoriteId'
      }, { status: 400 });
    }

    // Verify the favorite belongs to the user before deleting
    const favorite = await prisma.favoriteMeal.findUnique({
      where: { id: favoriteId }
    });

    if (!favorite) {
      return NextResponse.json({
        error: 'Favorite not found'
      }, { status: 404 });
    }

    if (favorite.userId !== userId) {
      return NextResponse.json({
        error: 'Unauthorized - This favorite does not belong to you'
      }, { status: 403 });
    }

    // Delete the favorite
    await prisma.favoriteMeal.delete({
      where: { id: favoriteId }
    });

    return NextResponse.json({
      success: true,
      message: 'Favorite removed successfully'
    });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
