import React from 'react';
import { Input } from './Input';
import { Select } from './Select';
import { Button } from './Button';

export interface FormField {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  value?: any;
  onChange?: (value: any) => void;
  error?: string;
}

interface MobileFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  submitLabel?: string;
  isLoading?: boolean;
  className?: string;
}

export const MobileForm: React.FC<MobileFormProps> = ({
  fields,
  onSubmit,
  submitLabel = 'Submit',
  isLoading = false,
  className = '',
}) => {
  const [formData, setFormData] = React.useState<Record<string, any>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {fields.map((field) => (
        <div key={field.name}>
          {field.type === 'select' ? (
            <Select
              label={field.label}
              options={field.options || []}
              value={field.value || formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              error={field.error}
            />
          ) : field.type === 'textarea' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <textarea
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-qatar/10 focus:border-qatar transition-all"
                placeholder={field.placeholder}
                required={field.required}
                value={field.value || formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                rows={4}
              />
              {field.error && (
                <p className="text-xs text-red-600 mt-1">{field.error}</p>
              )}
            </div>
          ) : (
            <Input
              label={field.label}
              type={field.type || 'text'}
              placeholder={field.placeholder}
              required={field.required}
              value={field.value || formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              error={field.error}
            />
          )}
        </div>
      ))}
      <Button
        type="submit"
        className="w-full mt-6 touch-manipulation"
        disabled={isLoading}
        isLoading={isLoading}
      >
        {submitLabel}
      </Button>
    </form>
  );
};

