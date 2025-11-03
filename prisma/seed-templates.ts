// Prisma database seed script for Document Templates
// Run with: pnpm tsx prisma/seed-templates.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

import type { ServiceType } from '@prisma/client';

interface TemplateData {
  name: string;
  description: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: string;
  serviceType?: ServiceType | null;
  isRequired: boolean;
  version?: string;
}

async function main() {
  console.log('🌱 Starting document templates seed...');

  // Note: This seed creates template records in the database
  // The actual PDF files need to be uploaded through the admin panel or stored in public/templates/
  // Templates will have placeholder fileUrl that needs to be updated

  const templates: TemplateData[] = [
    // Student Visa Templates
    {
      name: 'Application for Study Permit - IMM 1294',
      description: 'Official IRCC form for applying to study in Canada as an international student',
      fileName: 'imm-1294-study-permit.pdf',
      fileSize: 0, // Will be updated when actual file is uploaded
      mimeType: 'application/pdf',
      category: 'FORM',
      serviceType: 'STUDENT_VISA',
      isRequired: true,
      version: '1.0',
    },
    {
      name: 'Student Visa Document Checklist',
      description: 'Complete checklist of required documents for student visa application',
      fileName: 'student-visa-checklist.pdf',
      fileSize: 0,
      mimeType: 'application/pdf',
      category: 'CHECKLIST',
      serviceType: 'STUDENT_VISA',
      isRequired: false,
      version: '1.0',
    },
    {
      name: 'Sample Statement of Purpose Template',
      description:
        'Template for writing a compelling statement of purpose for study permit application',
      fileName: 'sample-statement-of-purpose.pdf',
      fileSize: 0,
      mimeType: 'application/pdf',
      category: 'SAMPLE',
      serviceType: 'STUDENT_VISA',
      isRequired: false,
      version: '1.0',
    },

    // Work Permit Templates
    {
      name: 'Application for Work Permit - IMM 1294',
      description: 'Official IRCC application form for applying to work in Canada',
      fileName: 'imm-1294-work-permit.pdf',
      fileSize: 0,
      mimeType: 'application/pdf',
      category: 'FORM',
      serviceType: 'WORK_PERMIT',
      isRequired: true,
      version: '1.0',
    },
    {
      name: 'Work Permit Application Guide',
      description: 'Step-by-step guide for completing your work permit application',
      fileName: 'work-permit-guide.pdf',
      fileSize: 0,
      mimeType: 'application/pdf',
      category: 'GUIDE',
      serviceType: 'WORK_PERMIT',
      isRequired: false,
      version: '1.0',
    },
    {
      name: 'Employment Reference Letter Template',
      description: 'Template for employer reference letter required for work permit applications',
      fileName: 'employment-reference-letter-template.pdf',
      fileSize: 0,
      mimeType: 'application/pdf',
      category: 'SAMPLE',
      serviceType: 'WORK_PERMIT',
      isRequired: false,
      version: '1.0',
    },

    // Tourist Visa Templates
    {
      name: 'Application for Temporary Resident Visa - IMM 5257',
      description: 'Official IRCC form for applying to visit Canada as a tourist',
      fileName: 'imm-5257-visitor-visa.pdf',
      fileSize: 0,
      mimeType: 'application/pdf',
      category: 'FORM',
      serviceType: 'TOURIST_VISA',
      isRequired: true,
      version: '1.0',
    },
    {
      name: 'Family Information Form - IMM 5645',
      description: 'Required form for providing family information for visitor visa applications',
      fileName: 'imm-5645-family-information.pdf',
      fileSize: 0,
      mimeType: 'application/pdf',
      category: 'FORM',
      serviceType: 'TOURIST_VISA',
      isRequired: true,
      version: '1.0',
    },
    {
      name: 'Travel Itinerary Template',
      description: 'Template for creating a travel itinerary for visitor visa application',
      fileName: 'travel-itinerary-template.pdf',
      fileSize: 0,
      mimeType: 'application/pdf',
      category: 'SAMPLE',
      serviceType: 'TOURIST_VISA',
      isRequired: false,
      version: '1.0',
    },

    // Business Visa Templates
    {
      name: 'Business Visa Application Form',
      description: 'Official application form for business travel to Canada',
      fileName: 'business-visa-application.pdf',
      fileSize: 0,
      mimeType: 'application/pdf',
      category: 'FORM',
      serviceType: 'BUSINESS_VISA',
      isRequired: true,
      version: '1.0',
    },
    {
      name: 'Business Invitation Letter Template',
      description:
        'Template for business invitation letter required for business visa applications',
      fileName: 'business-invitation-letter.pdf',
      fileSize: 0,
      mimeType: 'application/pdf',
      category: 'SAMPLE',
      serviceType: 'BUSINESS_VISA',
      isRequired: false,
      version: '1.0',
    },

    // Permanent Residency Templates
    {
      name: 'Generic Application Form for Canada - IMM 0008',
      description: 'Main application form for permanent residency and other immigration programs',
      fileName: 'imm-0008-generic-application.pdf',
      fileSize: 0,
      mimeType: 'application/pdf',
      category: 'FORM',
      serviceType: 'PERMANENT_RESIDENCY',
      isRequired: true,
      version: '1.0',
    },
    {
      name: 'Schedule A: Background Declaration - IMM 5669',
      description: 'Required form for providing personal history and background information',
      fileName: 'imm-5669-schedule-a.pdf',
      fileSize: 0,
      mimeType: 'application/pdf',
      category: 'FORM',
      serviceType: 'PERMANENT_RESIDENCY',
      isRequired: true,
      version: '1.0',
    },
    {
      name: 'Additional Family Information - IMM 5406',
      description: 'Form for providing complete family information for immigration applications',
      fileName: 'imm-5406-additional-family.pdf',
      fileSize: 0,
      mimeType: 'application/pdf',
      category: 'FORM',
      serviceType: 'PERMANENT_RESIDENCY',
      isRequired: true,
      version: '1.0',
    },

    // Family Reunification Templates
    {
      name: 'Sponsorship Agreement - IMM 1344',
      description: 'Form for sponsoring family members for permanent residency',
      fileName: 'imm-1344-sponsorship.pdf',
      fileSize: 0,
      mimeType: 'application/pdf',
      category: 'FORM',
      serviceType: 'FAMILY_REUNIFICATION',
      isRequired: true,
      version: '1.0',
    },
    {
      name: 'Financial Evaluation Form',
      description: 'Required form for demonstrating financial ability to sponsor family members',
      fileName: 'financial-evaluation-form.pdf',
      fileSize: 0,
      mimeType: 'application/pdf',
      category: 'FORM',
      serviceType: 'FAMILY_REUNIFICATION',
      isRequired: true,
      version: '1.0',
    },
    {
      name: 'Family Reunification Checklist',
      description: 'Complete checklist of required documents for family sponsorship applications',
      fileName: 'family-reunification-checklist.pdf',
      fileSize: 0,
      mimeType: 'application/pdf',
      category: 'CHECKLIST',
      serviceType: 'FAMILY_REUNIFICATION',
      isRequired: false,
      version: '1.0',
    },
  ];

  console.log(`📝 Creating ${templates.length} template records...`);

  for (const template of templates) {
    // Check if template already exists by name and service type
    const existing = await prisma.documentTemplate.findFirst({
      where: {
        name: template.name,
        serviceType: template.serviceType ?? null,
      },
    });

    if (existing) {
      console.log(`   ⏭️  Skipping existing template: ${template.name}`);
      continue;
    }

    // Find an admin user to assign as creator
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    await prisma.documentTemplate.create({
      data: {
        name: template.name,
        description: template.description,
        fileName: template.fileName,
        fileUrl: `/templates/${template.fileName}`, // Placeholder URL
        fileSize: template.fileSize,
        mimeType: template.mimeType,
        category: template.category,
        serviceType: template.serviceType ?? null,
        isRequired: template.isRequired,
        version: template.version || null,
        createdById: adminUser?.id || null,
      },
    });

    console.log(`   ✅ Created template: ${template.name}`);
  }

  console.log('🎉 Document templates seeding completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Download official PDF forms from IRCC website:');
  console.log(
    '   https://www.canada.ca/en/immigration-refugees-citizenship/services/application/application-forms-guides.html'
  );
  console.log('2. Save the PDFs to: public/templates/');
  console.log('3. Or upload them through the admin panel at: /dashboard/admin/templates');
  console.log('4. Clients can then download templates from: /dashboard/resources');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
