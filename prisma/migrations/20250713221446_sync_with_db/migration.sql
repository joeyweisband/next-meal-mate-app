-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "feet" INTEGER,
    "inches" INTEGER,
    "weight" DOUBLE PRECISION,
    "age" INTEGER,
    "gender" TEXT,
    "activity_level" TEXT,
    "goal_type" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "target_weight" DOUBLE PRECISION,
    "timeframe" INTEGER,
    "diet_type" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "custom_restrictions" TEXT,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
