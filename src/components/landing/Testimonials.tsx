'use client';

import { useMemo } from 'react';
import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { LandingCopy } from '@/lib/i18n/landing-content';

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
        rating: 5,
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
        rating: 5,
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

  const heroTestimonial = testimonials[0];
  const mosaicTestimonials = testimonials.slice(1);

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
    <section className="relative py-16 md:py-20 lg:py-24 overflow-hidden bg-linear-to-tr from-purple-200/30 via-pink-200/20 to-blue-200/30 dark:from-transparent dark:via-transparent dark:to-transparent">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-10 left-[-60px] w-72 h-72 bg-linear-to-trr from-purple-500/20 via-pink-500/20 to-transparent blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-[-40px] w-80 h-80 bg-linear-to-trl from-cyan-500/20 via-blue-500/20 to-transparent blur-3xl animate-pulse"></div>
      </div>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            <span suppressHydrationWarning>{content.title}</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            <span suppressHydrationWarning>{content.subtitle}</span>
          </p>
        </div>

        {/* Testimonials Layout */}
        <div className="relative">
          <div className="grid gap-4 sm:gap-6 lg:gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
              {mosaicTestimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.name} testimonial={testimonial} />
              ))}
            </div>
            <SpotlightCard testimonial={heroTestimonial} badge={content.badge} />
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-12 sm:mt-16 grid sm:grid-cols-3 gap-3 sm:gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-border/60 bg-card/80 p-4 sm:p-6 text-center backdrop-blur"
            >
              <div className="absolute inset-0 bg-linear-to-tr from-white/5 via-transparent to-primary/5"></div>
              <div className="relative space-y-1 sm:space-y-2">
                <p className="text-2xl sm:text-3xl font-black text-primary">{stat.value}</p>
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <span suppressHydrationWarning>{stat.label}</span>
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 sm:line-clamp-none">
                  <span suppressHydrationWarning>{stat.caption}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <Card className="relative overflow-hidden border border-white/10 bg-card/85 shadow-lg transition-transform duration-300 hover:-translate-y-1">
      <div
        className={`absolute inset-0 opacity-60 bg-linear-to-br ${testimonial.gradient} pointer-events-none`}
        aria-hidden
      />
      <CardContent className="relative space-y-3 sm:space-y-5 p-4 sm:p-6">
        <Quote className="h-6 w-6 sm:h-10 sm:w-10 text-primary/40" aria-hidden="true" />
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed line-clamp-4 sm:line-clamp-none">
          <span suppressHydrationWarning>&ldquo;{testimonial.content}&rdquo;</span>
        </p>
        <div className="flex items-center gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-border/60">
          <Avatar className="h-12 w-12 sm:h-16 sm:w-16 ring-2 ring-white/80 dark:ring-white/30">
            <AvatarImage
              src={testimonial.avatarSrc}
              alt={testimonial.name}
              loading="lazy"
              decoding="async"
              className="object-cover"
            />
            <AvatarFallback
              className={`${testimonial.avatarColor} text-white text-sm sm:text-lg font-semibold`}
            >
              {testimonial.avatarInitials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
            <p className="font-semibold text-sm sm:text-base truncate">{testimonial.name}</p>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              <span suppressHydrationWarning>{testimonial.role}</span>
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
              <span suppressHydrationWarning>{testimonial.location}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SpotlightCard({ testimonial, badge }: { testimonial: Testimonial; badge: string }) {
  return (
    <Card className="relative isolate overflow-hidden border border-white/15 bg-slate-950 text-white shadow-[0_20px_80px_rgba(15,23,42,0.55)]">
      <div className="absolute inset-[-40%] bg-linear-to-br from-blue-500/40 via-cyan-500/30 to-purple-500/30 blur-3xl opacity-80" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.15),transparent_70%)]" />
      <CardContent className="relative flex h-full flex-col gap-4 sm:gap-6 p-5 sm:p-8 lg:p-10">
        <div className="flex items-center gap-2 sm:gap-3 text-yellow-300">
          <div className="flex items-center gap-0.5 sm:gap-1">
            {Array.from({ length: testimonial.rating }).map((_, index) => (
              <Star key={index} className="h-4 w-4 sm:h-5 sm:w-5 fill-yellow-300 text-yellow-300" />
            ))}
          </div>
          <span className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-yellow-200/80">
            {badge}
          </span>
        </div>
        <Quote className="h-10 w-10 sm:h-16 sm:w-16 text-white/20" aria-hidden="true" />
        <p className="text-base sm:text-xl leading-relaxed font-medium text-white/90 line-clamp-4 sm:line-clamp-none">
          <span suppressHydrationWarning>&ldquo;{testimonial.content}&rdquo;</span>
        </p>
        <div className="flex items-center gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-white/10">
          <Avatar className="h-14 w-14 sm:h-20 sm:w-20 ring-2 sm:ring-4 ring-white/30">
            <AvatarImage
              src={testimonial.avatarSrc}
              alt={testimonial.name}
              loading="lazy"
              decoding="async"
              className="object-cover"
            />
            <AvatarFallback
              className={`${testimonial.avatarColor} text-white text-base sm:text-xl font-semibold`}
            >
              {testimonial.avatarInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm sm:text-lg font-semibold truncate">{testimonial.name}</p>
            <p className="text-xs sm:text-sm text-white/70 truncate">
              <span suppressHydrationWarning>{testimonial.role}</span>
            </p>
            <p className="text-[10px] sm:text-xs text-white/60 truncate">
              <span suppressHydrationWarning>{testimonial.location}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
