import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AvailabilitySlot, Doctor } from '@/types';
import { appointmentsApi } from '@/services/appointments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import toast from 'react-hot-toast';

interface BookingModalProps {
  slot: AvailabilitySlot;
  doctor: Doctor;
  onClose: () => void;
  onSuccess: () => void;
}

export function BookingModal({ slot, doctor, onClose, onSuccess }: BookingModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const formatTime = (dateString: string) => {
    const timePart = dateString.split('T')[1];
    return timePart ? timePart.substring(0, 5) : '';
  };

  const formatDate = (dateString: string) => {
    const datePart = dateString.split('T')[0];
    const date = new Date(datePart + 'T00:00:00');
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^\d+]/g, '');
    setPhone(cleaned);
  };

  const getPhoneDigits = (value: string) => value.replace(/\D/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !phone || !email) {
      toast.error(t('errors.fillAllFields'));
      return;
    }

    if (getPhoneDigits(phone).length < 10) {
      toast.error(t('errors.phoneMinDigits'));
      return;
    }

    setLoading(true);
    try {
      await appointmentsApi.create({
        slot_id: slot.id,
        patient_first_name: firstName,
        patient_last_name: lastName,
        patient_phone: phone,
        patient_email: email,
      });
      toast.success(t('booking.success'));
      onSuccess();
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      const detail = error.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((d: any) => d.msg).join(', ')
        : detail || t('errors.booking');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />
      <Card className="relative z-10 w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>{t('booking.title')}</CardTitle>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>{t('doctors.drPrefix')} {doctor.first_name} {doctor.last_name} - {doctor.specialization}</p>
            <p>{formatDate(slot.start_time)}</p>
            <p className="font-medium text-foreground">
              {t('booking.hours')} {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('common.firstName')} {t('common.required')}</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t('placeholders.firstName')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('common.lastName')} {t('common.required')}</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t('placeholders.lastName')}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('common.phone')} {t('common.required')}</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder={t('placeholders.phone')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('common.email')} {t('common.required')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('placeholders.email')}
                required
              />
            </div>

            <p className="text-xs text-muted-foreground">
              {t('booking.patientDataHint')}
            </p>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {loading ? t('booking.submitting') : t('common.confirm')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}