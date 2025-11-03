-- Add unique constraint to firebaseId column
ALTER TABLE "User" ADD CONSTRAINT "User_firebaseId_key" UNIQUE ("firebaseId");
