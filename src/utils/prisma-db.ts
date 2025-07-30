import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined;
}

// Create a singleton instance of Prisma Client
export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Initialize database (create tables if they don't exist)
// Note: Prisma handles this automatically with migrations, but we'll keep this for compatibility
export async function initializeDatabase() {
  try {
    console.log('Checking database connection...');
    await prisma.$connect();
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    return false;
  }
}

export default prisma;
