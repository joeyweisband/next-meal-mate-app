-- Migration: Populate date column from createdAt timestamp
-- This extracts the date portion (YYYY-MM-DD) from the createdAt column
-- and updates the date column for all existing MealPlan records

UPDATE "MealPlan"
SET date = TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD')
WHERE date = '2025-01-01' OR date IS NULL;

-- Verify the update
-- SELECT id, "userId", date, "createdAt", status FROM "MealPlan" ORDER BY "createdAt" DESC LIMIT 10;
