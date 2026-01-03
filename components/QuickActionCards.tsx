import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Card } from './UI';

export interface QuickAction {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    color: string;
    bgColor: string;
    onClick: () => void;
    badge?: string | number;
}

interface QuickActionCardsProps {
    actions: QuickAction[];
}

export const QuickActionCards: React.FC<QuickActionCardsProps> = ({ actions }) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {actions.map((action, index) => {
                const Icon = action.icon;

                return (
                    <motion.div
                        key={action.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Card
                            onClick={action.onClick}
                            className="relative cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-qatar/30 p-3 sm:p-4 text-center touch-manipulation active:scale-95"
                        >
                            {action.badge && (
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {action.badge}
                                </div>
                            )}

                            <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-full ${action.bgColor} flex items-center justify-center`}>
                                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${action.color}`} />
                            </div>

                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-1">{action.title}</h3>
                            <p className="text-[10px] sm:text-xs text-slate-600 line-clamp-2">{action.description}</p>
                        </Card>
                    </motion.div>
                );
            })}
        </div>
    );
};
