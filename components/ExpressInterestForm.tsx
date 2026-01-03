import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageCircle, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Button, Card, Input } from './UI';

const EVENT_TYPES = [
    'Protocol & VIP Services',
    'Hostess & Reception',
    'Security & Crowd Control',
    'Server & Catering',
    'Registration & Check-in',
    'Logistics & Setup'
];

interface ExpressInterestFormProps {
    eventId?: string;
    eventTitle?: string;
    onComplete: (data: ExpressInterestData) => void;
}

export interface ExpressInterestData {
    email: string;
    whatsapp: string;
    eventTypes: string[];
    eventId?: string;
}

export const ExpressInterestForm: React.FC<ExpressInterestFormProps> = ({
    eventId,
    eventTitle,
    onComplete
}) => {
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [email, setEmail] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const toggleEventType = (type: string) => {
        setSelectedTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
        if (errors.eventTypes) {
            setErrors({ ...errors, eventTypes: '' });
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!email || !email.includes('@')) {
            newErrors.email = 'Valid email is required';
        }

        if (selectedTypes.length === 0) {
            newErrors.eventTypes = 'Select at least one event type';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        const data: ExpressInterestData = {
            email,
            whatsapp,
            eventTypes: selectedTypes,
            eventId
        };

        onComplete(data);
        setStep('success');
    };

    if (step === 'success') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto"
            >
                <Card className="text-center p-8 md:p-12">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                        <CheckCircle className="w-12 h-12 text-emerald-600" />
                    </motion.div>

                    <h2 className="text-3xl font-bold text-slate-900 mb-3">Interest Registered!</h2>
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">
                        Thank you for your interest. We've sent a confirmation to <span className="font-semibold text-slate-900">{email}</span>
                    </p>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                        <div className="flex items-start gap-3">
                            <Sparkles className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-left">
                                <h3 className="font-bold text-blue-900 mb-2">Next Steps:</h3>
                                <ol className="text-sm text-blue-800 space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold">1.</span>
                                        <span>Complete your profile (2-3 minutes)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold">2.</span>
                                        <span>Upload required documents</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold">3.</span>
                                        <span>Pass quick protocol assessment</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold">4.</span>
                                        <span>Get verified & start applying!</span>
                                    </li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    {whatsapp && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-center gap-2 text-emerald-800">
                                <MessageCircle className="w-5 h-5" />
                                <p className="text-sm font-semibold">
                                    We'll send updates to your WhatsApp: {whatsapp}
                                </p>
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={() => window.location.href = '#complete-profile'}
                        className="w-full md:w-auto px-8"
                    >
                        Complete Profile Now
                        <ArrowRight className="ml-2" size={18} />
                    </Button>

                    <p className="text-xs text-slate-500 mt-4">
                        Profile completion takes 2-3 minutes • Get approved within 24-48 hours
                    </p>
                </Card>
            </motion.div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 text-center"
            >
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                    {eventTitle ? `Apply for ${eventTitle}` : 'Express Your Interest'}
                </h2>
                <p className="text-slate-600">Quick 30-second form • No commitment required</p>
                <div className="flex items-center justify-center gap-2 mt-3 text-sm text-emerald-600">
                    <Sparkles size={16} />
                    <span className="font-semibold">Join 500+ approved professionals</span>
                </div>
            </motion.div>

            <Card className="p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email */}
                    <div>
                        <Input
                            label={
                                <>
                                    Email Address <span className="text-red-500">*</span>
                                </>
                            }
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (errors.email) setErrors({ ...errors, email: '' });
                            }}
                            placeholder="your.email@example.com"
                            icon={<Mail />}
                            error={errors.email}
                            name="email"
                        />
                    </div>

                    {/* WhatsApp */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            WhatsApp Number <span className="text-slate-400 font-normal">(Preferred)</span>
                        </label>
                        <div className="relative">
                            <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="tel"
                                value={whatsapp}
                                onChange={(e) => setWhatsapp(e.target.value)}
                                placeholder="+974 XXXX XXXX"
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-qatar/20"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Get instant updates via WhatsApp (recommended for Qatar)
                        </p>
                    </div>

                    {/* Event Types */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">
                            Event Types of Interest <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {EVENT_TYPES.map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => toggleEventType(type)}
                                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${selectedTypes.includes(type)
                                            ? 'border-qatar bg-qatar/5 text-qatar'
                                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                        {errors.eventTypes && <p className="text-red-500 text-xs mt-2">{errors.eventTypes}</p>}
                    </div>

                    {/* Submit */}
                    <Button type="submit" className="w-full py-4 text-lg font-bold">
                        Express Interest
                        <ArrowRight className="ml-2" size={20} />
                    </Button>

                    <p className="text-xs text-center text-slate-500">
                        By submitting, you agree to receive communications about event opportunities
                    </p>
                </form>
            </Card>
        </div>
    );
};
