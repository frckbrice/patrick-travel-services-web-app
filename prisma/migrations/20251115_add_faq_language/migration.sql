-- Add language column to FAQ
ALTER TABLE "FAQ"
ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en';

-- Index for faster language filtering
CREATE INDEX "FAQ_language_idx" ON "FAQ"("language");

