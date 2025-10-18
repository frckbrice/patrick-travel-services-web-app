/**
 * Seed script for FAQ data
 *
 * Run with: npx tsx scripts/seed-faqs.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FAQS = [
  // Visa Process
  {
    question: 'How long does the visa application process take?',
    answer:
      'Processing times vary by visa type and country. Student visas typically take 4-6 weeks, work permits can take 8-12 weeks, and family reunification applications may take 3-6 months. We provide real-time status updates through your dashboard.',
    category: 'Visa Process',
    order: 1,
  },
  {
    question: 'Can you guarantee my visa will be approved?',
    answer:
      'While we cannot guarantee approval, our experienced team maximizes your chances by ensuring all documentation is complete and properly submitted. We have a high success rate and provide expert guidance throughout the process.',
    category: 'Visa Process',
    order: 2,
  },
  {
    question: 'What happens if my visa application is rejected?',
    answer:
      'If your application is rejected, we will help you understand the reasons and explore options for appeal or reapplication. Service fees are non-refundable, but we will assist you in the next steps at a reduced rate.',
    category: 'Visa Process',
    order: 3,
  },

  // Documents
  {
    question: 'What documents do I need to provide?',
    answer:
      'Required documents vary by visa type. Common requirements include a valid passport, passport photos, proof of financial means, accommodation proof, and purpose-specific documents. Check your personalized checklist in your case dashboard for exact requirements.',
    category: 'Documents',
    order: 1,
  },
  {
    question: 'How do I upload documents securely?',
    answer:
      'Navigate to the Documents section in your dashboard and click the upload button. We accept PDF, JPG, PNG, and DOC formats up to 10MB per file. All uploads are encrypted and stored securely.',
    category: 'Documents',
    order: 2,
  },
  {
    question: 'Do I need to submit original documents?',
    answer:
      'In most cases, certified copies are acceptable initially. Original documents may be required at specific stages or for embassy appointments. We will notify you in advance if originals are needed.',
    category: 'Documents',
    order: 3,
  },

  // Payment
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards (Visa, Mastercard, American Express), debit cards, and bank transfers. Payment plans are available for qualifying applications over $1000.',
    category: 'Payment',
    order: 1,
  },
  {
    question: 'Are there any hidden fees?',
    answer:
      'No hidden fees. Our pricing is transparent and includes all service charges. Government fees, translation costs, and courier charges are separate and clearly itemized. You will see a complete breakdown before payment.',
    category: 'Payment',
    order: 2,
  },
  {
    question: 'Can I get a refund if I change my mind?',
    answer:
      'Service fees are non-refundable once work has begun on your application. However, if you cancel before we start processing, we offer a full refund minus a small administrative fee. Government fees may be refundable depending on the case.',
    category: 'Payment',
    order: 3,
  },

  // Account
  {
    question: 'How do I track my case status online?',
    answer:
      'Log in to your account and visit your dashboard. You can view real-time status updates, see which stage your application is at, and receive notifications for any required actions or updates.',
    category: 'Account',
    order: 1,
  },
  {
    question: 'Can I use the mobile app?',
    answer:
      'Yes! Our Progressive Web App (PWA) works on all devices. Simply visit our website on your mobile browser and add it to your home screen for a native app-like experience. Get push notifications and offline access.',
    category: 'Account',
    order: 2,
  },
  {
    question: 'How do I reset my password?',
    answer:
      'Click "Forgot Password" on the login page. Enter your email address, and we will send you a password reset link. The link is valid for 1 hour. If you do not receive it, check your spam folder.',
    category: 'Account',
    order: 3,
  },

  // General
  {
    question: 'What countries do you provide services for?',
    answer:
      'We handle visa applications for Canada, USA, UK, Australia, and most European countries. Our expertise covers student visas, work permits, family reunification, tourist visas, business visas, and permanent residency applications.',
    category: 'General',
    order: 1,
  },
  {
    question: 'How can I contact customer support?',
    answer:
      'Reach us through live chat in your dashboard, send a message via the Contact form, email support@patricktravelservices.com, or call our hotline at +1-XXX-XXX-XXXX (Mon-Fri 9AM-6PM EST). We respond within 24 hours.',
    category: 'General',
    order: 2,
  },
  {
    question: 'Is my personal information secure?',
    answer:
      'Absolutely. We use bank-level encryption (AES-256), secure servers, and comply with GDPR and data protection regulations. Your information is never shared with third parties without your consent. We are SOC 2 Type II certified.',
    category: 'General',
    order: 3,
  },

  // Technical Support
  {
    question: 'The website is not loading properly. What should I do?',
    answer:
      'Try clearing your browser cache and cookies, or use an incognito/private window. Ensure you are using an updated browser (Chrome, Firefox, Safari, or Edge). If issues persist, contact our technical support team.',
    category: 'Technical Support',
    order: 1,
  },
  {
    question: 'I cannot upload my documents. Help!',
    answer:
      'Ensure your file is in an accepted format (PDF, JPG, PNG, DOC) and under 10MB. Check your internet connection. Try using a different browser or device. If the problem continues, contact support with details about the error message.',
    category: 'Technical Support',
    order: 2,
  },
];

async function seedFAQs() {
  console.log('🌱 Seeding FAQs...');

  try {
    // Delete existing FAQs (optional - comment out if you want to keep existing ones)
    const deleteCount = await prisma.fAQ.deleteMany({});
    console.log(`🗑️  Deleted ${deleteCount.count} existing FAQs`);

    // Create new FAQs
    let createdCount = 0;
    for (const faq of FAQS) {
      await prisma.fAQ.create({
        data: {
          ...faq,
          isActive: true,
        },
      });
      createdCount++;
    }

    console.log(`✅ Successfully created ${createdCount} FAQs`);

    // Show summary by category
    const categories = await prisma.fAQ.groupBy({
      by: ['category'],
      _count: {
        id: true,
      },
    });

    console.log('\n📊 FAQs by category:');
    categories.forEach((cat) => {
      console.log(`   ${cat.category}: ${cat._count.id} FAQs`);
    });

    console.log('\n🎉 FAQ seeding completed successfully!\n');
  } catch (error) {
    console.error('❌ Error seeding FAQs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedFAQs().catch((error) => {
  console.error(error);
  process.exit(1);
});
