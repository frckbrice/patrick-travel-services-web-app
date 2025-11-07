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

  // Seed Legal Documents (Terms & Privacy) with multi-language content
  console.log('📄 Seeding Legal Documents (Terms & Privacy) in multiple languages...');

  const languages = ['en', 'fr'];
  const publishedDate = new Date();

  // Terms documents
  for (const lang of languages) {
    const existingTerms = await prisma.legalDocument.findFirst({
      where: { type: 'TERMS', language: lang },
    });

    if (!existingTerms) {
      const termsContent = {
        en: [
          'Last updated: October 26, 2025',
          '',
          '1. Acceptance of Terms',
          'By accessing and using the Patrick Travel Services application, you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you must not use our application.',
          '',
          '2. Service Description',
          'Patrick Travel Services provides immigration consultation services including case management, document upload and verification, real-time communication with advisors, push notifications for updates, and access to resources and FAQs.',
          '',
          '3. User Accounts',
          'Account Creation: You must provide accurate information, be at least 18 years old, and are responsible for account security. Account Security: Keep your password confidential and notify us immediately of unauthorized access.',
          '',
          '4. Acceptable Use',
          'You agree not to violate laws, impersonate others, interfere with operations, or upload malicious content.',
          '',
          '5. Intellectual Property',
          'All content, features, and functionality are owned by Patrick Travel Services.',
          '',
          '6. Document Upload and Storage',
          'You grant permission to store and process your uploaded documents. We use secure third-party storage. Documents are retained as long as your account is active or as required by law.',
          '',
          '7. Service Limitations',
          'We do not guarantee visa approval, uninterrupted service, error-free operation, or specific processing times.',
          '',
          '8. Fees and Payment',
          'Service fees are communicated before submission. Fees are non-refundable except as required by law.',
          '',
          '9. Termination',
          'You may delete your account at any time. We may suspend or terminate accounts for violations. Data may be retained as required by law after termination.',
          '',
          '10. Limitation of Liability',
          'We are not liable for immigration rejections, processing delays, loss of data beyond our control, or indirect damages. Liability is limited to fees paid.',
          '',
          '11. Contact Information',
          'Email: legal@patricktravel.com | Phone: +1 (555) 123-4567',
        ].join('\n'),
        fr: [
          'Dernière mise à jour : 26 octobre 2025',
          '',
          '1. Acceptation des conditions',
          "En accédant et en utilisant l'application Patrick Travel Services, vous acceptez d'être lié par ces Conditions générales. Si vous n'êtes pas d'accord avec une partie de ces conditions, vous ne devez pas utiliser notre application.",
          '',
          '2. Description du service',
          "Patrick Travel Services fournit des services de consultation en immigration, notamment la gestion des dossiers, le téléchargement et la vérification de documents, la communication en temps réel avec les conseillers, les notifications push pour les mises à jour, et l'accès aux ressources et FAQ.",
          '',
          '3. Comptes utilisateurs',
          'Création de compte : Vous devez fournir des informations exactes, avoir au moins 18 ans et être responsable de la sécurité de votre compte. Sécurité du compte : Gardez votre mot de passe confidentiel et informez-nous immédiatement de tout accès non autorisé.',
          '',
          '4. Utilisation acceptable',
          "Vous acceptez de ne pas violer les lois, d'usurper l'identité d'autrui, d'interférer avec les opérations ou de télécharger du contenu malveillant.",
          '',
          '5. Propriété intellectuelle',
          'Tout le contenu, les fonctionnalités et les fonctionnalités appartiennent à Patrick Travel Services.',
          '',
          '6. Téléchargement et stockage de documents',
          'Vous accordez la permission de stocker et de traiter vos documents téléchargés. Nous utilisons un stockage tiers sécurisé. Les documents sont conservés tant que votre compte est actif ou selon les exigences légales.',
          '',
          '7. Limitations de service',
          "Nous ne garantissons pas l'approbation du visa, un service ininterrompu, un fonctionnement sans erreur ou des délais de traitement spécifiques.",
          '',
          '8. Frais et paiement',
          "Les frais de service sont communiqués avant la soumission. Les frais ne sont pas remboursables sauf si la loi l'exige.",
          '',
          '9. Résiliation',
          'Vous pouvez supprimer votre compte à tout moment. Nous pouvons suspendre ou résilier les comptes pour violations. Les données peuvent être conservées selon les exigences légales après la résiliation.',
          '',
          '10. Limitation de responsabilité',
          "Nous ne sommes pas responsables des rejets d'immigration, des retards de traitement, de la perte de données hors de notre contrôle ou des dommages indirects. La responsabilité est limitée aux frais payés.",
          '',
          '11. Informations de contact',
          'Email : legal@patricktravel.com | Téléphone : +1 (555) 123-4567',
        ].join('\n'),
      };

      await prisma.legalDocument.create({
        data: {
          type: 'TERMS',
          language: lang,
          title: lang === 'en' ? 'Terms and Conditions' : 'Conditions générales',
          slug: 'terms-initial',
          version: '1.0.0',
          isActive: true,
          publishedAt: publishedDate,
          content: termsContent[lang as keyof typeof termsContent],
        },
      });
      console.log(`✅ Seeded Terms document (${lang})`);
    } else {
      console.log(`ℹ️  Terms document (${lang}) already exists, skipping`);
    }
  }

  // Privacy documents
  for (const lang of languages) {
    const existingPrivacy = await prisma.legalDocument.findFirst({
      where: { type: 'PRIVACY', language: lang },
    });

    if (!existingPrivacy) {
      const privacyContent = {
        en: [
          'Last updated: October 26, 2025',
          '',
          '1. Introduction',
          'Patrick Travel Services is committed to protecting your privacy. This policy explains how we collect, use, disclose, and safeguard your information when you use our application.',
          '',
          '2. Information We Collect',
          'Personal Information: name, email, phone, immigration case details, uploaded documents, chat messages. Technical Information: device info, push tokens, IP, usage data, crash reports.',
          '',
          '3. How We Use Your Information',
          'Provide services, process/manage cases, communicate updates, send notifications, store documents securely, improve services, comply with laws, and prevent fraud.',
          '',
          '4. Third-Party Services',
          'Firebase (auth, database, messaging, analytics), UploadThing (document storage), Expo (push delivery).',
          '',
          '5. Data Security',
          'HTTPS/TLS, encrypted storage, secure authentication, regular audits, access controls, optional biometric authentication.',
          '',
          '6. Your Rights (GDPR)',
          'Access, rectification, erasure, portability, object, withdraw consent. Contact: privacy@patricktravel.com',
          '',
          '7. Data Retention',
          'We retain data as long as needed to provide services or as required by law. After account deletion, we erase personal data within 30 days except where legally required.',
          '',
          '8. International Data Transfers',
          'We ensure appropriate safeguards for international processing.',
          '',
          '9. Changes to This Policy',
          'We may update this policy and will update the "Last updated" date.',
          '',
          '10. Contact Us',
          'Email: privacy@patricktravel.com | Phone: +1 (555) 123-4567',
        ].join('\n'),
        fr: [
          'Dernière mise à jour : 26 octobre 2025',
          '',
          '1. Introduction',
          "Patrick Travel Services s'engage à protéger votre vie privée. Cette politique explique comment nous collectons, utilisons, divulguons et protégeons vos informations lorsque vous utilisez notre application.",
          '',
          '2. Informations que nous collectons',
          "Informations personnelles : nom, email, téléphone, détails du dossier d'immigration, documents téléchargés, messages de chat. Informations techniques : informations sur l'appareil, jetons push, IP, données d'utilisation, rapports de crash.",
          '',
          '3. Comment nous utilisons vos informations',
          'Fournir des services, traiter/gérer les dossiers, communiquer les mises à jour, envoyer des notifications, stocker les documents en toute sécurité, améliorer les services, se conformer aux lois et prévenir la fraude.',
          '',
          '4. Services tiers',
          'Firebase (authentification, base de données, messagerie, analytique), UploadThing (stockage de documents), Expo (livraison push).',
          '',
          '5. Sécurité des données',
          "HTTPS/TLS, stockage crypté, authentification sécurisée, audits réguliers, contrôles d'accès, authentification biométrique optionnelle.",
          '',
          '6. Vos droits (RGPD)',
          'Accès, rectification, effacement, portabilité, objection, retrait du consentement. Contact : privacy@patricktravel.com',
          '',
          '7. Conservation des données',
          "Nous conservons les données aussi longtemps que nécessaire pour fournir des services ou selon les exigences légales. Après la suppression du compte, nous effaçons les données personnelles dans les 30 jours sauf si la loi l'exige.",
          '',
          '8. Transferts internationaux de données',
          'Nous garantissons des mesures de protection appropriées pour le traitement international.',
          '',
          '9. Modifications de cette politique',
          'Nous pouvons mettre à jour cette politique et mettrons à jour la date de "Dernière mise à jour".',
          '',
          '10. Contactez-nous',
          'Email : privacy@patricktravel.com | Téléphone : +1 (555) 123-4567',
        ].join('\n'),
      };

      await prisma.legalDocument.create({
        data: {
          type: 'PRIVACY',
          language: lang,
          title: lang === 'en' ? 'Privacy Policy' : 'Politique de confidentialité',
          slug: 'privacy-initial',
          version: '1.0.0',
          isActive: true,
          publishedAt: publishedDate,
          content: privacyContent[lang as keyof typeof privacyContent],
        },
      });
      console.log(`✅ Seeded Privacy document (${lang})`);
    } else {
      console.log(`ℹ️  Privacy document (${lang}) already exists, skipping`);
    }
  }

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
