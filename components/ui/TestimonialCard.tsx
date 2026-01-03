import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { Card } from './Card';

interface TestimonialCardProps {
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatar?: string;
  delay?: number;
}

export const TestimonialCard: React.FC<TestimonialCardProps> = ({
  name,
  role,
  company,
  content,
  rating,
  avatar,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay }}
    >
      <Card className="h-full bg-white border-slate-200 shadow-lg hover:shadow-xl transition-all">
        <Quote className="w-8 h-8 text-qatar/20 mb-4" />
        <p className="text-slate-700 mb-6 leading-relaxed">{content}</p>
        <div className="flex items-center gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <img
            src={avatar || `https://i.pravatar.cc/60?u=${name}`}
            alt={name}
            className="w-12 h-12 rounded-full object-cover"
            loading="lazy"
          />
          <div>
            <div className="font-semibold text-slate-900">{name}</div>
            <div className="text-xs text-slate-600">
              {role} at {company}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

