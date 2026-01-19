import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Doctor, DoctorCreate } from '@/types';
import { storageService } from '@/services/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import toast from 'react-hot-toast';

interface DoctorFormProps {
  doctor?: Doctor | null;
  onSubmit: (data: DoctorCreate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function DoctorForm({ doctor, onSubmit, onCancel, loading = false }: DoctorFormProps) {
  const [formData, setFormData] = useState<DoctorCreate>({
    first_name: '',
    last_name: '',
    specialization: '',
    profile_photo_url: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const isEditing = !!doctor;

  // Populate form when editing
  useEffect(() => {
    if (doctor) {
      setFormData({
        first_name: doctor.first_name,
        last_name: doctor.last_name,
        specialization: doctor.specialization,
        profile_photo_url: doctor.profile_photo_url || '',
      });
      setPreviewUrl(doctor.profile_photo_url || null);
    }
  }, [doctor]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t('errors.unsupportedFileType'));
      return;
    }

    // Validate file size (1MB)
    if (file.size > 1 * 1024 * 1024) {
      toast.error(t('errors.fileTooLarge'));
      return;
    }

    setSelectedFile(file);
    setPhotoRemoved(false);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setPhotoRemoved(true);
    setFormData((prev) => ({ ...prev, profile_photo_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let photoUrl = formData.profile_photo_url;

    // Upload new photo if selected
    if (selectedFile) {
      setUploading(true);
      try {
        const result = await storageService.uploadDoctorPhoto(
          selectedFile,
          doctor?.id
        );
        photoUrl = result.url;
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(t('errors.uploadingPhoto'));
        setUploading(false);
        return;
      }
      setUploading(false);
    } else if (photoRemoved) {
      // Send empty string to remove photo (backend converts to NULL)
      photoUrl = '';
    }

    await onSubmit({
      ...formData,
      profile_photo_url: photoUrl,
    });
  };

  const isLoading = loading || uploading;

  const getSubmitButtonText = () => {
    if (uploading) return t('doctorForm.uploadingPhoto');
    if (loading) return t('doctorForm.saving');
    if (isEditing) return t('doctorForm.saveChanges');
    return t('doctorForm.createDoctor');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? t('doctorForm.titleEdit') : t('doctorForm.titleNew')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">{t('common.firstName')}</Label>
              <Input
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                placeholder={t('placeholders.firstName')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">{t('common.lastName')}</Label>
              <Input
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                placeholder={t('placeholders.lastName')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialization">{t('doctorForm.specialization')}</Label>
            <Input
              id="specialization"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              required
              placeholder={t('placeholders.specialization')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('doctorForm.profilePhoto')}</Label>
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-xs text-center px-2">
                    {t('doctorForm.noPhoto')}
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="photo-upload"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {previewUrl ? t('doctorForm.changePhoto') : t('doctorForm.uploadPhoto')}
                  </Button>
                  {previewUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemovePhoto}
                      className="text-red-600 hover:text-red-700"
                    >
                      {t('doctorForm.removePhoto')}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('doctorForm.photoHint')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-cyan-600 hover:bg-cyan-700 text-white">
              {getSubmitButtonText()}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}