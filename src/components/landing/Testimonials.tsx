'use client';

import { useMemo } from 'react';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { LandingCopy } from '@/lib/i18n/landing-content';
import { ProgressiveSection } from '@/components/ui/progressive-section';

interface TestimonialsProps {
  content: LandingCopy['testimonials'];
  heroContent: LandingCopy['hero'];
  whyChooseUsContent: LandingCopy['whyChooseUs'];
  servicesContent: LandingCopy['services'];
}

interface Testimonial {
  name: string;
  role: string;
  location: string;
  content: string;
  rating: number;
  avatarInitials: string;
  avatarSrc: string;
  avatarColor: string;
  gradient: string;
}

export function Testimonials({
  content,
  heroContent,
  whyChooseUsContent,
  servicesContent,
}: TestimonialsProps) {
  const testimonials = useMemo<Testimonial[]>(
    () => [
      {
        name: content.name1,
        role: content.role1,
        location: content.location1,
        content: content.testimonial1,
        rating: 5,
        avatarInitials: 'SJ',
        avatarSrc: '/avatars/1.png',
        avatarColor: 'bg-blue-600',
        gradient: 'from-blue-600/30 via-cyan-500/20 to-transparent',
      },
      {
        name: content.name2,
        role: content.role2,
        location: content.location2,
        content: content.testimonial2,
        rating: 4,
        avatarInitials: 'MC',
        avatarSrc: '/avatars/4.png',
        avatarColor: 'bg-emerald-600',
        gradient: 'from-emerald-500/25 via-sky-500/20 to-transparent',
      },
      {
        name: content.name3,
        role: content.role3,
        location: content.location3,
        content: content.testimonial3,
        rating: 5,
        avatarInitials: 'EW',
        avatarSrc: '/avatars/6.png',
        avatarColor: 'bg-purple-600',
        gradient: 'from-purple-500/25 via-pink-500/15 to-transparent',
      },
      {
        name: content.name4,
        role: servicesContent.business,
        location: content.location2,
        content: `${content.testimonial2} ${whyChooseUsContent.features.efficiency.description}`,
        rating: 4,
        avatarInitials: 'DR',
        avatarSrc: '/avatars/9.png',
        avatarColor: 'bg-orange-600',
        gradient: 'from-orange-500/25 via-amber-400/20 to-transparent',
      },
      {
        name: content.name5,
        role: servicesContent.family,
        location: content.location3,
        content: `${content.testimonial3} ${whyChooseUsContent.features.support.description}`,
        rating: 5,
        avatarInitials: 'CM',
        avatarSrc: '/avatars/12.png',
        avatarColor: 'bg-pink-600',
        gradient: 'from-pink-500/25 via-rose-400/15 to-transparent',
      },
    ],
    [content, servicesContent, whyChooseUsContent]
  );

  // Duplicate testimonials for seamless infinite scroll
  const duplicatedTestimonials = useMemo(() => {
    return [...testimonials, ...testimonials, ...testimonials];
  }, [testimonials]);

  // Split into two rows
  const row1Testimonials = useMemo(() => {
    return duplicatedTestimonials;
  }, [duplicatedTestimonials]);

  const row2Testimonials = useMemo(() => {
    return [...duplicatedTestimonials].reverse();
  }, [duplicatedTestimonials]);

  const stats = [
    {
      value: content.statsClientsValue,
      label: heroContent.clients,
      caption: content.rating,
    },
    {
      value: heroContent.successRateValue,
      label: heroContent.successRate,
      caption: whyChooseUsContent.features.success.description,
    },
    {
      value: content.statsExperienceValue,
      label: heroContent.years,
      caption: whyChooseUsContent.features.excellence.description,
    },
  ];

  return (
    <ProgressiveSection
      delay={400}
      duration={800}
      as="section"
      className="relative py-16 md:py-20 lg:py-24 overflow-hidden bg-white dark:bg-transparent"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            <span>{content.title}</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            <span>{content.subtitle}</span>
          </p>
        </div>

        {/* Scrolling Testimonials */}
        <div className="relative hover-pause">
          {/* Row 1 - Scroll Left */}
          <div className="overflow-hidden mb-8">
            <div className="flex gap-6 animate-scroll-left">
              {row1Testimonials.map((testimonial, index) => (
                <div key={`row1-${index}`} className="flex-shrink-0 w-[320px] sm:w-[360px]">
                  <TestimonialCard testimonial={testimonial} />
                </div>
              ))}
            </div>
          </div>

          {/* Row 2 - Scroll Right */}
          <div className="overflow-hidden">
            <div className="flex gap-6 animate-scroll-right">
              {row2Testimonials.map((testimonial, index) => (
                <div key={`row2-${index}`} className="flex-shrink-0 w-[320px] sm:w-[360px]">
                  <TestimonialCard testimonial={testimonial} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-12 sm:mt-16 grid sm:grid-cols-3 gap-3 sm:gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-border/60 bg-card/80 p-4 sm:p-6 text-center backdrop-blur"
            >
              <div className="relative space-y-1 sm:space-y-2">
                <p className="text-2xl sm:text-3xl font-black text-primary">{stat.value}</p>
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>{stat.label}</span>
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 sm:line-clamp-none">
                  <span>{stat.caption}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProgressiveSection>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <Card className="relative overflow-hidden border border-border/50 bg-card shadow-sm transition-all duration-300 hover:shadow-md hover:border-border h-full flex flex-col">
      <div
        className={`absolute inset-0 opacity-20 bg-linear-to-br ${testimonial.gradient} pointer-events-none`}
        aria-hidden="true"
      />
      <CardContent className="relative p-5 sm:p-6 flex flex-col gap-4 h-full">
        {/* Avatar and Info at Top */}
        <div className="flex items-start gap-3 flex-shrink-0">
          <Avatar className="h-12 w-12 ring-2 ring-border/50 flex-shrink-0">
            <AvatarImage
              src={testimonial.avatarSrc}
              alt={testimonial.name}
              loading="lazy"
              decoding="async"
              className="object-cover"
            />
            <AvatarFallback
              className={`${testimonial.avatarColor} text-white text-sm font-semibold`}
            >
              {testimonial.avatarInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-semibold text-sm sm:text-base truncate leading-tight">
              {testimonial.name}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              <span>{testimonial.role}</span>
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground/70 truncate">
              <span>{testimonial.location}</span>
            </p>
          </div>
        </div>

        {/* Stars Rating */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={`star-${index}`}
              className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                index < testimonial.rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
              }`}
              aria-hidden="true"
            />
          ))}
        </div>

        {/* Testimonial Content */}
        <p className="text-sm sm:text-base text-foreground/80 leading-relaxed flex-1 overflow-y-auto">
          <span>&ldquo;{testimonial.content}&rdquo;</span>
        </p>
      </CardContent>
    </Card>
  );
}
