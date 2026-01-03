import React, { useMemo } from 'react';
import { Search, Calendar, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { Card, Button, Badge, Input, Select, Skeleton, SkeletonTable } from '../UI';
import { Booking } from '../../types';
import { useTranslation } from '../../contexts/TranslationContext';

interface BookingsSectionProps {
  bookings: Booking[];
  isLoadingBookings: boolean;
  bookingSearch: string;
  setBookingSearch: (search: string) => void;
  bookingStatusFilter: 'All' | 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Converted';
  setBookingStatusFilter: (filter: 'All' | 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Converted') => void;
  handleBookingDecision: (bookingId: string, status: 'Approved' | 'Rejected') => void;
  setSelectedBooking: (booking: Booking | null) => void;
  setIsBookingModalOpen: (open: boolean) => void;
}

export const BookingsSection: React.FC<BookingsSectionProps> = ({
  bookings,
  isLoadingBookings,
  bookingSearch,
  setBookingSearch,
  bookingStatusFilter,
  setBookingStatusFilter,
  handleBookingDecision,
  setSelectedBooking,
  setIsBookingModalOpen,
}) => {
  const { t } = useTranslation();
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const searchLower = (bookingSearch || '').toLowerCase();
      const matchesSearch = !bookingSearch || 
        booking.eventType?.toLowerCase().includes(searchLower) ||
        booking.contact?.name?.toLowerCase().includes(searchLower) ||
        booking.contact?.email?.toLowerCase().includes(searchLower) ||
        booking.contact?.phone?.toLowerCase().includes(searchLower) ||
        booking.location?.toLowerCase().includes(searchLower) ||
        booking.eventDetails?.venue?.toLowerCase().includes(searchLower);
      const matchesFilter = bookingStatusFilter === 'All' || booking.status === bookingStatusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [bookings, bookingSearch, bookingStatusFilter]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('admin.bookings')}</h2>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <Input
            placeholder={t('admin.searchBookings')}
            value={bookingSearch}
            onChange={(e) => setBookingSearch(e.target.value)}
            icon={<Search size={18} />}
            className="flex-1 sm:w-64"
          />
          <Select
            value={bookingStatusFilter}
            onChange={(e) => setBookingStatusFilter(e.target.value as any)}
            options={[
              { value: 'All', label: t('admin.allStatus') },
              { value: 'Pending', label: t('admin.pending') },
              { value: 'Under Review', label: t('admin.underReview') },
              { value: 'Approved', label: t('admin.approved') },
              { value: 'Rejected', label: t('admin.rejected') },
              { value: 'Converted', label: t('admin.converted') },
            ]}
            className="w-full sm:w-48"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <Card className="p-4 sm:p-6 bg-gradient-to-br from-amber-50 to-white border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">{t('admin.pending')}</p>
            <Clock size={18} className="text-amber-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">{bookings.filter(b => b.status === 'Pending').length}</p>
        </Card>
        <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-white border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">{t('admin.underReview')}</p>
            <Eye size={18} className="text-blue-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">{bookings.filter(b => b.status === 'Under Review').length}</p>
        </Card>
        <Card className="p-4 sm:p-6 bg-gradient-to-br from-emerald-50 to-white border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">{t('admin.approved')}</p>
            <CheckCircle size={18} className="text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">{bookings.filter(b => b.status === 'Approved' || b.status === 'Converted').length}</p>
        </Card>
        <Card className="p-4 sm:p-6 bg-gradient-to-br from-red-50 to-white border-l-4 border-l-red-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-red-700 uppercase tracking-wider">{t('admin.rejected')}</p>
            <XCircle size={18} className="text-red-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">{bookings.filter(b => b.status === 'Rejected').length}</p>
        </Card>
      </div>

      {isLoadingBookings ? (
        <div className="space-y-4">
          <Skeleton variant="rounded" height={32} width="30%" />
          <SkeletonTable rows={8} />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-white to-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">{t('admin.noBookingRequestsFound')}</h3>
          <p className="text-gray-500 mb-4">
            {bookingSearch || bookingStatusFilter !== 'All' 
              ? t('admin.noBookingsMatch')
              : t('admin.bookingRequestsFromHomepage')}
          </p>
          {(bookingSearch || bookingStatusFilter !== 'All') && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                setBookingSearch('');
                setBookingStatusFilter('All');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Date Submitted</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Event Type</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Event Date</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Staff Needed</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBookings.map(booking => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {booking.submittedDate ? new Date(booking.submittedDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{booking.eventType || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{booking.contact?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{booking.contact?.email || ''}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {booking.date ? new Date(booking.date).toLocaleDateString() : 'N/A'}
                      {booking.time && <span className="text-xs text-gray-400 ml-1">{booking.time}</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{booking.location || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {((booking.staff?.servers || 0) + (booking.staff?.hosts || 0) + (booking.staff?.other || 0)) || 0}
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={booking.status === 'Approved' || booking.status === 'Converted' ? 'Approved' : booking.status === 'Rejected' ? 'Rejected' : 'Pending'} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => { setSelectedBooking(booking); setIsBookingModalOpen(true); }}
                        >
                          <Eye size={14} className="mr-1" /> View
                        </Button>
                        {booking.status === 'Pending' || booking.status === 'Under Review' ? (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => handleBookingDecision(booking.id, 'Approved')}
                              disabled={isLoadingBookings}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              <CheckCircle size={14} className="mr-1" /> Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleBookingDecision(booking.id, 'Rejected')}
                              disabled={isLoadingBookings}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <XCircle size={14} className="mr-1" /> Reject
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredBookings.map(booking => (
              <Card key={booking.id} className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge status={booking.status === 'Approved' || booking.status === 'Converted' ? 'Approved' : booking.status === 'Rejected' ? 'Rejected' : 'Pending'} />
                      <p className="font-bold text-gray-900 truncate">{booking.eventType || 'N/A'}</p>
                    </div>
                    <p className="text-xs text-gray-500">{booking.contact?.name || 'N/A'} • {booking.contact?.email || ''}</p>
                  </div>
                  <span className="text-xs font-mono text-gray-400 whitespace-nowrap">
                    {booking.date ? new Date(booking.date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                  <div>
                    <span className="font-semibold">Location:</span> {booking.location || 'N/A'}
                  </div>
                  <div>
                    <span className="font-semibold">Staff:</span> {((booking.staff?.servers || 0) + (booking.staff?.hosts || 0) + (booking.staff?.other || 0)) || 0}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => { setSelectedBooking(booking); setIsBookingModalOpen(true); }}
                    className="flex-1"
                  >
                    <Eye size={14} className="mr-1" /> View Details
                  </Button>
                  {booking.status === 'Pending' || booking.status === 'Under Review' ? (
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => handleBookingDecision(booking.id, 'Approved')}
                        disabled={isLoadingBookings}
                        className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                      >
                        <CheckCircle size={14} className="mr-1" /> Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleBookingDecision(booking.id, 'Rejected')}
                        disabled={isLoadingBookings}
                        className="border-red-300 text-red-600 hover:bg-red-50 flex-1"
                      >
                        <XCircle size={14} className="mr-1" /> Reject
                      </Button>
                    </>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
