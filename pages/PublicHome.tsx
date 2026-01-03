import React from 'react';
import { motion, Variants } from 'framer-motion';
import {
  ArrowRight,
  BrainCircuit,
  Users,
  Shield,
  Globe,
  MapPin,
  Mail,
  Phone,
  Twitter,
  Linkedin,
  Instagram,
  Calendar,
  MonitorSmartphone,
  LineChart,
  Sparkles,
  TrendingUp,
  Award,
  CheckCircle,
  Zap,
} from 'lucide-react';
import { Button, Card, IventiaLogo, Modal } from '../components/UI';
import { HeroSection } from '../components/ui/HeroSection';
import { FeatureCard } from '../components/ui/FeatureCard';
import { TestimonialCard } from '../components/ui/TestimonialCard';
import BookingFlow from '../components/BookingFlow';
import ExpressContact from '../components/ExpressContact';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useTranslation } from '../contexts/TranslationContext';

interface PublicHomeProps {
  onClientLogin: () => void;
  onStaffApply: () => void;
}

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

const sectionFade: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const PublicHome: React.FC<PublicHomeProps> = ({ onClientLogin, onStaffApply }) => {
  const { t } = useTranslation();
  const [showBookingFlow, setShowBookingFlow] = React.useState(false);
  
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 overflow-x-hidden selection:bg-qatar selection:text-white">
      {/* Sticky Navigation */}
      <header className="fixed top-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 h-16 sm:h-20 lg:h-24 flex items-center justify-between">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 sm:gap-3 touch-manipulation"
            aria-label="Go to top"
          >
            <IventiaLogo className="w-12 h-12 sm:w-16 sm:h-16 lg:w-24 lg:h-24 flex-shrink-0" showTextFallback={false} />
            <div className="text-left min-w-0">
              <p className="text-sm sm:text-base lg:text-lg font-bold tracking-tight leading-none">
                <span className="text-black">LIY</span>
                <span className="text-[#8A1538]">W</span>
                <span className="text-black">AN</span>
              </p>
            </div>
          </button>
          <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-xs font-semibold text-slate-600">
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-qatar transition-colors touch-manipulation px-2 py-1"
            >
              {t('home.howItWorks')}
            </button>
            <button
              onClick={() => scrollToSection('technology')}
              className="hover:text-qatar transition-colors touch-manipulation px-2 py-1"
            >
              {t('home.technology')}
            </button>
            <button
              onClick={() => scrollToSection('qatar')}
              className="hover:text-qatar transition-colors touch-manipulation px-2 py-1"
            >
              {t('home.builtForQatar')}
            </button>
            <LanguageSwitcher />
            <Button
              size="sm"
              variant="outline"
              className="border-qatar text-qatar hover:bg-qatar/5"
              onClick={onStaffApply}
            >
              {t('home.joinOurTeam')}
            </Button>
            <Button size="sm" onClick={onClientLogin} className="bg-qatar text-white">
              {t('home.signIn')}
            </Button>
          </nav>
          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher />
            <Button size="sm" variant="outline" onClick={onStaffApply} className="text-xs px-3">
              {t('home.apply')}
            </Button>
            <Button size="sm" onClick={onClientLogin} className="bg-qatar text-white text-xs px-3">
              {t('home.signIn')}
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-20 sm:pt-24 lg:pt-0">
        {/* Enhanced Hero Section */}
        <HeroSection
          onBookEvent={() => scrollToSection('book-event')}
          onStaffApply={onStaffApply}
          scrollToSection={scrollToSection}
          t={t}
        />

        {/* DUAL VALUE PROP */}
        <section className="py-12 sm:py-16 lg:py-20 bg-[#F8FAFC]" id="audiences">
          <motion.div
            className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-4 sm:gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={sectionFade}
          >
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-2xl bg-qatar/10 flex items-center justify-center text-qatar">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.16em]">
                    {t('home.forEventOrganizers')}
                  </p>
                  <h2 className="text-lg font-bold text-slate-900">{t('home.hostFlawlessEvents')}</h2>
                </div>
              </div>
              <ul className="text-sm text-slate-600 space-y-1.5 mb-5">
                <li>{t('home.aiMatchedStaff')}</li>
                <li>{t('home.operationsDesk')}</li>
                <li>{t('home.transparentDashboards')}</li>
              </ul>
              <Button
                onClick={() => setShowBookingFlow(true)}
                className="w-full text-sm font-semibold bg-qatar text-white rounded-xl"
              >
                {t('home.requestStaff')}
              </Button>
            </Card>

            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.16em]">
                    {t('home.forProfessionals')}
                  </p>
                  <h2 className="text-lg font-bold text-slate-900">
                    {t('home.advanceCareer')}
                  </h2>
                </div>
              </div>
              <div className="mb-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {[
                    { step: '1', title: t('home.personalDetails'), time: `45 ${t('home.seconds')}` },
                    { step: '2', title: t('home.professionalProfile'), time: `1 ${t('home.minute')}` },
                    { step: '3', title: t('home.protocolQuiz'), time: `1 ${t('home.minute')}` },
                    { step: '4', title: t('home.approvalOnboarding'), time: t('home.under24Hours') },
                  ].map((item) => (
                    <Card
                      key={item.step}
                      className="border-slate-200 bg-white flex flex-col justify-between"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-400 mb-1">
                          {t('home.step')} {item.step}
                        </p>
                        <p className="font-semibold text-slate-900 mb-1">{item.title}</p>
                      </div>
                      <p className="text-[11px] text-slate-500">~{item.time}</p>
                    </Card>
                  ))}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={onStaffApply}
                className="w-full text-sm font-semibold border-qatar text-qatar rounded-xl bg-white hover:bg-qatar/5"
              >
                {t('home.startApplication3min')} (3 {t('home.minutes')})
              </Button>
            </Card>
          </motion.div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 lg:px-6 space-y-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={sectionFade}
              className="text-center max-w-2xl mx-auto"
            >
              <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase mb-2">
                {t('home.howStaffTechWorks')}
              </p>
              <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">
                {t('home.aiPrecisionHumanCare')}
              </h2>
            </motion.div>

              <motion.div
              className="max-w-4xl mx-auto space-y-4"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={sectionFade}
              >
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.16em] mb-1 text-center">
                  {t('home.forProfessionals')}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {[
                    { step: '1', title: t('home.personalDetails'), time: `45 ${t('home.seconds')}` },
                    { step: '2', title: t('home.professionalProfile'), time: `1 ${t('home.minute')}` },
                    { step: '3', title: t('home.protocolQuiz'), time: `1 ${t('home.minute')}` },
                    { step: '4', title: t('home.approvalOnboarding'), time: t('home.under24Hours') },
                  ].map((item) => (
                    <Card
                      key={item.step}
                      className="border-slate-200 bg-white flex flex-col justify-between"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-400 mb-1">
                          {t('home.step')} {item.step}
                        </p>
                        <p className="font-semibold text-slate-900 mb-1">{item.title}</p>
                      </div>
                      <p className="text-[11px] text-slate-500">~{item.time}</p>
                    </Card>
                  ))}
                </div>
              </motion.div>
          </div>
        </section>

        {/* TECHNOLOGY FEATURES */}
        <section id="technology" className="py-16 sm:py-20 lg:py-28 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_#8A1538_0%,_transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_#10B981_0%,_transparent_50%)]" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 lg:px-6 space-y-16">
            <motion.div
              variants={sectionFade}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              className="text-center max-w-3xl mx-auto"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 rounded-full bg-qatar/10 px-4 py-2 mb-4"
              >
                <Zap className="w-4 h-4 text-qatar" />
                <p className="text-sm font-semibold text-qatar uppercase tracking-wider">
                  {t('home.technologyBuilt')}
                </p>
              </motion.div>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6">
                {t('home.aiCoreHumanFront')}
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                {t('home.screeningDeployment')}
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={BrainCircuit}
                title={t('home.aiPoweredIntelligence')}
                description={t('home.aiPoweredDescription')}
                features={[
                  t('home.smartScreening'),
                  t('home.predictiveScores'),
                  t('home.culturalMatching'),
                ]}
                color="qatar"
                delay={0.1}
              />

              <FeatureCard
                icon={MonitorSmartphone}
                title={t('home.mobileFirstExperience')}
                description={t('home.mobileFirstDescription')}
                features={[
                  t('home.staffApp'),
                  t('home.virtualTraining'),
                  t('home.whatsappAssistant'),
                ]}
                color="emerald"
                delay={0.2}
              />

              <FeatureCard
                icon={LineChart}
                title={t('home.dataInsights')}
                description={t('home.dataInsightsDescription')}
                features={[
                  t('home.liveDashboards'),
                  t('home.automatedFeedback'),
                  t('home.predictiveScheduling'),
                ]}
                color="amber"
                delay={0.3}
              />
            </div>
          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
        <section className="py-16 sm:py-20 lg:py-28 bg-gradient-to-b from-white to-slate-50">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={sectionFade}
              className="text-center max-w-3xl mx-auto mb-16"
            >
              <p className="text-sm font-semibold text-qatar uppercase tracking-wider mb-4">
                {t('home.testimonials') || 'What Our Clients Say'}
              </p>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6">
                {t('home.trustedByLeading') || 'Trusted by Leading Event Organizers'}
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <TestimonialCard
                name="Sarah Al-Thani"
                role="Event Director"
                company="Qatar Events Group"
                content={t('home.testimonial1') || "LIYWAN transformed how we manage our events. The AI matching is incredibly accurate, and the staff quality is exceptional."}
                rating={5}
                delay={0.1}
              />
              <TestimonialCard
                name="Mohammed Al-Kuwari"
                role="Operations Manager"
                company="Doha Hospitality"
                content={t('home.testimonial2') || "The platform's real-time tracking and professional staff have made our events run smoother than ever before."}
                rating={5}
                delay={0.2}
              />
              <TestimonialCard
                name="Fatima Al-Suwaidi"
                role="Event Coordinator"
                company="Elite Events Qatar"
                content={t('home.testimonial3') || "Outstanding service! The cultural understanding and professionalism of LIYWAN staff sets them apart in Qatar's event industry."}
                rating={5}
                delay={0.3}
              />
            </div>
          </div>
        </section>

        {/* QATAR POSITIONING + SOCIAL PROOF + FINAL CTA */}
        <section id="qatar" className="py-16 sm:py-20 lg:py-28 bg-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.02]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#8A1538_0%,_transparent_70%)]" />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 lg:px-6 space-y-16">
            {/* Qatar positioning */}
            <motion.div
              variants={sectionFade}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="flex flex-col lg:flex-row gap-12 items-start">
                <div className="flex-1 space-y-6">
                  <div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      className="inline-flex items-center gap-2 rounded-full bg-qatar/10 px-4 py-2 mb-4"
                    >
                      <Globe className="w-4 h-4 text-qatar" />
                      <p className="text-sm font-semibold text-qatar uppercase tracking-wider">
                        {t('home.builtForQatarEvents')}
                      </p>
                    </motion.div>
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4">
                      {t('home.meetingGlobalExpectations')}
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
                      {t('home.staffTechTailored')}
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-6 mt-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 }}
                    >
                      <Card className="border-slate-200 hover:shadow-lg transition-all h-full">
                        <div className="w-10 h-10 rounded-xl bg-qatar/10 flex items-center justify-center mb-3">
                          <Shield className="w-5 h-5 text-qatar" />
                        </div>
                        <p className="font-bold text-slate-900 mb-2 text-base">{t('home.internationalStandards')}</p>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {t('home.internationalStandardsDesc')}
                        </p>
                      </Card>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 }}
                    >
                      <Card className="border-slate-200 hover:shadow-lg transition-all h-full">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
                          <Users className="w-5 h-5 text-emerald-600" />
                        </div>
                        <p className="font-bold text-slate-900 mb-2 text-base">{t('home.culturalExcellence')}</p>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {t('home.culturalExcellenceDesc')}
                        </p>
                      </Card>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 }}
                    >
                      <Card className="border-slate-200 hover:shadow-lg transition-all h-full">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
                          <Sparkles className="w-5 h-5 text-amber-600" />
                        </div>
                        <p className="font-bold text-slate-900 mb-2 text-base">{t('home.innovationLeadership')}</p>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {t('home.innovationLeadershipDesc')}
                        </p>
                      </Card>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 }}
                    >
                      <Card className="border-slate-200 hover:shadow-lg transition-all h-full">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
                          <TrendingUp className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="font-bold text-slate-900 mb-2 text-base">{t('home.scalableGrowth')}</p>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {t('home.scalableGrowthDesc')}
                        </p>
                      </Card>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Final dual CTA */}
            <motion.div
              variants={sectionFade}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              className="grid md:grid-cols-2 gap-6"
            >
              <div id="book-event" className="md:col-span-2 lg:col-span-1 scroll-mt-24">
                <BookingFlow />
              </div>

              <Card className="border-slate-200 bg-white">
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {t('home.joinLeadingProfessionals')}
                </h3>
                <p className="text-xs text-slate-600 mb-3">
                  {t('home.applyFewMinutes')}
                </p>
                <ul className="text-xs text-slate-600 space-y-1.5 mb-4">
                  <li>{t('home.premiumPayRates')}</li>
                  <li>{t('home.flexibleShiftsRoles')}</li>
                  <li>{t('home.structuredGrowth')}</li>
                </ul>
                <Button
                  onClick={onStaffApply}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold"
                >
                  {t('home.startApplication')}
                </Button>
              </Card>
            </motion.div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#F8FAFC] border-t border-slate-200 mt-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-xs text-slate-600">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <IventiaLogo className="w-16 h-16" showTextFallback={false} />
              <div>
                <p className="text-lg font-bold">
                  <span className="text-black">LIY</span>
                  <span className="text-[#8A1538]">W</span>
                  <span className="text-black">AN</span>
                </p>
              </div>
            </div>
            <p className="max-w-sm mb-4">
              {t('home.footerDescription')}
            </p>
            <div className="flex gap-3">
              <a
                href="https://twitter.com/liywan_qa"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-qatar hover:border-qatar hover:bg-qatar/5 transition-colors"
              >
                <Twitter size={14} />
              </a>
              <a
                href="https://linkedin.com/company/liywan"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-qatar hover:border-qatar hover:bg-qatar/5 transition-colors"
              >
                <Linkedin size={14} />
              </a>
              <a
                href="https://instagram.com/liywan.events"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-qatar hover:border-qatar hover:bg-qatar/5 transition-colors"
              >
                <Instagram size={14} />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">{t('home.navigation')}</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="hover:text-qatar transition-colors text-left"
                >
                  {t('home.howItWorks')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('technology')}
                  className="hover:text-qatar transition-colors text-left"
                >
                  {t('home.technology')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('qatar')}
                  className="hover:text-qatar transition-colors text-left"
                >
                  {t('home.builtForQatar')}
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">{t('home.contact')}</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <MapPin size={14} className="text-qatar" />
                West Bay, Doha
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-qatar" />
                hello@liywan.qa
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-qatar" />
                +974 4400 0000
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-200 py-6 text-center text-[11px] text-slate-500">
          &copy; {new Date().getFullYear()} {t('home.copyright')}
        </div>
      </footer>
      <ExpressContact />
      
      {/* Booking Flow Modal */}
      <Modal
        isOpen={showBookingFlow}
        onClose={() => setShowBookingFlow(false)}
        title="Request Staff for Your Event"
      >
        <BookingFlow onBookingSubmit={() => setShowBookingFlow(false)} />
      </Modal>
    </div>
  );
};

export default PublicHome;