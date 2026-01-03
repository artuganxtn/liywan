import React, { useEffect, useState } from 'react';
import { Save, Check } from 'lucide-react';

interface AutoSaveIndicatorProps {
    isSaving: boolean;
    lastSaved?: Date;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({ isSaving, lastSaved }) => {
    const [showSaved, setShowSaved] = useState(false);

    useEffect(() => {
        if (!isSaving && lastSaved) {
            setShowSaved(true);
            const timer = setTimeout(() => setShowSaved(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isSaving, lastSaved]);

    if (isSaving) {
        return (
            <div className="flex items-center gap-2 text-xs text-blue-600">
                <Save className="w-4 h-4 animate-pulse" />
                <span>Saving...</span>
            </div>
        );
    }

    if (showSaved && lastSaved) {
        return (
            <div className="flex items-center gap-2 text-xs text-emerald-600">
                <Check className="w-4 h-4" />
                <span>Saved {lastSaved.toLocaleTimeString()}</span>
            </div>
        );
    }

    return null;
};

interface ProgressIndicatorProps {
    currentStep: number;
    totalSteps: number;
    completionPercentage: number;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
    currentStep,
    totalSteps,
    completionPercentage
}) => {
    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700">
                    Step {currentStep} of {totalSteps}
                </span>
                <span className="text-sm font-bold text-qatar">
                    {completionPercentage}% Complete
                </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-qatar to-qatar-light transition-all duration-500 ease-out"
                    style={{ width: `${completionPercentage}%` }}
                />
            </div>
            <p className="text-xs text-slate-500 mt-1">
                Estimated time remaining: {Math.max(1, 4 - currentStep)} min
            </p>
        </div>
    );
};
