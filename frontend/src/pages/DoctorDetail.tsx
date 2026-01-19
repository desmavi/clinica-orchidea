import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Doctor, AvailabilitySlot } from '@/types';
import { doctorsApi } from '@/services/doctors';
import { availabilityApi } from '@/services/availability';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookingModal } from '@/components/BookingModal';
import toast from 'react-hot-toast';

export function DoctorDetail() {
  const { id } = useParams<{ id: string }>();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (id) {
      fetchDoctor();
      fetchAvailableDates();
    }
  }, [id]);

  useEffect(() => {
    if (selectedDate && id) {
      fetchSlots();
    } else {
      setSlots([]);
    }
  }, [selectedDate, id]);

  const fetchDoctor = async () => {
    try {
      const data = await doctorsApi.getById(id!);
      setDoctor(data);
    } catch (error) {
      console.error('Error fetching doctor:', error);
      toast.error(t('errors.loadingDoctor'));
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDates = async () => {
    try {
      const dates = await availabilityApi.getAvailableDates(id!);
      setAvailableDates(dates);
      // Auto-select first available date
      if (dates.length > 0) {
        setSelectedDate(dates[0]);
      }
    } catch (error) {
      console.error('Error fetching available dates:', error);
    }
  };

  const fetchSlots = async () => {
    setLoadingSlots(true);
    try {
      const data = await availabilityApi.getByDoctor(id!, selectedDate, true);
      setSlots(data);
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast.error(t('errors.loadingSlots'));
    } finally {
      setLoadingSlots(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (dateString: string) => {
    // Extract HH:MM directly from ISO string to avoid timezone conversion
    const timePart = dateString.split('T')[1];
    return timePart ? timePart.substring(0, 5) : '';
  };

  const handleBookingSuccess = () => {
    setSelectedSlot(null);
    fetchSlots();
    fetchAvailableDates();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-center text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-center text-muted-foreground">{t('doctors.notFound')}</p>
        <div className="text-center mt-4">
          <Link to="/doctors">
            <Button variant="outline">{t('doctors.backToList')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const initials = `${doctor.first_name[0]}${doctor.last_name[0]}`.toUpperCase();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Link to="/doctors">
          <Button variant="ghost" size="sm">
            ← {t('doctors.backToList')}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              {doctor.profile_photo_url ? (
                <img
                  src={doctor.profile_photo_url}
                  alt={`${doctor.first_name} ${doctor.last_name}`}
                  className="w-32 h-32 rounded-full object-cover mb-4"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-3xl font-semibold text-primary">{initials}</span>
                </div>
              )}
              <h1 className="text-2xl font-bold">
                {t('doctors.drPrefix')} {doctor.first_name} {doctor.last_name}
              </h1>
              <p className="text-muted-foreground mt-1">{doctor.specialization}</p>
            </div>
          </CardContent>
        </Card>

        {/* Availability */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('doctorDetail.availability')}</CardTitle>
            <p className="text-xs text-muted-foreground">{t('doctorDetail.timezoneHint')}</p>
          </CardHeader>
          <CardContent>
            {availableDates.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {t('doctorDetail.noAvailability')}
              </p>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-3">{t('doctorDetail.selectDate')}</p>
                  <div className="flex flex-wrap gap-2">
                    {availableDates.map((date) => (
                      <Button
                        key={date}
                        variant={selectedDate === date ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedDate(date)}
                        className={selectedDate === date ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
                      >
                        {formatDate(date)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('doctorDetail.availableSlots', { date: formatDate(selectedDate) })}
                  </p>
                  {loadingSlots ? (
                    <p className="text-muted-foreground text-center py-4">{t('common.loading')}</p>
                  ) : slots.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      {t('doctorDetail.noSlots')}
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {slots.map((slot) => (
                        <Button
                          key={slot.id}
                          variant="outline"
                          size="sm"
                          className="text-center hover:bg-cyan-50 hover:border-cyan-500"
                          onClick={() => setSelectedSlot(slot)}
                        >
                          {formatTime(slot.start_time)}
                        </Button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-4">
                    {t('doctorDetail.clickToBook')}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedSlot && doctor && (
        <BookingModal
          slot={selectedSlot}
          doctor={doctor}
          onClose={() => setSelectedSlot(null)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}