import { Mail, MapPin, Phone } from "lucide-react";

export const contactInfo = (t: (key: string) => string) => [
    {
        icon: Phone,
        title: t('landing.contact.phone'),
        value: '+1 (234) 567-890',
        href: 'tel:+1234567890',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
        icon: Mail,
        title: t('landing.contact.email'),
        value: 'info@patricktravelservices.com',
        href: 'mailto:info@patricktravelservices.com',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
        icon: MapPin,
        title: t('landing.contact.address'),
        value: '123 Immigration Street, City, Country',
        // href: 'https://maps.google.com/?q=123+Immigration+Street,+City,+Country',
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
];
