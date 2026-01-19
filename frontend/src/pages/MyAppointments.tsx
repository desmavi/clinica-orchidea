import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Appointment } from '@/types';
import { appointmentsApi } from '@/services/appointments';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EditAppointmentModal } from '@/components/EditAppointmentModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import toast from 'react-hot-toast';

export function MyAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const data = await appointmentsApi.getMyAppointments();
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error(t('errors.loadingAppointments'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!appointmentToCancel) return;

    try {
      await appointmentsApi.cancel(appointmentToCancel.id);
      toast.success(t('appointments.appointmentCancelled'));
      fetchAppointments();
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      const message = error.response?.data?.detail || t('errors.cancelling');
      toast.error(message);
    } finally {
      setAppointmentToCancel(null);
    }
  };

  const handleResendEmail = async (apt: Appointment) => {
    try {
      await appointmentsApi.resendEmail(apt.id);
      toast.success(t('appointments.emailSentTo') + ' ' + apt.patient_email);
    } catch (error: any) {
      console.error('Error sending email:', error);
      const message = error.response?.data?.detail || t('errors.sendingEmail');
      toast.error(message);
    }
  };

  const handleEditSuccess = () => {
    setAppointmentToEdit(null);
    fetchAppointments();
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      time: dateString.split('T')[1]?.substring(0, 5) || '',
    };
  };

  const isFutureAppointment = (slot?: { start_time: string }) => {
    if (!slot) return false;
    const slotTime = new Date(slot.start_time);
    return slotTime > new Date();
  };

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === 'confirmed' && isFutureAppointment(apt.slot)
  );

  const pastAppointments = appointments.filter(
    (apt) => apt.status === 'cancelled' || !isFutureAppointment(apt.slot)
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-center text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('appointments.title')}</h1>
        <p className="text-muted-foreground">{t('appointments.subtitle')}</p>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              {t('appointments.noAppointments')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {upcomingAppointments.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">{t('appointments.upcoming')}</h2>
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => {
                  const { date, time } = apt.slot
                    ? formatDateTime(apt.slot.start_time)
                    : { date: '-', time: '-' };

                  return (
                    <Card key={apt.id}>
                      <CardContent className="py-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <p className="font-medium">
                              {t('doctors.drPrefix')} {apt.doctor?.first_name} {apt.doctor?.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {apt.doctor?.specialization}
                            </p>
                            <p className="text-sm mt-1">
                              {date} {t('appointments.atTime')} <span className="font-medium">{time}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {t('appointments.patientLabel')} {apt.patient_first_name} {apt.patient_last_name}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleResendEmail(apt)}
                              className="p-2 text-gray-500 hover:text-cyan-600"
                              title={t('appointments.resendEmail')}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="20" height="16" x="2" y="4" rx="2"/>
                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                              </svg>
                            </button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAppointmentToEdit(apt)}
                            >
                              {t('common.edit')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => setAppointmentToCancel(apt)}
                            >
                              {t('common.cancel')}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {pastAppointments.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">{t('appointments.history')}</h2>
              <div className="space-y-3">
                {pastAppointments.map((apt) => {
                  const { date, time } = apt.slot
                    ? formatDateTime(apt.slot.start_time)
                    : { date: '-', time: '-' };

                  return (
                    <Card key={apt.id} className="opacity-60">
                      <CardContent className="py-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <p className="font-medium">
                              {t('doctors.drPrefix')} {apt.doctor?.first_name} {apt.doctor?.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {apt.doctor?.specialization}
                            </p>
                            <p className="text-sm mt-1">
                              {date} {t('appointments.atTime')} {time}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {t('appointments.patientLabel')} {apt.patient_first_name} {apt.patient_last_name}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              apt.status === 'cancelled'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {apt.status === 'cancelled' ? t('appointments.cancelled') : t('appointments.completed')}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={!!appointmentToCancel} onOpenChange={() => setAppointmentToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.confirmCancel')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.cancelAppointment')}
              {appointmentToCancel?.doctor && (
                <>
                  <br />
                  {t('doctors.drPrefix')} {appointmentToCancel.doctor.first_name} {appointmentToCancel.doctor.last_name}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('appointments.cancelAppointment')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {appointmentToEdit && (
        <EditAppointmentModal
          appointment={appointmentToEdit}
          onClose={() => setAppointmentToEdit(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}