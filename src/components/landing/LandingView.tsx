'use client';

import { Hero } from '@/components/landing/Hero';
import { WhyChooseUs } from '@/components/landing/WhyChooseUs';
import { Services } from '@/components/landing/Services';
import { Testimonials } from '@/components/landing/Testimonials';
import { Contact } from '@/components/landing/Contact';
import { FAQSection } from '@/features/faq/components';

export function LandingView() {
  return (
    <>
      <Hero />
      <section id="why-choose-us">
        <WhyChooseUs />
      </section>
      <section id="services">
        <Services />
      </section>
      <section id="testimonials">
        <Testimonials />
      </section>
      {/* FAQ Section - Managed from Admin Dashboard */}
      <FAQSection limit={8} />
      <section id="contact">
        <Contact />
      </section>
    </>
  );
}
