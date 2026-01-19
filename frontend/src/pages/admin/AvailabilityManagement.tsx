import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Doctor, AvailabilitySlot } from '@/types';
import { doctorsApi } from '@/services/doctors';
import { availabilityApi } from '@/services/availability';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export function AvailabilityManagement() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('13:00');
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<AvailabilitySlot | null>(null);
  const { t } = useTranslation();

  // Set minimum date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctorId && date) {
      fetchSlots();
    } else {
      setSlots([]);
    }
  }, [selectedDoctorId, date]);

  const fetchDoctors = async () => {
    try {
      const data = await doctorsApi.getAll();
      setDoctors(data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error(t('errors.loadingDoctors'));
    }
  };

  const fetchSlots = async () => {
    if (!selectedDoctorId || !date) return;

    setLoading(true);
    try {
      const data = await availabilityApi.getByDoctor(selectedDoctorId, date, false);
      setSlots(data);
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast.error(t('errors.loadingSlots'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlots = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDoctorId || !date || !startTime || !endTime) {
      toast.error(t('errors.fillRequiredFields'));
      return;
    }

    setCreating(true);
    try {
      const result = await availabilityApi.createSlots({
        doctor_id: selectedDoctorId,
        date,
        start_time: startTime,
        end_time: endTime,
      });
      toast.success(t('availabilityAdmin.slotsCreated', { count: result.slots_created }));
      fetchSlots();
    } catch (error: any) {
      console.error('Error creating slots:', error);
      const message = error.response?.data?.detail || t('errors.creatingSlots');
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (slot: AvailabilitySlot) => {
    try {
      await availabilityApi.toggleAvailability(slot.id, !slot.is_available);
      toast.success(slot.is_available ? t('availabilityAdmin.slotDisabled') : t('availabilityAdmin.slotEnabled'));
      fetchSlots();
    } catch (error: any) {
      console.error('Error toggling slot:', error);
      const message = error.response?.data?.detail || t('errors.updatingSlot');
      toast.error(message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!slotToDelete) return;

    try {
      await availabilityApi.deleteSlot(slotToDelete.id);
      toast.success(t('availabilityAdmin.slotDeleted'));
      fetchSlots();
    } catch (error: any) {
      console.error('Error deleting slot:', error);
      const message = error.response?.data?.detail || t('errors.deletingSlot');
      toast.error(message);
    } finally {
      setSlotToDelete(null);
    }
  };

  const formatTime = (dateString: string) => {
    // Extract HH:MM directly from ISO string to avoid timezone conversion, since it's a local italian clinc
    const timePart = dateString.split('T')[1];
    return timePart ? timePart.substring(0, 5) : '';
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('availabilityAdmin.title')}</h1>
        <p className="text-muted-foreground">{t('availabilityAdmin.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('availabilityAdmin.createSlots')}</CardTitle>
            <p className="text-xs text-muted-foreground">{t('availabilityAdmin.timezoneHint')}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSlots} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="doctor">{t('common.doctor')}</Label>
                <select
                  id="doctor"
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  required
                >
                  <option value="">{t('availabilityAdmin.selectDoctor')}</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {t('doctors.drPrefix')} {doctor.first_name} {doctor.last_name} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">{t('common.date')}</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={minDate}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">{t('availabilityAdmin.startTime')}</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">{t('availabilityAdmin.endTime')}</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={creating}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {creating ? t('availabilityAdmin.creating') : t('availabilityAdmin.createSlotsButton')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {t('availabilityAdmin.existingSlots')}
              {date && ` - ${new Date(date).toLocaleDateString('it-IT')}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDoctorId || !date ? (
              <p className="text-muted-foreground text-center py-8">
                {t('availabilityAdmin.selectDoctorAndDate')}
              </p>
            ) : loading ? (
              <p className="text-muted-foreground text-center py-8">{t('common.loading')}</p>
            ) : slots.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {t('availabilityAdmin.noSlotsForDate')}
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      slot.is_available
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          slot.is_available ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                      <span className="font-medium">
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggle(slot)}
                      >
                        {slot.is_available ? t('availabilityAdmin.disable') : t('availabilityAdmin.enable')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSlotToDelete(slot)}
                        className="text-red-600 hover:text-red-700"
                      >
                        {t('common.delete')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!slotToDelete} onOpenChange={() => setSlotToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.deleteSlot')}{' '}
              {slotToDelete && `${formatTime(slotToDelete.start_time)} - ${formatTime(slotToDelete.end_time)}`}?
              {' '}{t('dialogs.irreversibleSlot')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}