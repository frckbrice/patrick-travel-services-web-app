import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const faqSeed = [
  {
    language: 'en',
    question: 'How long does visa processing take?',
    answer:
      'Processing timelines vary by visa type. Study permits average 4-6 weeks while work permits can take up to 12 weeks. Your dashboard shows the latest ETA per case.',
    category: 'Visa Process',
    order: 1,
  },
  {
    language: 'en',
    question: 'What documents do I need to upload?',
    answer:
      'You always need a valid passport, proof of funds, biometric photos, and service-specific paperwork. The Documents tab lists an exact checklist for your case.',
    category: 'Documents',
    order: 2,
  },
  {
    language: 'en',
    question: 'Can I track my case status online?',
    answer:
      'Yes. The web and mobile apps update milestones instantly and notify you when an officer reviews your file or requests extra information.',
    category: 'General',
    order: 3,
  },
  {
    language: 'en',
    question: 'What payment methods are accepted?',
    answer:
      'We accept major credit/debit cards and bank transfers. Payment plans are available for some services—contact support for details.',
    category: 'Payment',
    order: 4,
  },
  {
    language: 'fr',
    question: 'Combien de temps dure le traitement du visa ?',
    answer:
      'Les délais varient selon le type de visa. Les permis d’études prennent généralement 4 à 6 semaines et les permis de travail jusqu’à 12 semaines. Le tableau de bord affiche l’ETA mise à jour.',
    category: 'Visa Process',
    order: 1,
  },
  {
    language: 'fr',
    question: 'Quels documents dois-je téléverser ?',
    answer:
      'Vous aurez toujours besoin d’un passeport valide, de preuves de fonds, de photos biométriques et des documents propres à votre service. L’onglet Documents liste la checklist précise pour votre dossier.',
    category: 'Documents',
    order: 2,
  },
  {
    language: 'fr',
    question: 'Puis-je suivre l’état de mon dossier en ligne ?',
    answer:
      'Oui. Les applications web et mobile affichent chaque étape en temps réel et vous avertissent lorsque votre dossier est examiné ou qu’un complément est requis.',
    category: 'General',
    order: 3,
  },
  {
    language: 'fr',
    question: 'Quels moyens de paiement acceptez-vous ?',
    answer:
      'Nous acceptons les principales cartes bancaires ainsi que les virements. Des plans de paiement sont possibles pour certains services—contactez le support pour plus d’informations.',
    category: 'Payment',
    order: 4,
  },
];

async function main() {
  console.log('🌐 Seeding localized FAQs...');

  for (const faq of faqSeed) {
    const existing = await prisma.fAQ.findFirst({
      where: {
        question: faq.question,
        language: faq.language,
      },
    });

    if (existing) {
      await prisma.fAQ.update({
        where: { id: existing.id },
        data: {
          answer: faq.answer,
          category: faq.category,
          order: faq.order,
          isActive: true,
        },
      });
      console.log(`🔁 Updated ${faq.language.toUpperCase()} FAQ: ${faq.question}`);
    } else {
      await prisma.fAQ.create({
        data: faq,
      });
      console.log(`✅ Created ${faq.language.toUpperCase()} FAQ: ${faq.question}`);
    }
  }

  console.log('✨ FAQ localization seed complete.');
}

main()
  .catch((error) => {
    console.error('❌ Failed to seed localized FAQs', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
