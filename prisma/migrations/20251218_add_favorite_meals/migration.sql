-- CreateTable
CREATE TABLE "FavoriteMeal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ingredients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preparation" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "calories" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,
    "fat" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteMeal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FavoriteMeal_userId_idx" ON "FavoriteMeal"("userId");

-- AddForeignKey
ALTER TABLE "FavoriteMeal" ADD CONSTRAINT "FavoriteMeal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
