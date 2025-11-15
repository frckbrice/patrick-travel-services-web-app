'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, ChevronDown, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface TranslatedFAQ {
  question: string;
  answer: string;
}

interface FAQCopy {
  title: string;
  subtitle: string;
  cardTitle: string;
  cardDescription: string;
  contactTitle: string;
  contactSubtitle: string;
  contactButton: string;
  items: TranslatedFAQ[];
}

export function FAQList() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { t } = useTranslation();
  const copy = t('faq.list', { returnObjects: true }) as FAQCopy;
  const faqs = copy.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{copy.title}</h1>
        <p className="text-muted-foreground mt-2">{copy.subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HelpCircle className="mr-2 h-5 w-5" />
            {copy.cardTitle}
          </CardTitle>
          <CardDescription>{copy.cardDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={faq.question}>
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-start justify-between text-left py-4 hover:bg-muted/50 rounded-lg px-4 transition-colors"
                >
                  <span className="font-medium pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform shrink-0 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openIndex === index && (
                  <div className="px-4 pb-4">
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                )}
                {index < faqs.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{copy.contactTitle}</h3>
            <p className="text-sm text-muted-foreground mb-4">{copy.contactSubtitle}</p>
            <Button>
              <MessageCircle className="mr-2 h-4 w-4" />
              {copy.contactButton}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
