'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, ChevronDown, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const faqs = [
    {
        question: 'How long does the visa process take?',
        answer: 'Processing times vary by visa type. Student visas typically take 4-6 weeks, while work permits can take 8-12 weeks.',
    },
    {
        question: 'What documents do I need to provide?',
        answer: 'Required documents depend on your visa type. Check your case dashboard for a personalized checklist.',
    },
    {
        question: 'Can I track my case status online?',
        answer: 'Yes! You can track your case status in real-time through the dashboard or mobile app.',
    },
    {
        question: 'How do I upload documents?',
        answer: 'Navigate to the Documents section and use the upload button. Supported formats: PDF, JPG, PNG, DOC.',
    },
    {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards, debit cards, and bank transfers. Payment plans are also available.',
    },
    {
        question: 'Can I get a refund if my visa is rejected?',
        answer: 'Service fees are non-refundable, but government fees may be refundable depending on the case.',
    },
];

export function FAQList() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const { t } = useTranslation();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Frequently Asked Questions
                </h1>
                <p className="text-muted-foreground mt-2">
                    Find answers to common questions
                </p>
            </div>

            {/* FAQ List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <HelpCircle className="mr-2 h-5 w-5" />
                        Common Questions
                    </CardTitle>
                    <CardDescription>
                        Click on any question to see the answer
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div key={index}>
                                <button
                                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                    className="w-full flex items-start justify-between text-left py-4 hover:bg-muted/50 rounded-lg px-4 transition-colors"
                                >
                                    <span className="font-medium pr-4">{faq.question}</span>
                                    <ChevronDown
                                        className={`h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 ${openIndex === index ? 'transform rotate-180' : ''
                                            }`}
                                    />
                                </button>
                                {openIndex === index && (
                                    <div className="px-4 pb-4">
                                        <p className="text-muted-foreground leading-relaxed">
                                            {faq.answer}
                                        </p>
                                    </div>
                                )}
                                {index < faqs.length - 1 && <Separator />}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Contact Support */}
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">
                            Can't find what you're looking for?
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Our support team is here to help
                        </p>
                        <Button>
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Contact Support
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
