'use client';

import { useState, useEffect } from 'react';
import { Hero } from '@/components/landing/Hero';
import { WhyChooseUs } from '@/components/landing/WhyChooseUs';
import { Services } from '@/components/landing/Services';
import { Testimonials } from '@/components/landing/Testimonials';
import { Contact } from '@/components/landing/Contact';

export function LandingView() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

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
            <section id="contact">
                <Contact />
            </section>
        </>
    );
}

