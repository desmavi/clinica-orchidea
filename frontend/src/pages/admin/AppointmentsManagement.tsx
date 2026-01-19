import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Appointment, Doctor } from '@/types';
import { appointmentsApi } from '@/services/appointments';
import { doctorsApi } from '@/services/doctors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

type QuickDateFilter = 'oggi' | 'domani' | 'settimana' | 'custom' | '';

const getToday = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const getTomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const getWeekEnd = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
};

export function AppointmentsManagement() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Filters
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDateEnd, setSelectedDateEnd] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('confirmed');
  const [quickDateFilter, setQuickDateFilter] = useState<QuickDateFilter>('oggi');

  // Set default filter to today
  useEffect(() => {
    setSelectedDate(getToday());
    fetchDoctors();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDoctorId, selectedDate, selectedDateEnd, selectedStatus]);

  const handleQuickDateFilter = (filter: QuickDateFilter) => {
    setQuickDateFilter(filter);
    switch (filter) {
      case 'oggi':
        setSelectedDate(getToday());
        setSelectedDateEnd('');
        break;
      case 'domani':
        setSelectedDate(getTomorrow());
        setSelectedDateEnd('');
        break;
      case 'settimana':
        setSelectedDate(getToday());
        setSelectedDateEnd(getWeekEnd());
        break;
      case '':
        setSelectedDate('');
        setSelectedDateEnd('');
        break;
      default:
        break;
    }
  };

  const fetchDoctors = async () => {
    try {
      const data = await doctorsApi.getAll();
      setDoctors(data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params: { doctor_id?: string; date?: string; date_end?: string; status?: string } = {};
      if (selectedDoctorId) params.doctor_id = selectedDoctorId;
      if (selectedDate) params.date = selectedDate;
      if (selectedDateEnd) params.date_end = selectedDateEnd;
      if (selectedStatus) params.status = selectedStatus;

      const data = await appointmentsApi.getAll(params);
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
    const datePart = dateString.split('T')[0];
    const timePart = dateString.split('T')[1]?.substring(0, 5) || '';
    const date = new Date(datePart + 'T00:00:00');
    return {
      date: date.toLocaleDateString('it-IT', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }),
      time: timePart,
    };
  };

  const clearFilters = () => {
    setSelectedDoctorId('');
    setQuickDateFilter('');
    setSelectedDate('');
    setSelectedDateEnd('');
    setSelectedStatus('');
  };

  const handlePrint = () => {
    window.print();
  };

  const getFilterLabel = () => {
    const parts: string[] = [];
    if (quickDateFilter === 'oggi') parts.push(t('appointmentsAdmin.today'));
    else if (quickDateFilter === 'domani') parts.push(t('appointmentsAdmin.tomorrow'));
    else if (quickDateFilter === 'settimana') parts.push(t('appointmentsAdmin.nextWeek'));
    else if (selectedDate) {
      const d = new Date(selectedDate + 'T00:00:00');
      parts.push(d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }));
    }

    if (selectedDoctorId) {
      const doc = doctors.find(d => d.id === selectedDoctorId);
      if (doc) parts.push(`${t('doctors.drPrefix')} ${doc.first_name} ${doc.last_name}`);
    }

    return parts.length > 0 ? parts.join(' - ') : t('appointmentsAdmin.allAppointments');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 print:hidden">
        <h1 className="text-2xl font-bold">{t('appointmentsAdmin.title')}</h1>
        <p className="text-muted-foreground">{t('appointmentsAdmin.subtitle')}</p>
      </div>

      <Card className="mb-6 print:hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t('appointmentsAdmin.filters')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">{t('appointmentsAdmin.period')}</Label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleQuickDateFilter('oggi')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  quickDateFilter === 'oggi'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('appointmentsAdmin.today')}
              </button>
              <button
                onClick={() => handleQuickDateFilter('domani')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  quickDateFilter === 'domani'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('appointmentsAdmin.tomorrow')}
              </button>
              <button
                onClick={() => handleQuickDateFilter('settimana')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  quickDateFilter === 'settimana'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('appointmentsAdmin.nextWeek')}
              </button>
              <button
                onClick={() => handleQuickDateFilter('')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  quickDateFilter === ''
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('common.all')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="space-y-2">
              <Label>{t('appointmentsAdmin.specificDate')}</Label>
              <Input
                type="date"
                value={quickDateFilter === 'custom' ? selectedDate : ''}
                onChange={(e) => {
                  setQuickDateFilter('custom');
                  setSelectedDate(e.target.value);
                  setSelectedDateEnd('');
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('common.doctor')}</Label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">{t('appointmentsAdmin.allDoctors')}</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {t('doctors.drPrefix')} {doctor.first_name} {doctor.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>{t('common.status')}</Label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">{t('appointmentsAdmin.allStatuses')}</option>
                <option value="confirmed">{t('appointments.confirmed')}</option>
                <option value="cancelled">{t('appointments.cancelled')}</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                {t('common.clearFilters')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card ref={printRef}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {t('appointmentsAdmin.appointmentsCount', { count: appointments.length })}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{getFilterLabel()}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="print:hidden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect width="12" height="8" x="6" y="14"/>
            </svg>
            {t('common.print')}
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">{t('common.loading')}</p>
          ) : appointments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('appointmentsAdmin.noAppointments')}
            </p>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => {
                const { date, time } = apt.slot
                  ? formatDateTime(apt.slot.start_time)
                  : { date: '-', time: '-' };

                const isCancelled = apt.status === 'cancelled';

                return (
                  <div
                    key={apt.id}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg border ${
                      isCancelled ? 'bg-gray-50 opacity-60' : 'bg-white'
                    }`}
                  >
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">{t('appointmentsAdmin.dateTime')}</p>
                        <p className="font-medium">
                          {date} - {time}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t('common.doctor')}</p>
                        <p>
                          {t('doctors.drPrefix')} {apt.doctor?.first_name} {apt.doctor?.last_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t('common.patient')}</p>
                        <p>
                          {apt.patient_first_name} {apt.patient_last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{apt.patient_phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t('common.status')}</p>
                        <span
                          className={`inline-block text-xs px-2 py-1 rounded ${
                            isCancelled
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {isCancelled ? t('appointments.cancelled') : t('appointments.confirmed')}
                        </span>
                      </div>
                    </div>
                    {!isCancelled && (
                      <div className="flex gap-2 print:hidden">
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
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!appointmentToCancel} onOpenChange={() => setAppointmentToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.confirmCancel')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.cancelAppointment')}
              {appointmentToCancel && (
                <>
                  <br />
                  {t('common.patient')}: {appointmentToCancel.patient_first_name}{' '}
                  {appointmentToCancel.patient_last_name}
                  <br />
                  {t('doctors.drPrefix')} {appointmentToCancel.doctor?.first_name}{' '}
                  {appointmentToCancel.doctor?.last_name}
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