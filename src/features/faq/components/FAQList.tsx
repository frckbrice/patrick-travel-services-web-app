'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
];

export function FAQList() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const { t } = useTranslation();

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Frequently Asked Questions
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Find answers to common questions
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div key={index} className="border-b dark:border-gray-700 last:border-b-0 pb-4 last:pb-0">
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full text-left flex justify-between items-center py-2"
                            >
                                <span className="font-medium text-gray-900 dark:text-white">{faq.question}</span>
                                <span className="text-2xl dark:text-gray-300">{openIndex === index ? '−' : '+'}</span>
                            </button>
                            {openIndex === index && (
                                <p className="mt-2 text-gray-600 dark:text-gray-400 pl-4">{faq.answer}</p>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t dark:border-gray-700 text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Can't find what you're looking for?
                    </p>
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Contact Support
                    </button>
                </div>
            </div>
        </div>
    );
}

