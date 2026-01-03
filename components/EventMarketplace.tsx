import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Calendar, Clock, MapPin, DollarSign, Users, Search,
    Filter, ChevronDown, Star, TrendingUp, Zap, Loader2
} from 'lucide-react';
import { Button, Card, Badge, Input } from './UI';
// Backend API removed - using mock data only

export interface EventOpportunity {
    id: string;
    title: string;
    type: string;
    date: string;
    startTime: string;
    endTime: string;
    duration: string;
    location: string;
    pay: number;
    spotsTotal: number;
    spotsFilled: number;
    urgency: 'available' | 'few-spots' | 'full';
    isVIP?: boolean;
    requirements: string[];
}

const MOCK_EVENTS: EventOpportunity[] = [
    {
        id: 'e1',
        title: 'Qatar National Day Parade',
        type: 'Protocol',
        date: '2024-12-18',
        startTime: '08:00 AM',
        endTime: '06:00 PM',
        duration: '10 hours',
        location: 'Corniche, Doha',
        pay: 1200,
        spotsTotal: 50,
        spotsFilled: 45,
        urgency: 'few-spots',
        isVIP: true,
        requirements: ['Arabic', 'Protocol Experience', 'Formal Attire']
    },
    {
        id: 'e2',
        title: 'Doha Jewellery Exhibition',
        type: 'Hostess',
        date: '2024-12-20',
        startTime: '10:00 AM',
        endTime: '08:00 PM',
        duration: '10 hours',
        location: 'DECC',
        pay: 800,
        spotsTotal: 30,
        spotsFilled: 12,
        urgency: 'available',
        requirements: ['English', 'Customer Service', 'Professional Appearance']
    },
    {
        id: 'e3',
        title: 'F1 Grand Prix Qatar',
        type: 'Security',
        date: '2024-11-29',
        startTime: '12:00 PM',
        endTime: '11:00 PM',
        duration: '11 hours',
        location: 'Lusail Circuit',
        pay: 1500,
        spotsTotal: 100,
        spotsFilled: 100,
        urgency: 'full',
        isVIP: true,
        requirements: ['Security License', 'Crowd Control', 'Physical Fitness']
    },
    {
        id: 'e4',
        title: 'Corporate Gala Dinner',
        type: 'Server',
        date: '2024-12-15',
        startTime: '06:00 PM',
        endTime: '12:00 AM',
        duration: '6 hours',
        location: 'St. Regis Doha',
        pay: 600,
        spotsTotal: 20,
        spotsFilled: 8,
        urgency: 'available',
        requirements: ['Fine Dining Experience', 'English', 'Black Tie']
    },
    {
        id: 'e5',
        title: 'Web Summit Qatar',
        type: 'Registration',
        date: '2025-02-20',
        startTime: '08:00 AM',
        endTime: '06:00 PM',
        duration: '10 hours',
        location: 'DECC',
        pay: 700,
        spotsTotal: 40,
        spotsFilled: 25,
        urgency: 'available',
        requirements: ['Tech Savvy', 'English', 'Fast Typing']
    }
];

const EVENT_TYPES = ['All', 'Protocol', 'Hostess', 'Security', 'Server', 'Registration'];
const LOCATIONS = ['All', 'Doha', 'Lusail', 'West Bay', 'DECC', 'Corniche'];

