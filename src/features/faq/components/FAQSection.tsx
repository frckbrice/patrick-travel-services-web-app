'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFAQs } from '@/features/faq/api';
import { HelpCircle, ChevronDown, Search, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FAQSectionProps {
  /**
   * Maximum number of FAQs to display (optional)
   * If not provided, all FAQs will be shown
   */
  limit?: number;

  /**
   * Whether to show category tabs
   * @default true
   */
  showCategories?: boolean;

  /**
   * Whether to show search bar
   * @default true
   */
  showSearch?: boolean;

  /**
   * Whether to show contact support card
   * @default true
   */
  showContactSupport?: boolean;

  /**
   * Section title (optional, defaults to i18n translation)
   */
  title?: string;

  /**
   * Section description (optional, defaults to i18n translation)
   */
  description?: string;
}

/**
 * Public FAQ Section Component
 *
 * Displays FAQs with:
 * - Category filtering
 * - Search functionality
 * - Accordion UI for Q&A
 * - Schema.org markup for SEO
 * - Mobile-optimized design
 *
 * Performance features:
 * - Client-side search (no API calls)
 * - React Query caching (1 hour stale time)
 * - Lazy-loaded accordion items
 */
export function FAQSection({
  limit,
  showCategories = true,
  showSearch = true,
  showContactSupport = true,
  title,
  description,
}: FAQSectionProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Use translations with fallback to props
  const sectionTitle = title || t('faq.section.title');
  const sectionDescription = description || t('faq.section.description');

  // Fetch only active FAQs (cached for 1 hour)
  const { data, isLoading, error } = useFAQs();

  if (isLoading) return <FAQSectionSkeleton />;

  if (error || !data) {
    return null; // Silently fail for public section
  }

  const { faqs, faqsByCategory, categories } = data;

  // Filter FAQs by search query
  let filteredFAQs = faqs;

  if (searchQuery) {
    filteredFAQs = faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  } else if (selectedCategory !== 'all' && showCategories) {
    filteredFAQs = faqsByCategory[selectedCategory] || [];
  }

  // Apply limit if specified
  if (limit && limit > 0) {
    filteredFAQs = filteredFAQs.slice(0, limit);
  }

  // Generate Schema.org FAQ markup for SEO
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: filteredFAQs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <section className="py-12 md:py-20" id="faq">
      {/* Schema.org markup for Google FAQ rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{sectionTitle}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{sectionDescription}</p>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={t('faq.section.searchPlaceholder')}
                className="pl-10 h-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Category Tabs */}
        {showCategories && !searchQuery ? (
          <Tabs
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            className="max-w-4xl mx-auto"
          >
            <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto mb-8">
              <TabsTrigger value="all">{t('faq.section.allQuestions')}</TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category}
                  <Badge variant="secondary" className="ml-2">
                    {faqsByCategory[category]?.length || 0}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-0">
              <FAQAccordion faqs={filteredFAQs} searchQuery={searchQuery} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="max-w-4xl mx-auto">
            <FAQAccordion faqs={filteredFAQs} searchQuery={searchQuery} />
          </div>
        )}

        {/* No Results */}
        {filteredFAQs.length === 0 && searchQuery && (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-12 text-center">
              <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">{t('faq.section.noResults')}</h3>
              <p className="text-muted-foreground">{t('faq.section.noResultsDesc')}</p>
            </CardContent>
          </Card>
        )}

        {/* Contact Support Card */}
        {showContactSupport && (
          <Card className="max-w-2xl mx-auto mt-12">
            <CardContent className="pt-6">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">
                  {t('faq.section.stillHaveQuestions')}
                </h3>
                <p className="text-muted-foreground mb-6">{t('faq.section.supportReady')}</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild>
                    <a href="#contact">
                      <MessageCircle className="mr-2 h-5 w-5" />
                      {t('faq.section.contactSupportBtn')}
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <a href="/register">{t('faq.section.createAccountBtn')}</a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}

/**
 * FAQ Accordion Component
 * Renders FAQs in an accessible accordion format
 */
function FAQAccordion({ faqs, searchQuery }: { faqs: any[]; searchQuery: string }) {
  if (faqs.length === 0) return null;

  // Highlight search terms in text
  const highlightText = (text: string) => {
    if (!searchQuery) return text;

    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <Accordion type="single" collapsible className="w-full space-y-4">
      {faqs.map((faq, index) => (
        <AccordionItem
          key={faq.id}
          value={faq.id}
          className="border rounded-lg px-6 bg-card hover:bg-muted/50 transition-colors"
        >
          <AccordionTrigger className="text-left hover:no-underline py-6">
            <span className="font-semibold pr-4">{highlightText(faq.question)}</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
            {highlightText(faq.answer)}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

/**
 * Loading skeleton for FAQ section
 */
function FAQSectionSkeleton() {
  return (
    <section className="py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-96 mx-auto mb-4" />
          <Skeleton className="h-6 w-[500px] mx-auto" />
        </div>
        <div className="max-w-2xl mx-auto mb-8">
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="max-w-4xl mx-auto space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    </section>
  );
}
