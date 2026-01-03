import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
  icon: React.ReactNode;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  selected,
  onClick,
  title,
  description,
  icon,
}) => (
  <div
    onClick={onClick}
    className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 flex items-center gap-4 relative overflow-hidden
      ${
        selected
          ? 'border-qatar bg-qatar text-white shadow-lg shadow-qatar/20'
          : 'border-gray-100 bg-white text-gray-600 hover:border-qatar/30 hover:bg-slate-50'
      }`}
  >
    <div className={`p-2 rounded-lg transition-colors ${selected ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
      {icon}
    </div>
    <div className="relative z-10">
      <p className={`font-bold text-sm ${selected ? 'text-white' : 'text-gray-900'}`}>{title}</p>
      {description && (
        <p className={`text-xs mt-0.5 ${selected ? 'text-white/80' : 'text-gray-500'}`}>{description}</p>
      )}
    </div>
    {selected && (
      <motion.div
        layoutId="selectedCheck"
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white text-qatar rounded-full p-1"
      >
        <Check size={12} strokeWidth={4} />
      </motion.div>
    )}
  </div>
);


