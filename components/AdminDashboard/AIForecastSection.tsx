import React, { useState } from 'react';
import { BrainCircuit, Sparkles, Loader2, TrendingUp, Users, MapPin } from 'lucide-react';
import { Modal, Button, Input, Select, Card } from '../UI';
import { useTranslation } from '../../contexts/TranslationContext';
import { useToast } from '../ui/Toast';
import { ai as apiAI } from '../../services/api';

interface AIForecastSectionProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIForecastSection: React.FC<AIForecastSectionProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [forecastParams, setForecastParams] = useState({ 
    type: 'Conference', 
    attendees: 500, 
    location: 'Indoor' 
  });
  const [forecastResult, setForecastResult] = useState<any>(null);
  const [isForecasting, setIsForecasting] = useState(false);

  const handleForecast = async () => {
    setIsForecasting(true);
    setForecastResult(null);
    try {
      const response = await apiAI.staffingForecast(forecastParams.type, forecastParams.attendees, forecastParams.location);
      setForecastResult(response.data || {"Hosts": 10, "Security": 5});
      toast.success(t('admin.aiForecast.success') || 'Forecast generated successfully');
    } catch (error: any) {
      console.error('Error forecasting:', error);
      setForecastResult({"Hosts": 10, "Security": 5}); // Fallback
      toast.error(t('admin.aiForecast.error') || 'Failed to generate forecast');
    } finally {
      setIsForecasting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('admin.aiForecast.title')}>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <BrainCircuit className="text-purple-600" size={20} />
            <h3 className="font-bold text-purple-900">{t('admin.aiForecast.subtitle')}</h3>
          </div>
          <p className="text-sm text-purple-700">{t('admin.aiForecast.description')}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.aiForecast.eventType')}
            </label>
            <Select
              value={forecastParams.type}
              onChange={(e) => setForecastParams({ ...forecastParams, type: e.target.value })}
              options={[
                { value: 'Conference', label: t('admin.aiForecast.types.conference') },
                { value: 'Wedding', label: t('admin.aiForecast.types.wedding') },
                { value: 'Corporate', label: t('admin.aiForecast.types.corporate') },
                { value: 'Exhibition', label: t('admin.aiForecast.types.exhibition') },
                { value: 'Sports Event', label: t('admin.aiForecast.types.sports') },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.aiForecast.attendees')}
            </label>
            <Input
              type="number"
              value={forecastParams.attendees.toString()}
              onChange={(e) => setForecastParams({ 
                ...forecastParams, 
                attendees: parseInt(e.target.value) || 0 
              })}
              placeholder="500"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.aiForecast.location')}
            </label>
            <Select
              value={forecastParams.location}
              onChange={(e) => setForecastParams({ ...forecastParams, location: e.target.value })}
              options={[
                { value: 'Indoor', label: t('admin.aiForecast.locations.indoor') },
                { value: 'Outdoor', label: t('admin.aiForecast.locations.outdoor') },
                { value: 'Mixed', label: t('admin.aiForecast.locations.mixed') },
              ]}
            />
          </div>
        </div>

        <Button 
          onClick={handleForecast} 
          disabled={isForecasting || forecastParams.attendees <= 0}
          className="w-full"
        >
          {isForecasting ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              {t('admin.aiForecast.forecasting')}
            </>
          ) : (
            <>
              <Sparkles size={16} className="mr-2" />
              {t('admin.aiForecast.launchForecaster')}
            </>
          )}
        </Button>

        {forecastResult && (
          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-blue-50 border-emerald-200">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="text-emerald-600" size={20} />
              <h3 className="font-bold text-emerald-900">{t('admin.aiForecast.results')}</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Users size={16} className="text-blue-600" />
                  <span className="text-xs font-semibold text-gray-600">
                    {t('admin.aiForecast.recommendedStaff')}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {forecastResult.recommendedStaff || 'N/A'}
                </p>
              </div>
              
              <div className="bg-white p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin size={16} className="text-purple-600" />
                  <span className="text-xs font-semibold text-gray-600">
                    {t('admin.aiForecast.venue')}
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-900">
                  {forecastParams.location}
                </p>
              </div>
            </div>

            {forecastResult.breakdown && (
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-gray-900 mb-2">
                  {t('admin.aiForecast.staffBreakdown')}
                </h4>
                {Object.entries(forecastResult.breakdown).map(([role, count]: [string, any]) => (
                  <div key={role} className="flex justify-between items-center bg-white p-2 rounded">
                    <span className="text-sm text-gray-700">{role}</span>
                    <span className="font-bold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            )}

            {forecastResult.notes && (
              <div className="mt-4 p-3 bg-white rounded-lg">
                <p className="text-xs text-gray-600">{forecastResult.notes}</p>
              </div>
            )}
          </Card>
        )}
      </div>
    </Modal>
  );
};

