import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function migrateDates() {
  try {
    console.log('Starting date migration...');

    // Read the SQL migration file
    const sqlPath = path.join(__dirname, '../prisma/migrations/populate_date_from_created_at.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Extract just the UPDATE statement (remove comments)
    const updateStatement = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n')
      .split(';')[0]; // Take only the first statement

    console.log('Executing SQL:', updateStatement);

    // Execute the migration
    const result = await prisma.$executeRawUnsafe(updateStatement);

    console.log(`✓ Migration completed. Updated ${result} records.`);

    // Verify the results
    const sampleRecords = await prisma.mealPlan.findMany({
      select: {
        id: true,
        userId: true,
        date: true,
        createdAt: true,
        status: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    console.log('\nSample records after migration:');
    console.table(sampleRecords);

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateDates()
  .then(() => {
    console.log('\n✓ Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Migration script failed:', error);
    process.exit(1);
  });
