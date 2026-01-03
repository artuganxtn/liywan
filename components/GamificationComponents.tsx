import React from 'react';
import { motion } from 'framer-motion';
import {
    Trophy, Star, Award, Crown, Zap, Target,
    TrendingUp, CheckCircle, Lock
} from 'lucide-react';
import { Card } from './UI';

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    unlocked: boolean;
    unlockedDate?: string;
    xpReward: number;
}

export interface ProfileStrengthData {
    overall: number;
    sections: {
        personal: number;
        professional: number;
        documents: number;
        training: number;
    };
}

interface ProfileStrengthMeterProps {
    data: ProfileStrengthData;
}

export const ProfileStrengthMeter: React.FC<ProfileStrengthMeterProps> = ({ data }) => {
    const getStrengthColor = (score: number) => {
        if (score >= 90) return 'text-emerald-600 bg-emerald-100';
        if (score >= 70) return 'text-blue-600 bg-blue-100';
        if (score >= 50) return 'text-amber-600 bg-amber-100';
        return 'text-red-600 bg-red-100';
    };

    const getStrengthLabel = (score: number) => {
        if (score >= 90) return 'Excellent';
        if (score >= 70) return 'Good';
        if (score >= 50) return 'Fair';
        return 'Needs Work';
    };

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Profile Strength</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${getStrengthColor(data.overall)}`}>
                    {getStrengthLabel(data.overall)}
                </div>
            </div>

            {/* Overall Progress */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Overall Completion</span>
                    <span className="text-2xl font-bold text-qatar">{data.overall}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${data.overall}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-qatar to-qatar-light"
                    />
                </div>
            </div>

            {/* Section Breakdown */}
            <div className="space-y-3">
                {Object.entries(data.sections).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-3">
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-slate-700 capitalize">{key}</span>
                                <span className="text-xs font-bold text-slate-900">{value}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-qatar transition-all duration-500"
                                    style={{ width: `${value}%` }}
                                />
                            </div>
                        </div>
                        {value === 100 && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                    </div>
                ))}
            </div>

            {data.overall < 100 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-800">
                        <strong>Tip:</strong> Complete your profile to unlock more event opportunities!
                    </p>
                </div>
            )}
        </Card>
    );
};

interface AchievementBadgeProps {
    achievements: Achievement[];
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({ achievements }) => {
    const unlockedCount = achievements.filter(a => a.unlocked).length;

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    Achievements
                </h3>
                <span className="text-sm font-semibold text-slate-600">
                    {unlockedCount}/{achievements.length}
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {achievements.map((achievement) => (
                    <motion.div
                        key={achievement.id}
                        whileHover={achievement.unlocked ? { scale: 1.05 } : {}}
                        className={`relative p-4 rounded-xl border-2 text-center transition-all ${achievement.unlocked
                                ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100'
                                : 'border-gray-200 bg-gray-50 opacity-60'
                            }`}
                    >
                        {!achievement.unlocked && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                                <Lock className="w-6 h-6 text-gray-400" />
                            </div>
                        )}

                        <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${achievement.unlocked ? 'bg-amber-200 text-amber-700' : 'bg-gray-200 text-gray-400'
                            }`}>
                            {achievement.icon}
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 mb-1">{achievement.title}</h4>
                        <p className="text-[10px] text-slate-600 mb-2">{achievement.description}</p>

                        {achievement.unlocked && (
                            <div className="flex items-center justify-center gap-1 text-xs font-semibold text-amber-600">
                                <Zap size={12} />
                                +{achievement.xpReward} XP
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </Card>
    );
};

interface XPProgressProps {
    currentXP: number;
    currentLevel: string;
    nextLevel: string;
    xpForNextLevel: number;
}

export const XPProgress: React.FC<XPProgressProps> = ({
    currentXP,
    currentLevel,
    nextLevel,
    xpForNextLevel
}) => {
    const progress = (currentXP / xpForNextLevel) * 100;

    const getLevelIcon = (level: string) => {
        switch (level.toLowerCase()) {
            case 'bronze': return <Star className="w-5 h-5 text-amber-700" />;
            case 'silver': return <Star className="w-5 h-5 text-slate-400" />;
            case 'gold': return <Crown className="w-5 h-5 text-amber-500" />;
            case 'elite': return <Trophy className="w-5 h-5 text-purple-500" />;
            default: return <Target className="w-5 h-5 text-gray-500" />;
        }
    };

    return (
        <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    {getLevelIcon(currentLevel)}
                    <span className="font-bold text-lg">{currentLevel} Tier</span>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-400">Total XP</p>
                    <p className="text-xl font-bold">{currentXP}</p>
                </div>
            </div>

            <div className="mb-2">
                <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Progress to {nextLevel}</span>
                    <span className="font-bold">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-300"
                    />
                </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{currentLevel}</span>
                <span>{nextLevel}</span>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs">
                    <TrendingUp size={14} className="text-emerald-400" />
                    <span className="text-slate-300">Complete shifts to earn more XP!</span>
                </div>
            </div>
        </Card>
    );
};
