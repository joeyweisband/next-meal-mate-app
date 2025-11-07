const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateDates() {
  try {
    console.log('Starting date migration...');
    console.log('Extracting dates from createdAt timestamps...\n');

    // Execute the migration using raw SQL
    const updateQuery = `
      UPDATE "MealPlan"
      SET date = TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD')
      WHERE date = '2025-01-01' OR date IS NULL
    `;

    const result = await prisma.$executeRawUnsafe(updateQuery);

    console.log(`✓ Migration completed. Updated ${result} records.\n`);

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
      take: 10
    });

    console.log('Sample records after migration:');
    console.log('-----------------------------------');
    sampleRecords.forEach(record => {
      console.log(`Date: ${record.date} | Created: ${record.createdAt.toISOString().split('T')[0]} | Status: ${record.status}`);
    });
    console.log('-----------------------------------\n');

    // Count records by status
    const activeCount = await prisma.mealPlan.count({ where: { status: 'active' } });
    const historicalCount = await prisma.mealPlan.count({ where: { status: 'historical' } });

    console.log(`Total active plans: ${activeCount}`);
    console.log(`Total historical plans: ${historicalCount}`);

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
