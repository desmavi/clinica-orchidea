import { useState } from 'react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !phone || !email) {
      toast.error('Compila tutti i campi');
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
      toast.success('Appuntamento prenotato con successo!');
      onSuccess();
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      const message = error.response?.data?.detail || 'Errore nella prenotazione';
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
          <CardTitle>Prenota Appuntamento</CardTitle>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Dr. {doctor.first_name} {doctor.last_name} - {doctor.specialization}</p>
            <p>{formatDate(slot.start_time)}</p>
            <p className="font-medium text-foreground">
              Ore {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome *</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Mario"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Cognome *</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Rossi"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefono *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+39 333 1234567"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mario.rossi@email.com"
                required
              />
            </div>

            <p className="text-xs text-muted-foreground">
              I dati inseriti si riferiscono alla persona che effettuerà la visita
            </p>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {loading ? 'Prenotazione...' : 'Conferma'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}