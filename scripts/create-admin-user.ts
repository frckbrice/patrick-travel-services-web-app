// Quick script to create admin user in database
// Usage: pnpm tsx scripts/create-admin-user.ts <firebase-uid> <email>

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdminUser() {
  const firebaseUid = process.argv[2];
  const email = process.argv[3] || 'maebrie2017@gmail.com';

  if (!firebaseUid) {
    console.error('❌ Error: Firebase UID is required');
    console.log('\nUsage: pnpm tsx scripts/create-admin-user.ts <firebase-uid> <email>');
    console.log('Example: pnpm tsx scripts/create-admin-user.ts abc123xyz maebrie2017@gmail.com');
    console.log('\nTo get Firebase UID:');
    console.log('1. Go to Firebase Console → Authentication → Users');
    console.log('2. Find your user and copy the UID');
    process.exit(1);
  }

  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { id: firebaseUid },
    });

    if (existing) {
      console.log('✅ User already exists in database:');
      console.log(`   Email: ${existing.email}`);
      console.log(`   Role: ${existing.role}`);
      console.log(`   Active: ${existing.isActive}`);
      process.exit(0);
    }

    // Create admin user
    const user = await prisma.user.create({
      data: {
        id: 'mcQCU7D2iSXS12RzWPi6KHwlWqp2',
        email: 'admin@patricktravel.com',
        firstName: 'Patrick',
        lastName: 'Travel',
        phone: '+237697000000',
        role: 'ADMIN',
        isActive: true,
        isVerified: true,
        password: '', // Managed by Firebase
      },
    });

    console.log('✅ Admin user created successfully in database!');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log('\n🎉 You can now login with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: admin123`);
    console.log('\n   Go to: http://localhost:3000/login');
  } catch (error: any) {
    console.error('❌ Error creating user:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
