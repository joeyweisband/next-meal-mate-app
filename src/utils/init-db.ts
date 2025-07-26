import { initializeDatabase } from '@/utils/db';

// Function to initialize the database
const initDb = async () => {
  try {
    await initializeDatabase();
    console.log('Database initialized on app startup');
  } catch (error) {
    console.error('Failed to initialize database on app startup:', error);
  }
};

// Initialize database when this file is imported
initDb();

export { };