export const EventMarketplace: React.FC<{ onApply: (eventId: string) => void }> = ({ onApply }) => {
    const [events, setEvents] = useState<EventOpportunity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('All');
    const [selectedLocation, setSelectedLocation] = useState('All');
    const [showFilters, setShowFilters] = useState(false);

    // Fetch events from API
    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await api.events.list({ 
                    page: 1, 
                    pageSize: 100,
                    status: 'APPROVED' // Only show approved events
                });
                
                // Transform API events to EventOpportunity format
                const transformedEvents: EventOpportunity[] = response.data.map((e: any) => {
                    const startDate = new Date(e.startAt);
                    const endDate = new Date(e.endAt);
                    const durationMs = endDate.getTime() - startDate.getTime();
                    const durationHours = Math.round(durationMs / (1000 * 60 * 60));
                    
                    const totalSpots = Object.values(e.requiredRoles || {}).reduce((sum: number, count: any) => 
                        sum + (typeof count === 'number' ? count : 0), 0);
                    const filledSpots = e.assignments?.length || 0;
                    const spotsLeft = totalSpots - filledSpots;
                    
                    let urgency: 'available' | 'few-spots' | 'full' = 'available';
                    if (spotsLeft === 0) urgency = 'full';
                    else if (spotsLeft <= 5) urgency = 'few-spots';
                    
                    const location = typeof e.location === 'object' ? e.location.address : e.location;
                    
                    return {
                        id: e.id,
                        title: e.title,
                        type: Object.keys(e.requiredRoles || {})[0] || 'General',
                        date: startDate.toISOString().split('T')[0],
                        startTime: startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                        endTime: endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                        duration: `${durationHours} hours`,
                        location: location,
                        pay: 500, // Default pay - should come from event data
                        spotsTotal: totalSpots,
                        spotsFilled: filledSpots,
                        urgency: urgency,
                        isVIP: e.notes?.isVIP || false,
                        requirements: Object.keys(e.requiredRoles || {}),
                    };
                });
                
                setEvents(transformedEvents);
            } catch (err) {
                console.error('Failed to fetch events:', err);
                setError(err instanceof Error ? err.message : 'Failed to load events');
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchEvents();
    }, []);

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.type.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedType === 'All' || event.type === selectedType;
        const matchesLocation = selectedLocation === 'All' || event.location.includes(selectedLocation);
        return matchesSearch && matchesType && matchesLocation;
    });

    const getUrgencyConfig = (urgency: string) => {
        switch (urgency) {
            case 'available':
                return { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: '🟢', label: 'Available' };
            case 'few-spots':
                return { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: '⚠️', label: 'Few Spots Left' };
            case 'full':
                return { color: 'bg-red-100 text-red-700 border-red-200', icon: '🔴', label: 'Full' };
            default:
                return { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: '⚪', label: 'Unknown' };
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Zap className="w-8 h-8 text-qatar" />
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Live Event Opportunities</h1>
                    </div>
                    <p className="text-slate-600">Browse and apply for premium events across Qatar</p>
                </motion.div>

                {/* Search & Filters */}
                <Card className="mb-6 p-4">
                    <div className="flex flex-col md:flex-row gap-3">
                        {/* Search */}
                        <div className="flex-1">
                            <Input
                                type="text"
                                placeholder="Search events..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                icon={<Search />}
                                name="eventSearch"
                            />
                        </div>

                        {/* Filter Toggle */}
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            className="md:w-auto"
                        >
                            <Filter size={18} className="mr-2" />
                            Filters
                            <ChevronDown size={16} className={`ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </Button>
                    </div>

                    {/* Filter Options */}
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-4 pt-4 border-t border-gray-200 grid md:grid-cols-2 gap-4"
                        >
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Event Type</label>
                                <div className="flex flex-wrap gap-2">
                                    {EVENT_TYPES.map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setSelectedType(type)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedType === type
                                                    ? 'bg-qatar text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
                                <div className="flex flex-wrap gap-2">
                                    {LOCATIONS.map(location => (
                                        <button
                                            key={location}
                                            onClick={() => setSelectedLocation(location)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedLocation === location
                                                    ? 'bg-qatar text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {location}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </Card>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 text-qatar animate-spin" />
                        <span className="ml-3 text-slate-600">Loading events...</span>
                    </div>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                {/* Results Count */}
                {!isLoading && !error && (
                    <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm text-slate-600">
                            Showing <span className="font-bold text-slate-900">{filteredEvents.length}</span> opportunities
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <TrendingUp size={14} />
                            <span>Updated in real-time</span>
                        </div>
                    </div>
                )}

                {/* Event Cards */}
                {!isLoading && !error && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map((event, index) => {
                        const urgency = getUrgencyConfig(event.urgency);
                        const spotsLeft = event.spotsTotal - event.spotsFilled;

                        return (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="h-full flex flex-col hover:shadow-xl transition-all duration-300 hover:border-qatar/30 relative overflow-hidden group">
                                    {/* VIP Badge */}
                                    {event.isVIP && (
                                        <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 to-amber-300 text-amber-900 text-xs font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
                                            <Star size={12} fill="currentColor" />
                                            VIP EVENT
                                        </div>
                                    )}

                                    {/* Urgency Badge */}
                                    <div className={`mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${urgency.color}`}>
                                        <span>{urgency.icon}</span>
                                        {urgency.label}
                                    </div>

                                    {/* Event Info */}
                                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-qatar transition-colors">
                                        {event.title}
                                    </h3>
                                    <p className="text-sm font-semibold text-qatar mb-4">{event.type}</p>

                                    <div className="space-y-2 mb-4 flex-1">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Calendar size={16} className="text-slate-400" />
                                            {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Clock size={16} className="text-slate-400" />
                                            {event.startTime} - {event.endTime} ({event.duration})
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <MapPin size={16} className="text-slate-400" />
                                            {event.location}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Users size={16} className="text-slate-400" />
                                            {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
                                        </div>
                                    </div>

                                    {/* Pay */}
                                    <div className="mb-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-emerald-700 font-semibold">Total Pay</span>
                                            <div className="flex items-center gap-1">
                                                <DollarSign size={18} className="text-emerald-600" />
                                                <span className="text-2xl font-bold text-emerald-900">QAR {event.pay}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Requirements */}
                                    <div className="mb-4">
                                        <p className="text-xs font-semibold text-slate-600 mb-2">Requirements:</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {event.requirements.map((req, i) => (
                                                <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200">
                                                    {req}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    <Button
                                        onClick={() => onApply(event.id)}
                                        disabled={event.urgency === 'full'}
                                        className={`w-full ${event.urgency === 'full' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {event.urgency === 'full' ? 'Event Full' : 'Apply Now'}
                                    </Button>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
                )}

                {/* No Results */}
                {!isLoading && !error && filteredEvents.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-slate-500 text-lg">No events match your filters</p>
                        <Button
                            onClick={() => {
                                setSearchQuery('');
                                setSelectedType('All');
                                setSelectedLocation('All');
                            }}
                            variant="outline"
                            className="mt-4"
                        >
                            Clear Filters
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
