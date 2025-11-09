-- Add unique constraint to firebaseId column
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firebaseId" TEXT, ADD CONSTRAINT "User_firebaseId_key" UNIQUE ("firebaseId");
