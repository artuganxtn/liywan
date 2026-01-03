import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Card } from './Card';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  color?: 'qatar' | 'emerald' | 'amber' | 'blue';
  delay?: number;
}

const colorClasses = {
  qatar: {
    icon: 'bg-qatar/10 text-qatar',
    dot: 'bg-qatar',
  },
  emerald: {
    icon: 'bg-emerald-100 text-emerald-600',
    dot: 'bg-emerald-500',
  },
  amber: {
    icon: 'bg-amber-100 text-amber-600',
    dot: 'bg-amber-500',
  },
  blue: {
    icon: 'bg-blue-100 text-blue-600',
    dot: 'bg-blue-500',
  },
};

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  features,
  color = 'qatar',
  delay = 0,
}) => {
  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay }}
    >
      <Card className="h-full bg-white border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2">
        <div className={`w-14 h-14 rounded-2xl ${colors.icon} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
          <Icon className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">{description}</p>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: delay + index * 0.1 }}
              className="flex items-start gap-3 text-sm text-slate-600"
            >
              <span className={`w-2 h-2 rounded-full ${colors.dot} mt-2 flex-shrink-0`} />
              <span>{feature}</span>
            </motion.li>
          ))}
        </ul>
      </Card>
    </motion.div>
  );
};

