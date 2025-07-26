import { neon } from '@neondatabase/serverless';

// Initialize the Neon SQL client
const sql = neon(process.env.DATABASE_URL!);

export default sql;

// Helper function to execute queries with proper error handling
export async function executeQuery(query: string, params: any[] = []) {
  try {
    // Use sql.query for conventional function calls with placeholders
    // Example: executeQuery(queries.getUserById, [userId])
    return await sql.query(query, params);
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    console.log('Initializing database tables...');
    await executeQuery(queries.createUserTable);
    console.log('Database tables initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize database tables:', error);
    return false;
  }
}

// Define common SQL queries
export const queries = {
  // User queries
  createUserTable: `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      feet INTEGER,
      inches INTEGER,
      weight REAL,
      age INTEGER,
      gender TEXT,
      activity_level TEXT,
      goal_type TEXT[],
      target_weight REAL,
      timeframe INTEGER,
      diet_type TEXT[],
      allergies TEXT[],
      custom_restrictions TEXT,
      onboarding_completed BOOLEAN DEFAULT FALSE
    )
  `,
  getUserById: `
    SELECT * FROM users WHERE id = $1
  `,
  createUser: `
    INSERT INTO users (id, name, email) VALUES ($1, $2, $3)
    ON CONFLICT (id) DO NOTHING
  `,
  updateUserInfo: `
    UPDATE users
    SET 
      feet = $2,
      inches = $3,
      weight = $4,
      age = $5,
      gender = $6,
      activity_level = $7,
      goal_type = $8,
      target_weight = $9,
      timeframe = $10,
      diet_type = $11,
      allergies = $12,
      custom_restrictions = $13,
      onboarding_completed = TRUE
    WHERE id = $1
  `,
  checkUserOnboarding: `
    SELECT onboarding_completed FROM users WHERE id = $1
  `,
};
