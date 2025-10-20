import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface LegalSectionProps {
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  title: string;
  children: ReactNode;
}

export function LegalSection({
  icon: Icon,
  iconBgColor,
  iconColor,
  title,
  children,
}: LegalSectionProps) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-lg ${iconBgColor} flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <h2 className="text-2xl font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}
