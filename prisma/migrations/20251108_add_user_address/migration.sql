-- Add optional address fields to User
ALTER TABLE "User"
    ADD COLUMN "street" TEXT,
    ADD COLUMN "city" TEXT,
    ADD COLUMN "country" TEXT;
