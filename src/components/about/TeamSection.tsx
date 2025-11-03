'use client';

import { useState, useEffect, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Award, Users, Linkedin, Mail } from 'lucide-react';
import { team } from '@/components/about/api/data';

interface TeamMember {
  nameKey: string;
  roleKey: string;
  descriptionKey: string;
  avatar: string;
  isCEO?: boolean;
}

// Memoized Team Member Card for better performance
const TeamMemberCard = memo(
  ({ member, index, t }: { member: TeamMember; index: number; t: any }) => {
    const isCEO = member.isCEO;
    const isLeft = index === 1;
    const isRight = index === 2;

    return (
      <div
        className={`relative group will-change-transform ${
          isCEO ? 'md:order-2 md:scale-110 md:z-10' : isLeft ? 'md:order-1' : 'md:order-3'
        }`}
        style={{
          animationDelay: `${index * 200}ms`,
        }}
      >
        {/* CEO Special Effects */}
        {isCEO && (
          <>
            {/* CEO Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400/20 via-amber-400/20 to-yellow-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* CEO Crown Badge */}
            <div className="absolute -top-3 -right-3 z-20">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                <Crown className="w-4 h-4 text-white" />
              </div>
            </div>
          </>
        )}

        <Card
          className={`relative overflow-hidden border-2 transition-all duration-500 hover:shadow-2xl group-hover:-translate-y-2 will-change-transform ${
            isCEO
              ? 'border-yellow-400/50 bg-gradient-to-br from-yellow-50/50 to-amber-50/50 dark:from-yellow-950/30 dark:to-amber-950/30 shadow-xl'
              : 'border-primary/20 hover:border-primary/50 bg-card/50 backdrop-blur-sm'
          }`}
        >
          {/* Animated gradient background */}
          <div
            className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${
              isCEO
                ? 'bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-400'
                : index === 1
                  ? 'bg-gradient-to-br from-blue-400 via-indigo-400 to-blue-400'
                  : 'bg-gradient-to-br from-teal-400 via-cyan-400 to-teal-400'
            }`}
          ></div>

          {/* Top accent bar */}
          <div
            className={`absolute top-0 left-0 right-0 h-1 ${
              isCEO
                ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-400'
                : index === 1
                  ? 'bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400'
                  : 'bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400'
            }`}
          ></div>

          <CardContent className="relative pt-12 pb-8 px-6">
            {/* Avatar Section */}
            <div className="relative mb-8 flex justify-center">
              {/* Outer glow ring */}
              <div
                className={`absolute inset-0 w-32 h-32 mx-auto rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-all duration-500 group-hover:scale-110 ${
                  isCEO
                    ? 'bg-gradient-to-br from-yellow-400 to-amber-400'
                    : index === 1
                      ? 'bg-gradient-to-br from-blue-400 to-indigo-400'
                      : 'bg-gradient-to-br from-teal-400 to-cyan-400'
                }`}
              ></div>

              {/* Avatar container */}
              <div className="relative">
                <div
                  className={`w-32 h-32 rounded-full p-1 shadow-2xl group-hover:scale-110 transition-transform duration-500 will-change-transform ${
                    isCEO
                      ? 'bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-400'
                      : index === 1
                        ? 'bg-gradient-to-br from-blue-400 via-indigo-400 to-blue-400'
                        : 'bg-gradient-to-br from-teal-400 via-cyan-400 to-teal-400'
                  }`}
                >
                  <div className="w-full h-full rounded-full bg-card dark:bg-background flex items-center justify-center relative overflow-hidden">
                    <span
                      className={`text-4xl font-bold bg-clip-text text-transparent ${
                        isCEO
                          ? 'bg-gradient-to-br from-yellow-600 to-amber-600'
                          : index === 1
                            ? 'bg-gradient-to-br from-blue-600 to-indigo-600'
                            : 'bg-gradient-to-br from-teal-600 to-cyan-600'
                      }`}
                    >
                      {member.avatar}
                    </span>

                    {/* CEO Special Badge */}
                    {isCEO && (
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                        <Star className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Pulse ring on hover */}
                <div
                  className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 group-hover:scale-125 transition-all duration-500 ${
                    isCEO
                      ? 'bg-gradient-to-br from-yellow-400 to-amber-400'
                      : index === 1
                        ? 'bg-gradient-to-br from-blue-400 to-indigo-400'
                        : 'bg-gradient-to-br from-teal-400 to-cyan-400'
                  }`}
                ></div>
              </div>
            </div>

            {/* Content */}
            <div className="text-center space-y-4">
              <div>
                <h3 className="text-2xl font-bold group-hover:text-primary transition-colors duration-300 mb-2">
                  {t(member.nameKey)}
                </h3>

                <Badge
                  variant="secondary"
                  className={`text-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 ${
                    isCEO
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                      : index === 1
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                        : 'bg-gradient-to-r from-teal-500 to-cyan-500'
                  }`}
                >
                  {isCEO && <Crown className="w-3 h-3 mr-1" />}
                  {t(member.roleKey)}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(member.descriptionKey)}
              </p>

              {/* Social Links */}
              <div className="flex justify-center gap-3 pt-4">
                <button className="w-8 h-8 rounded-full bg-muted hover:bg-primary hover:text-white transition-colors duration-300 flex items-center justify-center">
                  <Linkedin className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 rounded-full bg-muted hover:bg-primary hover:text-white transition-colors duration-300 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </CardContent>
        </Card>

        {/* CEO Special Floating Elements */}
        {isCEO && (
          <>
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400 rounded-full opacity-60 animate-ping"></div>
            <div
              className="absolute -bottom-2 -right-2 w-3 h-3 bg-amber-400 rounded-full opacity-60 animate-ping"
              style={{ animationDelay: '1s' }}
            ></div>
          </>
        )}
      </div>
    );
  }
);

TeamMemberCard.displayName = 'TeamMemberCard';

export function TeamSection() {
  const { t } = useTranslation();
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

  // Enhanced team data with CEO identification
  const enhancedTeam: TeamMember[] = team.map((member, index) => ({
    ...member,
    isCEO: index === 0, // First member is CEO
  }));

  return (
    <section className="py-16 md:py-20 lg:py-24">
      {/* Simple background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/10 to-transparent dark:from-muted/5"></div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-1.5 border-primary/20">
            <Crown className="w-4 h-4 mr-2 text-primary" />
            <span className="text-primary font-semibold">Our Leadership Team</span>
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            {t('about.team.title')}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('about.team.subtitle')}
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {enhancedTeam.map((member, index) => (
            <TeamMemberCard
              key={`${member.nameKey}-${index}`}
              member={member}
              index={index}
              t={t}
            />
          ))}
        </div>

        {/* Team Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">10+</div>
            <div className="text-sm text-muted-foreground">Years Experience</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">500+</div>
            <div className="text-sm text-muted-foreground">Happy Clients</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">24/7</div>
            <div className="text-sm text-muted-foreground">Support Available</div>
          </div>
        </div>
      </div>
    </section>
  );
}
