import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Clock,
    Users,
    MapPin,
    ArrowRight,
    CheckCircle,
    Shield,
    ChevronRight,
    Info,
    CreditCard,
    Phone,
    Loader2,
    Mail as MailIcon,
    Sparkles,
    AlertTriangle,
    Lightbulb,
    TrendingUp
} from 'lucide-react';
import { Button, Card, Input, Select, Modal } from './UI';
import { useTranslation } from '../contexts/TranslationContext';
import { bookings as bookingApi } from '../services/api';

// --- Types ---

type BookingStep = 'request' | 'finalize' | 'confirmation';

interface BookingData {
    eventType: string;
    date: string;
    time: string;
    duration: string;
    location: string;
    budget: string;
    contact: {
        name: string;
        company: string;
        phone: string;
        email: string;
    };
    eventDetails: {
        venue: string;
        guests: string;
        dressCode: string;
        special: string;
    };
}

const INITIAL_DATA: BookingData = {
    eventType: '',
    date: '',
    time: '',
    duration: '',
    location: 'Doha - West Bay',
    budget: '',
    contact: { name: '', company: '', phone: '', email: '' },
    eventDetails: { venue: '', guests: '', dressCode: '', special: '' },
};

// --- Components ---

const StepIndicator = ({ currentStep }: { currentStep: BookingStep }) => {
    const { t } = useTranslation();
    const steps: BookingStep[] = ['request', 'finalize', 'confirmation'];
    const labels = [t('booking.event'), t('booking.confirm'), t('booking.done')];

    const currentIndex = steps.indexOf(currentStep);

    return (
        <div className="flex items-center justify-center mb-8">
            {steps.map((step, idx) => (
                <React.Fragment key={step}>
                    <div className="flex flex-col items-center relative z-10">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${idx <= currentIndex
                                ? 'bg-qatar text-white'
                                : 'bg-slate-200 text-slate-500'
                                }`}
                        >
                            {idx + 1}
                        </div>
                        <span
                            className={`text-[10px] mt-1 font-medium uppercase tracking-wider ${idx <= currentIndex ? 'text-qatar' : 'text-slate-400'
                                }`}
                        >
                            {labels[idx]}
                        </span>
                    </div>
                    {idx < steps.length - 1 && (
                        <div
                            className={`w-12 h-0.5 -mt-4 mx-1 transition-colors duration-300 ${idx < currentIndex ? 'bg-qatar' : 'bg-slate-200'
                                }`}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

interface BookingFlowProps {
    onBookingSubmit?: (booking: BookingData) => void;
}

const BookingFlow: React.FC<BookingFlowProps> = ({ onBookingSubmit }) => {
    const { t } = useTranslation();
    const [step, setStep] = useState<BookingStep>('request');
    const [data, setData] = useState<BookingData>(INITIAL_DATA);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Check if date is in the past
    const isDateInPast = (dateString: string) => {
        if (!dateString) return false;
        const selectedDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate < today;
    };

    const updateData = (section: keyof BookingData, field: string, value: any) => {
        setData((prev) => ({
            ...prev,
            [section]:
                typeof prev[section] === 'object' && prev[section] !== null
                    ? { ...prev[section], [field]: value }
                    : value,
        }));
    };


    const validateRequestForm = () => {
        const newErrors: Record<string, string> = {};
        
        if (!data.eventType) {
            newErrors.eventType = t('booking.eventTypeRequired');
        }
        if (!data.location) {
            newErrors.location = t('booking.locationRequired');
        }
        if (!data.date) {
            newErrors.date = t('booking.dateRequired');
        } else if (isDateInPast(data.date)) {
            newErrors.date = 'Please select a future date';
        }
        if (!data.time) {
            newErrors.time = t('booking.timeRequired');
        }
        if (!data.duration) {
            newErrors.duration = t('booking.durationRequired');
        }
        if (!data.budget || data.budget.trim() === '') {
            newErrors.budget = t('booking.budgetRequired');
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleContinue = () => {
        if (validateRequestForm()) {
            setStep('finalize');
        }
    };

    const validateFinalizeForm = () => {
        const newErrors: Record<string, string> = {};
        
        if (!data.contact.name || data.contact.name.trim() === '') {
            newErrors.contactName = t('booking.nameRequired');
        }
        if (!data.contact.phone || data.contact.phone.trim() === '') {
            newErrors.contactPhone = t('booking.phoneRequired');
        }
        if (!data.contact.email || data.contact.email.trim() === '') {
            newErrors.contactEmail = t('booking.emailRequired');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact.email)) {
            newErrors.contactEmail = t('booking.emailInvalid');
        }
        if (!data.eventDetails.venue || data.eventDetails.venue.trim() === '') {
            newErrors.venue = t('booking.venueRequired');
        }
        if (!termsAccepted) {
            newErrors.terms = t('booking.termsRequired');
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleConfirmBooking = async () => {
        if (!validateFinalizeForm()) {
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // Convert form data to match backend Booking model structure
            const bookingData = {
                eventType: data.eventType,
                date: data.date ? new Date(data.date + 'T12:00:00Z').toISOString() : new Date().toISOString(),
                time: data.time,
                duration: data.duration,
                location: data.location,
                budget: data.budget,
                staff: {
                    servers: 0,
                    hosts: 0,
                    other: 0,
                },
                contact: {
                    name: data.contact.name,
                    company: data.contact.company || '',
                    phone: data.contact.phone,
                    email: data.contact.email,
                },
                eventDetails: {
                    venue: data.eventDetails.venue || '',
                    guests: data.eventDetails.guests || '',
                    dressCode: data.eventDetails.dressCode || '',
                    special: data.eventDetails.special || '',
                },
                status: 'Pending',
            };

            // Submit booking to API
            const result = await bookingApi.create(bookingData);

            // Call the callback if provided (for local state management)
            if (onBookingSubmit) {
                onBookingSubmit(data);
            }

            // Move to confirmation step
            setStep('confirmation');
        } catch (error: any) {
            console.error('Failed to submit booking:', error);
            setSubmitError(
                error?.response?.data?.error || error?.message || t('booking.submitError') || 'Failed to submit booking. Please try again.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render Steps ---

    const renderRequestForm = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="grid md:grid-cols-2 gap-4">
                <Select
                    label={t('booking.eventType') + ' *'}
                    options={[
                        { value: '', label: t('booking.selectEventType') },
                        { value: 'Wedding', label: t('booking.wedding') },
                        { value: 'Corporate', label: t('booking.corporate') },
                        { value: 'Conference', label: t('booking.conference') },
                        { value: 'Exhibition', label: t('booking.exhibition') },
                        { value: 'Private Party', label: t('booking.privateParty') },
                        { value: 'Sports Event', label: t('booking.sportsEvent') },
                        { value: 'Other', label: t('booking.other') }
                    ]}
                    value={data.eventType}
                    onChange={(e) => {
                        updateData('eventType', '', e.target.value);
                        if (errors.eventType) {
                            setErrors({ ...errors, eventType: '' });
                        }
                    }}
                    error={errors.eventType}
                    className="bg-slate-50"
                    name="eventType"
                />
                <Select
                    label={t('booking.location') + ' *'}
                    options={[
                        { value: 'Doha - West Bay', label: 'Doha - West Bay' },
                        { value: 'Doha - The Pearl', label: 'Doha - The Pearl' },
                        { value: 'Lusail', label: 'Lusail' },
                        { value: 'Al Rayyan', label: 'Al Rayyan' },
                        { value: 'Al Wakrah', label: 'Al Wakrah' },
                        { value: 'Other', label: 'Other' }
                    ]}
                    value={data.location}
                    onChange={(e) => {
                        updateData('location', '', e.target.value);
                        if (errors.location) {
                            setErrors({ ...errors, location: '' });
                        }
                    }}
                    error={errors.location}
                    icon={<MapPin size={18} />}
                    className="bg-slate-50"
                    name="location"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label={t('booking.eventDate') + ' *'}
                    type="date"
                    value={data.date}
                    onChange={(e) => {
                        updateData('date', '', e.target.value);
                        if (errors.date) {
                            setErrors({ ...errors, date: '' });
                        }
                    }}
                    error={errors.date}
                    icon={<Calendar size={18} />}
                    className="bg-slate-50"
                    name="eventDate"
                />
                <Input
                    label={t('booking.startTime') + ' *'}
                    type="time"
                    value={data.time}
                    onChange={(e) => {
                        updateData('time', '', e.target.value);
                        if (errors.time) {
                            setErrors({ ...errors, time: '' });
                        }
                    }}
                    error={errors.time}
                    icon={<Clock size={18} />}
                    className="bg-slate-50"
                    name="startTime"
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600">{t('booking.duration')} *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                        { value: '4 hours', label: t('booking.fourHours') },
                        { value: '6 hours', label: t('booking.sixHours') },
                        { value: '8 hours', label: t('booking.eightHours') },
                        { value: 'Full day', label: t('booking.fullDay') }
                    ].map((dur) => (
                        <button
                            key={dur.value}
                            onClick={() => {
                                updateData('duration', '', dur.value);
                                if (errors.duration) {
                                    setErrors({ ...errors, duration: '' });
                                }
                            }}
                            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${data.duration === dur.value
                                ? 'bg-qatar text-white border-qatar'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-qatar/50'
                                }`}
                        >
                            {dur.label}
                        </button>
                    ))}
                </div>
                {errors.duration && <p className="text-xs text-red-600 mt-1">{errors.duration}</p>}
            </div>

            <div>
                <Input
                    label={t('booking.budget') + ' *'}
                    type="text"
                    value={data.budget}
                    onChange={(e) => {
                        updateData('budget', '', e.target.value);
                        if (errors.budget) {
                            setErrors({ ...errors, budget: '' });
                        }
                    }}
                    placeholder={t('booking.budgetPlaceholder')}
                    error={errors.budget}
                    className="bg-slate-50"
                    name="budget"
                />
            </div>

            <Button
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-qatar to-qatar-dark text-white py-4 rounded-xl shadow-lg hover:shadow-xl transform transition-all hover:-translate-y-0.5 font-bold text-base flex items-center justify-center gap-2"
            >
                {t('booking.continue')} <ArrowRight className="w-5 h-5" />
            </Button>
        </motion.div>
    );


    const renderFinalize = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                    {t('booking.noChargeYet')}
                </p>
            </div>

            <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">{t('booking.contactInformation')}</h4>
                <div className="grid md:grid-cols-2 gap-4">
                    <Input
                        label={t('booking.fullName') + ' *'}
                        value={data.contact.name}
                        onChange={(e) => {
                            updateData('contact', 'name', e.target.value);
                            if (errors.contactName) {
                                setErrors({ ...errors, contactName: '' });
                            }
                        }}
                        placeholder="John Doe"
                        error={errors.contactName}
                        className="bg-slate-50"
                        name="contactName"
                    />
                    <Input
                        label={t('booking.companyOptional')}
                        value={data.contact.company}
                        onChange={(e) => updateData('contact', 'company', e.target.value)}
                        placeholder="Event Co."
                        className="bg-slate-50"
                        name="company"
                    />
                    <Input
                        label={t('booking.phoneWhatsApp') + ' *'}
                        value={data.contact.phone}
                        onChange={(e) => {
                            updateData('contact', 'phone', e.target.value);
                            if (errors.contactPhone) {
                                setErrors({ ...errors, contactPhone: '' });
                            }
                        }}
                        placeholder="+974 0000 0000"
                        error={errors.contactPhone}
                        icon={<Phone size={18} />}
                        className="bg-slate-50"
                        name="contactPhone"
                    />
                    <Input
                        label={t('booking.email') + ' *'}
                        type="email"
                        value={data.contact.email}
                        onChange={(e) => {
                            updateData('contact', 'email', e.target.value);
                            if (errors.contactEmail) {
                                setErrors({ ...errors, contactEmail: '' });
                            }
                        }}
                        placeholder="john@example.com"
                        error={errors.contactEmail}
                        icon={<MailIcon size={18} />}
                        className="bg-slate-50"
                        name="contactEmail"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">{t('booking.eventDetails')}</h4>
                <div className="space-y-3">
                    <Input
                        label={t('booking.venueNameAddress') + ' *'}
                        value={data.eventDetails.venue}
                        onChange={(e) => {
                            updateData('eventDetails', 'venue', e.target.value);
                            if (errors.venue) {
                                setErrors({ ...errors, venue: '' });
                            }
                        }}
                        placeholder="e.g. St. Regis Doha, Grand Ballroom"
                        error={errors.venue}
                        icon={<MapPin size={18} />}
                        className="bg-slate-50"
                        name="venue"
                    />
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">{t('booking.specialRequirements')}</label>
                        <textarea
                            className="w-full rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qatar/20 focus:border-qatar min-h-[80px]"
                            value={data.eventDetails.special}
                            onChange={(e) => updateData('eventDetails', 'special', e.target.value)}
                            placeholder="e.g. Bilingual staff needed, specific uniform requirements..."
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-1 pt-2">
                <div className="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        id="terms" 
                        className={`rounded text-qatar focus:ring-qatar ${errors.terms ? 'border-red-300' : ''}`}
                        checked={termsAccepted}
                        onChange={(e) => {
                            setTermsAccepted(e.target.checked);
                            if (errors.terms) {
                                setErrors({ ...errors, terms: '' });
                            }
                        }}
                    />
                    <label htmlFor="terms" className="text-xs text-slate-600">
                        {t('booking.agreeTerms')} <button 
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="text-qatar hover:underline"
                        >
                            {t('booking.termsConditions')}
                        </button>
                    </label>
                </div>
                {errors.terms && <p className="text-xs text-red-600 ml-6">{errors.terms}</p>}
            </div>

            {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {submitError}
                </div>
            )}
            <Button
                onClick={handleConfirmBooking}
                disabled={isSubmitting}
                className="w-full bg-qatar text-white py-4 rounded-xl shadow-lg font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t('booking.submitting') || 'Submitting...'}
                    </>
                ) : (
                    t('booking.confirmBookingRequest')
                )}
            </Button>
        </motion.div>
    );

    const renderConfirmation = () => (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 py-4"
        >
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>

            <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Request Received</h3>
                <p className="text-slate-600 text-base">
                    We'll get in touch with you soon.
                </p>
            </div>
        </motion.div>
    );

    return (
        <>
            <Card className="max-w-xl mx-auto bg-white shadow-2xl border-slate-100 overflow-hidden">
                <div className="p-4 sm:p-6 md:p-8">
                    <StepIndicator currentStep={step} />
                    <AnimatePresence mode="wait">
                        {step === 'request' && renderRequestForm()}
                        {step === 'finalize' && renderFinalize()}
                        {step === 'confirmation' && renderConfirmation()}
                    </AnimatePresence>
                </div>
            </Card>

            <Modal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} title={t('booking.termsConditions')}>
                <div className="space-y-4 text-sm text-slate-600 max-h-[60vh] overflow-y-auto">
                    <div>
                        <h3 className="font-bold text-slate-900 mb-2">{t('booking.termsSection1')}</h3>
                        <p>{t('booking.termsSection1Desc')}</p>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 mb-2">{t('booking.termsSection2')}</h3>
                        <p>{t('booking.termsSection2Desc')}</p>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 mb-2">{t('booking.termsSection3')}</h3>
                        <p>{t('booking.termsSection3Desc')}</p>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 mb-2">{t('booking.termsSection4')}</h3>
                        <p>{t('booking.termsSection4Desc')}</p>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default BookingFlow;
