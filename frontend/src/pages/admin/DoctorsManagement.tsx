import { useState, useEffect } from 'react';
import { Doctor, DoctorCreate } from '@/types';
import { doctorsApi } from '@/services/doctors';
import { DoctorCard } from '@/components/DoctorCard';
import { DoctorForm } from '@/components/DoctorForm';
import { Button } from '@/components/ui/button';
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

export function DoctorsManagement() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [deletingDoctor, setDeletingDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const data = await doctorsApi.getAll();
      setDoctors(data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Errore nel caricamento dei dottori');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingDoctor(null);
    setShowForm(true);
  };

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setShowForm(true);
  };

  const handleDeleteClick = (doctor: Doctor) => {
    setDeletingDoctor(doctor);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDoctor) return;

    try {
      await doctorsApi.delete(deletingDoctor.id);
      toast.success('Dottore eliminato');
      fetchDoctors();
    } catch (error) {
      console.error('Error deleting doctor:', error);
      toast.error('Errore nell\'eliminazione del dottore');
    } finally {
      setDeletingDoctor(null);
    }
  };

  const handleSubmit = async (data: DoctorCreate) => {
    setSaving(true);
    try {
      if (editingDoctor) {
        await doctorsApi.update(editingDoctor.id, data);
        toast.success('Dottore aggiornato');
      } else {
        await doctorsApi.create(data);
        toast.success('Dottore creato');
      }
      setShowForm(false);
      setEditingDoctor(null);
      fetchDoctors();
    } catch (error) {
      console.error('Error saving doctor:', error);
      toast.error('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingDoctor(null);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestione Dottori</h1>
          <p className="text-muted-foreground">Aggiungi, modifica o elimina i dottori</p>
        </div>
        {!showForm && (
          <Button onClick={handleCreate} className="bg-cyan-600 hover:bg-cyan-700 text-white">
            Nuovo Dottore
          </Button>
        )}
      </div>

      {showForm && (
        <div className="mb-6">
          <DoctorForm
            doctor={editingDoctor}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={saving}
          />
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nessun dottore presente</p>
          <Button className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white" onClick={handleCreate}>
            Aggiungi il primo dottore
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              showActions
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      <AlertDialog open={!!deletingDoctor} onOpenChange={() => setDeletingDoctor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare{' '}
              <strong>Dr. {deletingDoctor?.first_name} {deletingDoctor?.last_name}</strong>?
              <br />
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
