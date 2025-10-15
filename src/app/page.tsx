'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Hero } from '@/components/landing/Hero';
import { WhyChooseUs } from '@/components/landing/WhyChooseUs';
import { Services } from '@/components/landing/Services';
import { Testimonials } from '@/components/landing/Testimonials';
import { Contact } from '@/components/landing/Contact';
import { Footer } from '@/components/layout/Footer';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Stunning Multi-Layer Gradient Background */}
      <div className="fixed inset-0 -z-10">
        {/* Base gradient layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"></div>

        {/* Animated gradient orbs */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-primary/30 via-blue-500/20 to-transparent dark:from-primary/40 dark:via-blue-600/30 dark:to-transparent rounded-full blur-3xl opacity-40 dark:opacity-60 animate-pulse"></div>

        <div className="absolute top-1/3 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-purple-500/20 via-pink-500/15 to-transparent dark:from-purple-600/30 dark:via-pink-600/20 dark:to-transparent rounded-full blur-3xl opacity-30 dark:opacity-50 animate-pulse" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>

        <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-gradient-to-tl from-blue-500/20 via-cyan-500/15 to-transparent dark:from-blue-600/30 dark:via-cyan-600/20 dark:to-transparent rounded-full blur-3xl opacity-30 dark:opacity-50 animate-pulse" style={{ animationDelay: '2s', animationDuration: '5s' }}></div>

        <div className="absolute top-2/3 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-500/15 via-violet-500/10 to-transparent dark:from-indigo-600/25 dark:via-violet-600/20 dark:to-transparent rounded-full blur-3xl opacity-25 dark:opacity-45 animate-pulse" style={{ animationDelay: '3s', animationDuration: '6s' }}></div>

        {/* Mesh gradient overlay for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent dark:from-primary/10 dark:via-transparent dark:to-transparent"></div>

        {/* Subtle noise texture for richness (optional) */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50 dark:to-gray-950/50"></div>
      </div>

      <Navbar />
      <main className="flex-1 w-full relative z-0">
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
        <section id="contact">
          <Contact />
        </section>
      </main>
      <Footer />
    </div>
  );
}
