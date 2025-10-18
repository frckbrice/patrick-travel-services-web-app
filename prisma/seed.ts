// Prisma database seed script
// Run with: pnpm prisma db seed

import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create first ADMIN user (to be manually created in Firebase Auth first)
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@patricktravel.com';
  const adminId = process.env.ADMIN_FIREBASE_UID;
  if (!adminId) {
    throw new Error('ADMIN_FIREBASE_UID environment variable is required');
  }
  const adminUserId: string = adminId; // Type assertion after validation

  const existingAdmin = await prisma.user.findUnique({
    where: { id: adminUserId },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists');
  } else {
    console.log(`📧 Creating admin user: ${adminEmail}`);
    console.log(`⚠️  Firebase UID: ${adminUserId}`);
    console.log(`⚠️  Note: You must create this user in Firebase Auth with the same UID!`);

    await prisma.user.create({
      data: {
        id: adminUserId,
        email: adminEmail,
        password: '', // Password managed by Firebase Auth, not stored in DB
        firstName: 'System',
        lastName: 'Administrator',
        phone: '+1234567890',
        role: 'ADMIN',
        isActive: true,
        isVerified: true,
      },
    });

    console.log('✅ Admin user created in database');
  }

  // Create sample invite codes with idempotent strategy
  console.log('🎟️  Creating sample invite codes...');

  /**
   * Helper function to get or create a valid seed invite code
   * Implements idempotent strategy:
   * 1. Find all seed codes for the given role
   * 2. Filter for valid ones (not expired, has remaining uses, isActive)
   * 3. If multiple valid codes exist, deactivate duplicates
   * 4. If no valid code exists, create a new one
   * 5. Use 'SEED' purpose marker for easy identification
   */
  async function getOrCreateSeedInviteCode(
    role: 'AGENT' | 'ADMIN',
    maxUses: number,
    expiryDays: number
  ) {
    const now = new Date();

    // Find all seed codes for this role
    const existingCodes = await prisma.inviteCode.findMany({
      where: {
        purpose: 'SEED',
        role: role,
        createdById: adminUserId,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter for valid codes (not expired, has remaining uses, is active)
    const validCodes = existingCodes.filter(
      (code) => code.isActive && code.expiresAt > now && code.usedCount < code.maxUses
    );

    // If we have valid codes
    if (validCodes.length > 0) {
      // Use the most recent valid code
      const selectedCode = validCodes[0];

      // If there are duplicate valid codes, deactivate older ones
      if (validCodes.length > 1) {
        const duplicateIds = validCodes.slice(1).map((c) => c.id);
        await prisma.inviteCode.updateMany({
          where: { id: { in: duplicateIds } },
          data: { isActive: false },
        });
        console.log(`   ⚠️  Deactivated ${duplicateIds.length} duplicate ${role} seed code(s)`);
      }

      // Also deactivate any expired or exhausted codes
      const invalidCodes = existingCodes.filter(
        (code) =>
          code.id !== selectedCode.id &&
          (code.expiresAt <= now || code.usedCount >= code.maxUses || !code.isActive)
      );

      if (invalidCodes.length > 0) {
        await prisma.inviteCode.updateMany({
          where: { id: { in: invalidCodes.map((c) => c.id) } },
          data: { isActive: false },
        });
        console.log(`   ♻️  Cleaned up ${invalidCodes.length} invalid ${role} seed code(s)`);
      }

      return selectedCode;
    }

    // No valid code exists, create a new one
    // Use deterministic prefix for easier identification: seed-{role}-{randomId}
    const newCode = await prisma.inviteCode.create({
      data: {
        code: `seed-${role.toLowerCase()}-${nanoid(12)}`,
        role: role,
        createdById: adminUserId,
        maxUses: maxUses,
        expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000),
        purpose: 'SEED',
        isActive: true,
      },
    });

    console.log(`   ✨ Created new ${role} seed code`);
    return newCode;
  }

  // Get or create seed invite codes with validation
  const agentCode = await getOrCreateSeedInviteCode('AGENT', 10, 30);
  const adminCode = await getOrCreateSeedInviteCode('ADMIN', 1, 7);

  console.log('✅ Invite codes ready:');
  console.log(`   AGENT Code: ${agentCode.code}`);
  console.log(`   - Max Uses: ${agentCode.maxUses}, Used: ${agentCode.usedCount}`);
  console.log(`   - Expires: ${agentCode.expiresAt.toISOString()}`);
  console.log(`   ADMIN Code: ${adminCode.code}`);
  console.log(`   - Max Uses: ${adminCode.maxUses}, Used: ${adminCode.usedCount}`);
  console.log(`   - Expires: ${adminCode.expiresAt.toISOString()}`);

  // Create sample FAQs
  console.log('📝 Creating sample FAQs...');

  const faqs = [
    {
      question: 'How long does visa processing take?',
      answer:
        'Processing times vary by country and visa type. Student visas typically take 4-8 weeks, while work permits can take 8-12 weeks. We keep you updated throughout the process.',
      category: 'Processing Times',
      order: 1,
    },
    {
      question: 'What documents do I need?',
      answer:
        'Required documents vary by service type. Generally, you will need: valid passport, photos, proof of funds, and service-specific documents. We provide a detailed checklist when you start your case.',
      category: 'Documentation',
      order: 2,
    },
    {
      question: 'How can I track my case?',
      answer:
        'You can track your case in real-time through your dashboard. You will receive notifications for all status updates and can communicate directly with your assigned agent.',
      category: 'General',
      order: 3,
    },
  ];

  for (const faq of faqs) {
    // Check if FAQ already exists
    const existing = await prisma.fAQ.findFirst({
      where: { question: faq.question },
    });

    if (!existing) {
      await prisma.fAQ.create({
        data: faq,
      });
    }
  }

  console.log('✅ FAQs created');

  console.log('🎉 Database seeding completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Create admin user in Firebase Auth Console with email:', adminEmail);
  console.log('2. Copy the Firebase UID and update ADMIN_FIREBASE_UID in .env');
  console.log('3. Re-run seed if needed: pnpm prisma db seed');
  console.log('4. Login with admin credentials');
  console.log('5. Use invite codes to create AGENT/ADMIN accounts');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
