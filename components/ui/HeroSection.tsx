import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, TrendingUp, Users, Award } from 'lucide-react';
import { Button } from './Button';

interface HeroSectionProps {
  onBookEvent: () => void;
  onStaffApply: () => void;
  scrollToSection: (id: string) => void;
  t: (key: string) => string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onBookEvent,
  onStaffApply,
  scrollToSection,
  t,
}) => {
  const stats = [
    { icon: Users, value: '500+', label: t('home.professionals') },
    { icon: Award, value: '98%', label: t('home.satisfaction') },
    { icon: TrendingUp, value: '1000+', label: t('home.events') },
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-qatar/5">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-qatar/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 shadow-lg hover:shadow-xl transition-shadow"
            >
              <Sparkles className="w-4 h-4 text-qatar animate-pulse" />
              <span>{t('home.firstPlatform')}</span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight"
            >
              <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                {t('home.whereInnovationMeetsService')}
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl"
            >
              {t('home.aiPoweredDescription')}
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-3 gap-4 pt-4"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="text-center p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/50 hover:bg-white/80 transition-all"
                >
                  <stat.icon className="w-6 h-6 text-qatar mx-auto mb-2" />
                  <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                  <div className="text-xs text-slate-600 mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <Button
                onClick={onBookEvent}
                size="lg"
                className="bg-gradient-to-r from-qatar to-qatar-dark text-white px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all text-base font-semibold group"
              >
                {t('home.bookEventStaff')}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                onClick={onStaffApply}
                size="lg"
                className="border-2 border-slate-300 text-slate-700 px-8 py-4 rounded-2xl hover:bg-slate-50 hover:border-qatar hover:text-qatar transition-all text-base font-semibold"
              >
                {t('home.joinOurTeam')}
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-6 pt-4"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.img
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + i * 0.1 }}
                    loading="lazy"
                    src={`https://i.pravatar.cc/60?img=${i + 20}`}
                    className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-md"
                    alt=""
                  />
                ))}
              </div>
              <div className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">500+</span> {t('home.trustedBy')}
              </div>
            </motion.div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Main Card */}
            <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-slate-200/50">
              {/* Floating Elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-6 -right-6 bg-gradient-to-br from-qatar to-qatar-dark rounded-2xl p-4 shadow-xl"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                className="absolute -bottom-6 -left-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 shadow-xl"
              >
                <Users className="w-8 h-8 text-white" />
              </motion.div>

              {/* Content */}
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    {t('home.liveStaffingIntelligence')}
                  </p>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {t('home.dohaExhibition')}
                  </h3>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-xl bg-slate-50">
                    <div className="text-2xl font-bold text-slate-900">48</div>
                    <div className="text-xs text-slate-600 mt-1">{t('home.matchedStaff')}</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-emerald-50">
                    <div className="text-2xl font-bold text-emerald-600">98%</div>
                    <div className="text-xs text-slate-600 mt-1">{t('home.fillRate')}</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-amber-50">
                    <div className="text-2xl font-bold text-amber-600">15m</div>
                    <div className="text-xs text-slate-600 mt-1">{t('home.response')}</div>
                  </div>
                </div>

                {/* Chart Visualization */}
                <div className="h-32 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_#FDE68A,_transparent_70%)]" />
                  <div className="relative h-full flex items-end gap-2">
                    {[40, 70, 55, 90, 65, 80, 75].map((h, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: 1 + idx * 0.1, duration: 0.5 }}
                        className="flex-1 rounded-t-lg bg-gradient-to-t from-qatar to-amber-400"
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-500 text-center">
                  {t('home.aiOptimizes')}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

