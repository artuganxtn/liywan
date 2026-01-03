import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, ArrowRight, Check, Calendar, MapPin, DollarSign, Users, Clock, FileText, Loader2 } from 'lucide-react';
import { Card, Button, Input, Select, Modal } from './UI';
import { useTranslation } from '../contexts/TranslationContext';
import { Event, EventBudget, EventRole } from '../types';

interface EventCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventData: any) => Promise<void>;
}

type WizardStep = 'basic' | 'budget' | 'staffing' | 'schedule' | 'review';

const EventCreationWizard: React.FC<EventCreationWizardProps> = ({ isOpen, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Basic Information
  const [basicInfo, setBasicInfo] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '10:00',
    endDate: '',
    endTime: '18:00',
    location: '',
    city: 'Doha',
    country: 'Qatar',
    eventType: 'Conference',
    estimatedRevenue: '',
    clientId: '',
  });

  // Step 2: Budget
  const [budget, setBudget] = useState<EventBudget>({
    total: 0,
    staffingAllocated: 0,
    logisticsAllocated: 0,
    marketingAllocated: 0,
    spent: 0,
  });

  // Step 3: Staffing Requirements
  const [staffingRoles, setStaffingRoles] = useState<EventRole[]>([
    { roleName: 'Event Manager', count: 1, filled: 0 },
  ]);

  // Step 4: Schedule (shifts will be added later)
  const [shifts, setShifts] = useState<any[]>([]);

  const steps: { key: WizardStep; label: string; icon: any }[] = [
    { key: 'basic', label: t('admin.basicInfo') || 'Basic Info', icon: FileText },
    { key: 'budget', label: t('admin.budget') || 'Budget', icon: DollarSign },
    { key: 'staffing', label: t('admin.staffing') || 'Staffing', icon: Users },
    { key: 'schedule', label: t('admin.schedule') || 'Schedule', icon: Clock },
    { key: 'review', label: t('admin.review') || 'Review', icon: Check },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const validateStep = (step: WizardStep): boolean => {
    switch (step) {
      case 'basic':
        if (!basicInfo.title || basicInfo.title.length < 3 || basicInfo.title.length > 100) {
          alert(t('admin.eventTitleRequired') || 'Event title must be between 3-100 characters');
          return false;
        }
        if (!basicInfo.startDate || !basicInfo.endDate) {
          alert(t('admin.dateRequired') || 'Start and end dates are required');
          return false;
        }
        if (new Date(basicInfo.endDate) < new Date(basicInfo.startDate)) {
          alert(t('admin.endDateAfterStart') || 'End date must be after start date');
          return false;
        }
        if (!basicInfo.location) {
          alert(t('admin.locationRequired') || 'Location is required');
          return false;
        }
        return true;
      case 'budget':
        if (budget.total <= 0) {
          alert(t('admin.budgetRequired') || 'Total budget must be greater than 0');
          return false;
        }
        const totalAllocated = budget.staffingAllocated + budget.logisticsAllocated + budget.marketingAllocated;
        if (totalAllocated > budget.total) {
          alert(t('admin.budgetExceeded') || 'Total allocations cannot exceed total budget');
          return false;
        }
        return true;
      case 'staffing':
        if (staffingRoles.length === 0 || staffingRoles.some(r => r.count <= 0)) {
          alert(t('admin.staffingRequired') || 'At least one role with quantity > 0 is required');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].key);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep('review')) return;

    setIsSubmitting(true);
    try {
      const eventData = {
        // Basic info
        title: basicInfo.title,
        description: basicInfo.description,
        location: {
          address: basicInfo.location,
          city: basicInfo.city,
          country: basicInfo.country,
        },
        startAt: new Date(`${basicInfo.startDate}T${basicInfo.startTime}`).toISOString(),
        endAt: new Date(`${basicInfo.endDate}T${basicInfo.endTime}`).toISOString(),
        eventType: basicInfo.eventType,
        estimatedRevenue: basicInfo.estimatedRevenue ? Number(basicInfo.estimatedRevenue) : undefined,
        clientId: basicInfo.clientId || undefined,

        // Budget
        notes: {
          budget: budget,
        },

        // Staffing
        requiredRoles: staffingRoles.reduce((acc, role) => {
          acc[role.roleName] = role.count;
          return acc;
        }, {} as Record<string, number>),

        // Status
        status: 'DRAFT', // Will be changed to PENDING on submit for approval
      };

      await onSubmit(eventData);
      handleClose();
    } catch (error) {
      console.error('Failed to create event:', error);
      alert(error instanceof Error ? error.message : 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep('basic');
    setBasicInfo({
      title: '',
      description: '',
      startDate: '',
      startTime: '10:00',
      endDate: '',
      endTime: '18:00',
      location: '',
      city: 'Doha',
      country: 'Qatar',
      eventType: 'Conference',
      estimatedRevenue: '',
      clientId: '',
    });
    setBudget({ total: 0, staffingAllocated: 0, logisticsAllocated: 0, marketingAllocated: 0, spent: 0 });
    setStaffingRoles([{ roleName: 'Event Manager', count: 1, filled: 0 }]);
    setShifts([]);
    onClose();
  };

  const updateBudgetField = (field: keyof EventBudget, value: number) => {
    setBudget(prev => ({ ...prev, [field]: value }));
  };

  const addStaffingRole = () => {
    setStaffingRoles([...staffingRoles, { roleName: 'General Staff', count: 1, filled: 0 }]);
  };

  const updateStaffingRole = (index: number, field: keyof EventRole, value: string | number) => {
    const updated = [...staffingRoles];
    updated[index] = { ...updated[index], [field]: value };
    setStaffingRoles(updated);
  };

  const removeStaffingRole = (index: number) => {
    setStaffingRoles(staffingRoles.filter((_, i) => i !== index));
  };

  const budgetSummary = {
    totalAllocated: budget.staffingAllocated + budget.logisticsAllocated + budget.marketingAllocated,
    remaining: budget.total - (budget.staffingAllocated + budget.logisticsAllocated + budget.marketingAllocated),
  };

  const totalStaffNeeded = staffingRoles.reduce((sum, role) => sum + role.count, 0);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('admin.createNewEvent') || 'Create New Event'} size="large">
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-gray-600 mb-2">
            <span>{t('admin.step') || 'Step'} {currentStepIndex + 1} {t('admin.of') || 'of'} {steps.length}</span>
            <span>{Math.round(progress)}% {t('admin.complete') || 'Complete'}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-qatar"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between items-center">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.key;
            const isCompleted = currentStepIndex > index;
            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      isActive
                        ? 'bg-qatar border-qatar text-white'
                        : isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-gray-100 border-gray-300 text-gray-400'
                    }`}
                  >
                    {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                  </div>
                  <span className={`text-xs font-bold mt-2 ${isActive ? 'text-qatar' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 ${isCompleted ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {currentStep === 'basic' && (
              <motion.div
                key="basic"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <Input
                  label={t('admin.eventTitle') || 'Event Title *'}
                  value={basicInfo.title}
                  onChange={(e) => setBasicInfo({ ...basicInfo, title: e.target.value })}
                  placeholder={t('admin.eventTitlePlaceholder') || 'Enter event title (3-100 characters)'}
                  name="eventTitle"
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={t('admin.startDate') || 'Start Date *'}
                    type="date"
                    value={basicInfo.startDate}
                    onChange={(e) => setBasicInfo({ ...basicInfo, startDate: e.target.value })}
                    name="startDate"
                    required
                  />
                  <Input
                    label={t('admin.startTime') || 'Start Time'}
                    type="time"
                    value={basicInfo.startTime}
                    onChange={(e) => setBasicInfo({ ...basicInfo, startTime: e.target.value })}
                    name="startTime"
                  />
                  <Input
                    label={t('admin.endDate') || 'End Date *'}
                    type="date"
                    value={basicInfo.endDate}
                    onChange={(e) => setBasicInfo({ ...basicInfo, endDate: e.target.value })}
                    name="endDate"
                    required
                  />
                  <Input
                    label={t('admin.endTime') || 'End Time'}
                    type="time"
                    value={basicInfo.endTime}
                    onChange={(e) => setBasicInfo({ ...basicInfo, endTime: e.target.value })}
                    name="endTime"
                  />
                </div>
                <Input
                  label={t('client.location') || 'Location/Venue *'}
                  value={basicInfo.location}
                  onChange={(e) => setBasicInfo({ ...basicInfo, location: e.target.value })}
                  placeholder={t('admin.locationPlaceholder') || 'Enter venue address'}
                  icon={<MapPin size={16} />}
                  name="location"
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label={t('admin.eventType') || 'Event Type'}
                    options={[
                      { value: 'Conference', label: 'Conference' },
                      { value: 'Exhibition', label: 'Exhibition' },
                      { value: 'Corporate', label: 'Corporate Event' },
                      { value: 'Wedding', label: 'Wedding' },
                      { value: 'Other', label: 'Other' },
                    ]}
                    value={basicInfo.eventType}
                    onChange={(e) => setBasicInfo({ ...basicInfo, eventType: e.target.value })}
                    name="eventType"
                  />
                  <Input
                    label={t('admin.estimatedRevenue') || 'Estimated Revenue (QAR)'}
                    type="number"
                    value={basicInfo.estimatedRevenue}
                    onChange={(e) => setBasicInfo({ ...basicInfo, estimatedRevenue: e.target.value })}
                    placeholder="0"
                    name="estimatedRevenue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('admin.description') || 'Description'}
                  </label>
                  <textarea
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-qatar/20 focus:border-qatar transition-all resize-y"
                    rows={4}
                    value={basicInfo.description}
                    onChange={(e) => setBasicInfo({ ...basicInfo, description: e.target.value })}
                    placeholder={t('admin.descriptionPlaceholder') || 'Enter event description (optional)'}
                  />
                </div>
              </motion.div>
            )}

            {currentStep === 'budget' && (
              <motion.div
                key="budget"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <Input
                    label={t('admin.totalBudget') || 'Total Budget (QAR) *'}
                    type="number"
                    value={budget.total}
                    onChange={(e) => updateBudgetField('total', Number(e.target.value) || 0)}
                    placeholder="0"
                    name="totalBudget"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="flex justify-between text-sm font-bold text-gray-700 mb-2">
                      <span>{t('admin.staffingBudget') || 'Staffing'}</span>
                      <span className="text-qatar">
                        {budget.total > 0 ? ((budget.staffingAllocated / budget.total) * 100).toFixed(1) : 0}%
                      </span>
                    </label>
                    <Input
                      type="number"
                      value={budget.staffingAllocated}
                      onChange={(e) => updateBudgetField('staffingAllocated', Number(e.target.value) || 0)}
                      placeholder="0"
                      name="staffingBudget"
                    />
                  </div>
                  <div>
                    <label className="flex justify-between text-sm font-bold text-gray-700 mb-2">
                      <span>{t('admin.logisticsBudget') || 'Logistics'}</span>
                      <span className="text-blue-600">
                        {budget.total > 0 ? ((budget.logisticsAllocated / budget.total) * 100).toFixed(1) : 0}%
                      </span>
                    </label>
                    <Input
                      type="number"
                      value={budget.logisticsAllocated}
                      onChange={(e) => updateBudgetField('logisticsAllocated', Number(e.target.value) || 0)}
                      placeholder="0"
                      name="logisticsBudget"
                    />
                  </div>
                  <div>
                    <label className="flex justify-between text-sm font-bold text-gray-700 mb-2">
                      <span>{t('admin.marketingBudget') || 'Marketing'}</span>
                      <span className="text-amber-600">
                        {budget.total > 0 ? ((budget.marketingAllocated / budget.total) * 100).toFixed(1) : 0}%
                      </span>
                    </label>
                    <Input
                      type="number"
                      value={budget.marketingAllocated}
                      onChange={(e) => updateBudgetField('marketingAllocated', Number(e.target.value) || 0)}
                      placeholder="0"
                      name="marketingBudget"
                    />
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-bold text-gray-700">{t('admin.totalAllocated') || 'Total Allocated'}:</span>
                    <span className="font-bold">QAR {budgetSummary.totalAllocated.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-gray-700">{t('admin.remaining') || 'Remaining'}:</span>
                    <span className={`font-bold ${budgetSummary.remaining < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      QAR {budgetSummary.remaining.toLocaleString()}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    const total = budget.total;
                    updateBudgetField('staffingAllocated', Math.round(total * 0.5));
                    updateBudgetField('logisticsAllocated', Math.round(total * 0.3));
                    updateBudgetField('marketingAllocated', Math.round(total * 0.2));
                  }}
                  className="w-full"
                >
                  {t('admin.distributeEvenly') || 'Distribute Evenly (50/30/20)'}
                </Button>
              </motion.div>
            )}

            {currentStep === 'staffing' && (
              <motion.div
                key="staffing"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-900">{t('admin.staffingRequirements') || 'Staffing Requirements'}</h3>
                  <Button size="sm" onClick={addStaffingRole}>
                    <Users size={16} className="mr-2" /> {t('admin.addRole') || 'Add Role'}
                  </Button>
                </div>
                <div className="space-y-3">
                  {staffingRoles.map((role, index) => (
                    <div key={index} className="flex gap-3 items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <Input
                        value={role.roleName}
                        onChange={(e) => updateStaffingRole(index, 'roleName', e.target.value)}
                        placeholder={t('admin.roleName') || 'Role Name'}
                        className="flex-1"
                        name={`roleName-${index}`}
                      />
                      <Input
                        type="number"
                        value={role.count}
                        onChange={(e) => updateStaffingRole(index, 'count', Number(e.target.value) || 0)}
                        placeholder="0"
                        className="w-24"
                        name={`roleCount-${index}`}
                        min="1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStaffingRole(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm font-bold text-gray-700">
                    {t('admin.totalStaffNeeded') || 'Total Staff Needed'}: <span className="text-qatar">{totalStaffNeeded}</span>
                  </p>
                </div>
              </motion.div>
            )}

            {currentStep === 'schedule' && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center py-8 text-gray-500">
                  <Clock size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="font-bold">{t('admin.scheduleComingSoon') || 'Schedule Management'}</p>
                  <p className="text-sm mt-2">
                    {t('admin.scheduleNote') || 'You can add shifts after creating the event from the event details page.'}
                  </p>
                </div>
              </motion.div>
            )}

            {currentStep === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="font-bold text-gray-900 text-lg">{t('admin.reviewEventDetails') || 'Review Event Details'}</h3>
                <Card className="p-4 space-y-3">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">{t('admin.eventTitle') || 'Event Title'}</p>
                    <p className="font-bold text-gray-900">{basicInfo.title}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">{t('admin.startDate') || 'Start'}</p>
                      <p className="text-sm text-gray-700">
                        {basicInfo.startDate} {basicInfo.startTime}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">{t('admin.endDate') || 'End'}</p>
                      <p className="text-sm text-gray-700">
                        {basicInfo.endDate} {basicInfo.endTime}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">{t('client.location') || 'Location'}</p>
                    <p className="text-sm text-gray-700">{basicInfo.location}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">{t('admin.totalBudget') || 'Total Budget'}</p>
                    <p className="text-sm font-bold text-gray-900">QAR {budget.total.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">{t('admin.totalStaffNeeded') || 'Total Staff Needed'}</p>
                    <p className="text-sm font-bold text-gray-900">{totalStaffNeeded}</p>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t border-gray-200">
          <Button
            variant="ghost"
            onClick={currentStepIndex === 0 ? handleClose : handleBack}
            disabled={isSubmitting}
          >
            <ArrowLeft size={16} className="mr-2" />
            {currentStepIndex === 0 ? t('admin.cancel') || 'Cancel' : t('admin.back') || 'Back'}
          </Button>
          <div className="flex gap-3">
            {currentStepIndex < steps.length - 1 ? (
              <Button onClick={handleNext}>
                {t('admin.next') || 'Next'} <ArrowRight size={16} className="ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    {t('admin.creating') || 'Creating...'}
                  </>
                ) : (
                  <>
                    <Check size={16} className="mr-2" />
                    {t('admin.createEvent') || 'Create Event'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EventCreationWizard;

