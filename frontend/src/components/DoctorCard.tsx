import { Link } from 'react-router-dom';
import { Doctor } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DoctorCardProps {
  doctor: Doctor;
  onEdit?: (doctor: Doctor) => void;
  onDelete?: (doctor: Doctor) => void;
  showActions?: boolean;
  showAvailabilityLink?: boolean;
}

export function DoctorCard({
  doctor,
  onEdit,
  onDelete,
  showActions = false,
  showAvailabilityLink = false
}: DoctorCardProps) {
  const initials = `${doctor.first_name[0]}${doctor.last_name[0]}`.toUpperCase();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4">
          {doctor.profile_photo_url ? (
            <img
              src={doctor.profile_photo_url}
              alt={`${doctor.first_name} ${doctor.last_name}`}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-semibold text-primary">{initials}</span>
            </div>
          )}

          <div className="flex-1">
            <h3 className="text-lg font-semibold">
              Dr. {doctor.first_name} {doctor.last_name}
            </h3>
            <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
          </div>
        </div>
      </CardHeader>

      {showActions && (onEdit || onDelete) && (
        <CardContent className="pt-0">
          <div className="flex gap-2 justify-end">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(doctor)}>
                Modifica
              </Button>
            )}
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={() => onDelete(doctor)}>
                Elimina
              </Button>
            )}
          </div>
        </CardContent>
      )}

      {showAvailabilityLink && (
        <CardContent className="pt-0">
          <Link to={`/doctors/${doctor.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white border-0"
            >
              Vedi disponibilità
            </Button>
          </Link>
        </CardContent>
      )}
    </Card>
  );
}
