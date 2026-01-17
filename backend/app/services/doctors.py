from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from supabase import Client
from app.models import DoctorCreate, DoctorUpdate, DoctorResponse


class DoctorService:

    def __init__(self, admin_client: Client):
        # Uses service_role key to bypass RLS
        self.client = admin_client

    def get_all(self, specialization: Optional[str] = None) -> List[DoctorResponse]:
        try:
            query = self.client.table("doctors").select("*")

            if specialization:
                query = query.eq("specialization", specialization)

            result = query.order("last_name").execute()

            return [DoctorResponse(**doctor) for doctor in result.data]

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Errore nel recupero dei dottori: {str(e)}"
            )

    def get_by_id(self, doctor_id: UUID) -> DoctorResponse:
        try:
            result = self.client.table("doctors").select("*").eq("id", str(doctor_id)).execute()

            if not result.data or len(result.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Dottore non trovato"
                )

            return DoctorResponse(**result.data[0])

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Errore nel recupero del dottore: {str(e)}"
            )

    def create(self, data: DoctorCreate) -> DoctorResponse:
        try:
            doctor_data = {
                "first_name": data.first_name,
                "last_name": data.last_name,
                "specialization": data.specialization,
                "profile_photo_url": data.profile_photo_url
            }

            result = self.client.table("doctors").insert(doctor_data).execute()

            if not result.data or len(result.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Errore nella creazione del dottore"
                )

            return DoctorResponse(**result.data[0])

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Errore nella creazione del dottore: {str(e)}"
            )

    def update(self, doctor_id: UUID, data: DoctorUpdate) -> DoctorResponse:
        try:
            # Check if doctor exists
            self.get_by_id(doctor_id)

            # Build update dict with only provided fields
            update_data = {}
            if data.first_name is not None:
                update_data["first_name"] = data.first_name
            if data.last_name is not None:
                update_data["last_name"] = data.last_name
            if data.specialization is not None:
                update_data["specialization"] = data.specialization
            if data.profile_photo_url is not None:
                # Empty string means remove photo (set to NULL)
                update_data["profile_photo_url"] = data.profile_photo_url or None

            if not update_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Nessun dato da aggiornare"
                )

            result = self.client.table("doctors").update(update_data).eq("id", str(doctor_id)).execute()

            if not result.data or len(result.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Errore nell'aggiornamento del dottore"
                )

            return DoctorResponse(**result.data[0])

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Errore nell'aggiornamento del dottore: {str(e)}"
            )

    def delete(self, doctor_id: UUID) -> None:
        try:
            # Check if doctor exists
            self.get_by_id(doctor_id)

            self.client.table("doctors").delete().eq("id", str(doctor_id)).execute()

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Errore nell'eliminazione del dottore: {str(e)}"
            )

    def get_specializations(self) -> List[str]:
        try:
            result = self.client.table("doctors").select("specialization").execute()

            specializations = list(set(d["specialization"] for d in result.data))
            return sorted(specializations)

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Errore nel recupero delle specializzazioni: {str(e)}"
            )