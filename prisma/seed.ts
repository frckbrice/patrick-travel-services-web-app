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

    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail },
    });

    if (existingAdmin) {
        console.log('✅ Admin user already exists');
    } else {
        console.log(`📧 Creating admin user: ${adminEmail}`);
        console.log(`⚠️  Firebase UID: ${adminId}`);
        console.log(`⚠️  Note: You must create this user in Firebase Auth with the same UID!`);

        await prisma.user.create({
            data: {
                id: adminId,
                email: adminEmail,
                password: 'firebase_managed',
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

    // Create sample invite codes
    console.log('🎟️  Creating sample invite codes...');

    const agentCode = await prisma.inviteCode.create({
        data: {
            code: `agent-${nanoid(16)}`,
            role: 'AGENT',
            createdBy: adminId,
            maxUses: 10,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
    });

    const adminCode = await prisma.inviteCode.create({
        data: {
            code: `admin-${nanoid(16)}`,
            role: 'ADMIN',
            createdBy: adminId,
            maxUses: 1,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
    });

    console.log('✅ Invite codes created:');
    console.log(`   AGENT Code (10 uses, 30 days): ${agentCode.code}`);
    console.log(`   ADMIN Code (1 use, 7 days): ${adminCode.code}`);

    // Create sample FAQs
    console.log('📝 Creating sample FAQs...');

    const faqs = [
        {
            question: 'How long does visa processing take?',
            answer: 'Processing times vary by country and visa type. Student visas typically take 4-8 weeks, while work permits can take 8-12 weeks. We keep you updated throughout the process.',
            category: 'Processing Times',
            order: 1,
        },
        {
            question: 'What documents do I need?',
            answer: 'Required documents vary by service type. Generally, you will need: valid passport, photos, proof of funds, and service-specific documents. We provide a detailed checklist when you start your case.',
            category: 'Documentation',
            order: 2,
        },
        {
            question: 'How can I track my case?',
            answer: 'You can track your case in real-time through your dashboard. You will receive notifications for all status updates and can communicate directly with your assigned agent.',
            category: 'General',
            order: 3,
        },
    ];

    for (const faq of faqs) {
        await prisma.fAQ.upsert({
            where: { id: faq.question }, // Using question as unique identifier
            update: {},
            create: faq,
        });
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

