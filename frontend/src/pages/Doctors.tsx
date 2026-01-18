import { useState, useEffect } from 'react';
import { Doctor } from '@/types';
import { doctorsApi } from '@/services/doctors';
import { DoctorCard } from '@/components/DoctorCard';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Fetch doctors and specializations
  useEffect(() => {
    fetchSpecializations();
    fetchDoctors();
  }, []);

  // Refetch doctors when filter changes
  useEffect(() => {
    fetchDoctors();
  }, [selectedSpecialization]);

  const fetchSpecializations = async () => {
    try {
      const data = await doctorsApi.getSpecializations();
      setSpecializations(data);
    } catch (error) {
      console.error('Error fetching specializations:', error);
    }
  };

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const data = await doctorsApi.getAll(selectedSpecialization || undefined);
      setDoctors(data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Errore nel caricamento dei dottori');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">I Nostri Dottori</h1>
          <p className="text-muted-foreground mt-2">
            Scopri il nostro team di specialisti
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={selectedSpecialization === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedSpecialization('')}
          >
            Tutti
          </Button>
          {specializations.map((spec) => (
            <Button
              key={spec}
              variant={selectedSpecialization === spec ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSpecialization(spec)}
            >
              {spec}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Caricamento...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nessun dottore trovato</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} showAvailabilityLink />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
