'use client';

import { useTranslation } from 'react-i18next';
import { Hero } from '@/components/landing/Hero';
import { WhyChooseUs } from '@/components/landing/WhyChooseUs';
import { Services } from '@/components/landing/Services';
import { Testimonials } from '@/components/landing/Testimonials';
import { Contact } from '@/components/landing/Contact';
import { FAQSection } from '@/features/faq/components';
import { landingCopy } from '@/lib/i18n/landing-client';

export function LandingView() {
  const { t } = useTranslation();
  const currentLandingCopy = landingCopy(t);

  return (
    <>
      <Hero />
      <section id="why-choose-us">
        {/* <WhyChooseUs content={currentLandingCopy.whyChooseUs} heroContent={currentLandingCopy.hero} /> */}
        <WhyChooseUs />
      </section>
      <section id="services">
        <Services />
      </section>
      <section id="testimonials">
        <Testimonials
          content={currentLandingCopy.testimonials}
          heroContent={currentLandingCopy.hero}
          whyChooseUsContent={currentLandingCopy.whyChooseUs}
          servicesContent={currentLandingCopy.services}
        />
      </section>
      {/* FAQ Section - Managed from Admin Dashboard */}
      <FAQSection limit={8} />
      <section id="contact">
        <Contact />
      </section>
    </>
  );
}
