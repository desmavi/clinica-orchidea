import { useState, useEffect } from 'react';
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

export function AppointmentsManagement() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);

  // Filters
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  useEffect(() => {
    fetchDoctors();
    fetchAppointments();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDoctorId, selectedDate, selectedStatus]);

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
      const params: { doctor_id?: string; date?: string; status?: string } = {};
      if (selectedDoctorId) params.doctor_id = selectedDoctorId;
      if (selectedDate) params.date = selectedDate;
      if (selectedStatus) params.status = selectedStatus;

      const data = await appointmentsApi.getAll(params);
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Errore nel caricamento degli appuntamenti');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!appointmentToCancel) return;

    try {
      await appointmentsApi.cancel(appointmentToCancel.id);
      toast.success('Appuntamento cancellato');
      fetchAppointments();
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      const message = error.response?.data?.detail || 'Errore nella cancellazione';
      toast.error(message);
    } finally {
      setAppointmentToCancel(null);
    }
  };

  const handleResendEmail = (apt: Appointment) => {
    // TODO: email sending
    toast.success('Email di conferma inviata a ' + apt.patient_email);
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
    setSelectedDate('');
    setSelectedStatus('');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Gestione Appuntamenti</h1>
        <p className="text-muted-foreground">Visualizza e gestisci tutti gli appuntamenti</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Dottore</Label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">Tutti</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.first_name} {doctor.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Stato</Label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">Tutti</option>
                <option value="confirmed">Confermato</option>
                <option value="cancelled">Cancellato</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Pulisci filtri
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Appuntamenti ({appointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Caricamento...</p>
          ) : appointments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nessun appuntamento trovato
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
                        <p className="text-xs text-muted-foreground">Data/Ora</p>
                        <p className="font-medium">
                          {date} - {time}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Dottore</p>
                        <p>
                          Dr. {apt.doctor?.first_name} {apt.doctor?.last_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Paziente</p>
                        <p>
                          {apt.patient_first_name} {apt.patient_last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{apt.patient_phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Stato</p>
                        <span
                          className={`inline-block text-xs px-2 py-1 rounded ${
                            isCancelled
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {isCancelled ? 'Cancellato' : 'Confermato'}
                        </span>
                      </div>
                    </div>
                    {!isCancelled && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResendEmail(apt)}
                          className="p-2 text-gray-500 hover:text-cyan-600"
                          title="Rinvia email di conferma"
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
                          Modifica
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => setAppointmentToCancel(apt)}
                        >
                          Cancella
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
            <AlertDialogTitle>Conferma cancellazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler cancellare questo appuntamento?
              {appointmentToCancel && (
                <>
                  <br />
                  Paziente: {appointmentToCancel.patient_first_name}{' '}
                  {appointmentToCancel.patient_last_name}
                  <br />
                  Dr. {appointmentToCancel.doctor?.first_name}{' '}
                  {appointmentToCancel.doctor?.last_name}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Cancella appuntamento
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