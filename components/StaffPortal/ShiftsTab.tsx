import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { Card, Button, Badge } from '../UI';
import { useTranslation } from '../../contexts/TranslationContext';
import { Shift } from '../../types';
import { useShifts } from '../../hooks/useShifts';

interface ShiftsTabProps {
  onShiftAction?: (shiftId: string, action: string) => void;
}

export const ShiftsTab: React.FC<ShiftsTabProps> = ({ onShiftAction }) => {
  const { t } = useTranslation();
  const { shifts, isLoading, confirmShift } = useShifts();

  const handleConfirm = async (shiftId: string, status: 'Confirmed' | 'Declined') => {
    try {
      await confirmShift(shiftId, status);
      onShiftAction?.(shiftId, status);
    } catch (error) {
      console.error('Failed to confirm shift:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">{t('ui.loading')}...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('shifts.myShifts')}</h2>
          <p className="text-gray-500 text-sm mt-1">{t('shifts.manageShifts')}</p>
        </div>
      </div>

      {shifts.length > 0 ? (
        <div className="space-y-4">
          {shifts.map(shift => (
            <motion.div
              key={shift.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="hover:shadow-lg transition-all">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{shift.eventTitle}</h3>
                      {shift.confirmationStatus === 'Pending' && (
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                          Action Required
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin size={16} className="text-gray-400" />
                        <span>{shift.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} className="text-gray-400" />
                        <span>{shift.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={16} className="text-gray-400" />
                        <span>{shift.startTime} - {shift.endTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-600 font-bold">
                        <DollarSign size={16} />
                        <span>QAR {shift.wage}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <Badge status={shift.confirmationStatus === 'Pending' ? 'Pending' : shift.status} />
                    {shift.confirmationStatus === 'Pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConfirm(shift.id, 'Declined')}
                        >
                          <XCircle size={14} className="mr-1" /> {t('shifts.decline')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleConfirm(shift.id, 'Confirmed')}
                        >
                          <CheckCircle size={14} className="mr-1" /> {t('shifts.confirm')}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="text-center py-16">
          <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 font-bold">{t('shifts.noShifts')}</p>
          <p className="text-sm text-gray-400 mt-2">{t('shifts.checkBack')}</p>
        </Card>
      )}
    </div>
  );
};

