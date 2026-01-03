import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Phone, Mail, X, Send, Calendar, CheckCircle } from 'lucide-react';
import { Button } from './UI';
import { useTranslation } from '../contexts/TranslationContext';
import { useToast } from './ui/Toast';

const ExpressContact = () => {
    const { t } = useTranslation();
    const toast = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSendMessage = async () => {
        if (!message.trim()) {
            toast.error('Please enter a message');
            return;
        }

        setIsSending(true);
        try {
            // Create WhatsApp link with pre-filled message
            const whatsappNumber = '+97444000000'; // Replace with actual WhatsApp number
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
            
            // Open WhatsApp in new tab
            window.open(whatsappUrl, '_blank');
            
            // Show success message
            toast.success('Opening WhatsApp...');
            setIsSent(true);
            setMessage('');
            
            // Reset after 3 seconds
            setTimeout(() => {
                setIsSent(false);
                setIsOpen(false);
            }, 3000);
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const handleWhatsAppClick = () => {
        const whatsappNumber = '+97444000000'; // Replace with actual WhatsApp number
        const defaultMessage = encodeURIComponent('Hello, I need help with event staffing.');
        const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${defaultMessage}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleCallClick = () => {
        const phoneNumber = '+97444000000'; // Replace with actual phone number
        window.location.href = `tel:${phoneNumber}`;
    };

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 bg-white rounded-2xl shadow-2xl border border-slate-200 w-[calc(100vw-2rem)] sm:w-80 max-w-sm overflow-hidden"
                    >
                        <div className="bg-qatar p-4 text-white">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="font-bold">{t('contact.hiHowCanWeHelp')}</h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-white/80 hover:text-white"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <p className="text-xs text-white/80">{t('contact.typicallyReply')}</p>
                        </div>

                        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                <button
                                    onClick={handleWhatsAppClick}
                                    className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 transition-all border border-slate-100 cursor-pointer touch-manipulation"
                                >
                                    <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#25D366] mb-1.5 sm:mb-2" />
                                    <span className="text-xs font-semibold text-slate-700">{t('contact.whatsApp')}</span>
                                </button>
                                <button
                                    onClick={handleCallClick}
                                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 cursor-pointer"
                                >
                                    <Phone className="w-6 h-6 text-qatar mb-2" />
                                    <span className="text-xs font-semibold text-slate-700">{t('contact.callNow')}</span>
                                </button>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-100"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-slate-400">{t('contact.orSendMessage')}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {isSent ? (
                                    <div className="flex items-center justify-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                        <CheckCircle className="w-5 h-5 text-emerald-600 mr-2" />
                                        <span className="text-xs font-semibold text-emerald-700">Message sent! Opening WhatsApp...</span>
                                    </div>
                                ) : (
                                    <>
                                        <textarea
                                            className="w-full rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-qatar resize-none"
                                            rows={3}
                                            placeholder={t('contact.messagePlaceholder')}
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                                    handleSendMessage();
                                                }
                                            }}
                                        />
                                        <Button 
                                            size="sm" 
                                            className="w-full bg-slate-900 text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={handleSendMessage}
                                            disabled={isSending || !message.trim()}
                                        >
                                            {isSending ? (
                                                <>Sending...</>
                                            ) : (
                                                <>
                                                    {t('contact.sendMessage')} <Send className="w-3 h-3 ml-2" />
                                                </>
                                            )}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="h-14 px-6 rounded-full bg-slate-900 text-white shadow-lg flex items-center gap-3 hover:bg-slate-800 transition-colors"
            >
                <MessageCircle className="w-6 h-6" />
                <div className="text-left hidden sm:block">
                    <p className="text-[10px] font-medium text-slate-300 uppercase tracking-wider leading-none mb-0.5">{t('contact.needStaffNow')}</p>
                    <p className="text-sm font-bold leading-none">{t('contact.quickChat')}</p>
                </div>
            </motion.button>
        </div>
    );
};

export default ExpressContact;
