import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Appointment } from '@/types';
import { appointmentsApi } from '@/services/appointments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import toast from 'react-hot-toast';

interface EditAppointmentModalProps {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditAppointmentModal({ appointment, onClose, onSuccess }: EditAppointmentModalProps) {
  const [firstName, setFirstName] = useState(appointment.patient_first_name);
  const [lastName, setLastName] = useState(appointment.patient_last_name);
  const [phone, setPhone] = useState(appointment.patient_phone);
  const [email, setEmail] = useState(appointment.patient_email);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

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
      await appointmentsApi.update(appointment.id, {
        patient_first_name: firstName,
        patient_last_name: lastName,
        patient_phone: phone,
        patient_email: email,
      });
      toast.success(t('appointments.appointmentUpdated'));
      onSuccess();
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      const detail = error.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((d: any) => d.msg).join(', ')
        : detail || t('errors.updating');
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
          <CardTitle>{t('editAppointment.title')}</CardTitle>
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
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('common.lastName')} {t('common.required')}</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
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
                required
              />
            </div>

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
                {loading ? t('doctorForm.saving') : t('common.save')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}