#!/usr/bin/env tsx
/**
 * Destination Seed Script
 * Seeds initial travel destinations for the application
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const destinations = [
  {
    name: 'United States',
    code: 'USA',
    flagEmoji: '🇺🇸',
    description: 'United States of America - Land of opportunity with diverse visa options',
    isActive: true,
    displayOrder: 1,
  },
  {
    name: 'France',
    code: 'FR',
    flagEmoji: '🇫🇷',
    description: 'France - Cultural hub of Europe with Schengen visa access',
    isActive: true,
    displayOrder: 2,
  },
  {
    name: 'Japan',
    code: 'JP',
    flagEmoji: '🇯🇵',
    description: 'Japan - Advanced economy with work and study opportunities',
    isActive: true,
    displayOrder: 3,
  },
  {
    name: 'Ukraine',
    code: 'UA',
    flagEmoji: '🇺🇦',
    description: 'Ukraine - Growing opportunities for education and business',
    isActive: true,
    displayOrder: 4,
  },
  {
    name: 'United Kingdom',
    code: 'GB',
    flagEmoji: '🇬🇧',
    description: 'United Kingdom - Premier destination for education and career',
    isActive: true,
    displayOrder: 5,
  },
];

async function seedDestinations() {
  console.log('🌍 Seeding destinations...\n');

  for (const destination of destinations) {
    try {
      const result = await prisma.destination.upsert({
        where: { code: destination.code },
        update: destination,
        create: destination,
      });
      console.log(`✅ ${result.flagEmoji} ${result.name} (${result.code})`);
    } catch (error) {
      console.error(`❌ Failed to seed ${destination.name}:`, error);
    }
  }

  console.log('\n✨ Destination seeding completed!');
}

seedDestinations()
  .catch((error) => {
    console.error('Error seeding destinations:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
