from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import HTTPException, status
from supabase import Client
from app.models import (
    AppointmentCreate,
    AppointmentManualCreate,
    AppointmentUpdate,
    AppointmentResponse,
    DoctorResponse,
    AvailabilitySlotResponse
)


class AppointmentService:

    def __init__(self, admin_client: Client):
        self.client = admin_client

    def create(
        self,
        data: AppointmentCreate,
        user_id: UUID
    ) -> AppointmentResponse:

        try:
            # Check slot exists and is available
            slot_result = self.client.table("availability_slots") \
                .select("*, doctors(*)") \
                .eq("id", str(data.slot_id)) \
                .execute()

            if not slot_result.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Slot non trovato"
                )

            slot = slot_result.data[0]

            if not slot["is_available"]:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Slot non disponibile"
                )

            # Check slot is in the future
            slot_time = datetime.fromisoformat(slot["start_time"])
            if slot_time <= datetime.now():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Non puoi prenotare slot nel passato"
                )

            # Create appointment data
            appointment_data = {
                "slot_id": str(data.slot_id),
                "doctor_id": slot["doctor_id"],
                "user_id": str(user_id),
                "patient_first_name": data.patient_first_name,
                "patient_last_name": data.patient_last_name,
                "patient_phone": data.patient_phone,
                "patient_email": data.patient_email,
                "status": "confirmed"
            }

            result = self.client.table("appointments").insert(appointment_data).execute()

            if not result.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Errore nella creazione dell'appuntamento"
                )

            # Mark slot as unavailable
            self.client.table("availability_slots") \
                .update({"is_available": False}) \
                .eq("id", str(data.slot_id)) \
                .execute()

            return self._build_response(result.data[0], slot, slot.get("doctors"))

        except HTTPException:
            raise
        except Exception as e:
            # Catch unique constraint violation (PostgreSQL code 23505)
            if "duplicate key" in str(e) or "23505" in str(e):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Slot non più disponibile"
                )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Errore nella creazione dell'appuntamento: {str(e)}"
            )

    def create_manual(
        self,
        data: AppointmentManualCreate
    ) -> AppointmentResponse:
        """
        Admin creates appointment manually ( phone/in person booking ) without user_id requirement.
        """
        try:
            # Check slot exists and is available
            slot_result = self.client.table("availability_slots") \
                .select("*, doctors(*)") \
                .eq("id", str(data.slot_id)) \
                .execute()

            if not slot_result.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Slot non trovato"
                )

            slot = slot_result.data[0]

            if not slot["is_available"]:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Slot non più disponibile"
                )

            # Create appointment
            appointment_data = {
                "slot_id": str(data.slot_id),
                "doctor_id": slot["doctor_id"],
                "patient_id": str(data.patient_id) if data.patient_id else None,
                "patient_first_name": data.patient_first_name,
                "patient_last_name": data.patient_last_name,
                "patient_phone": data.patient_phone,
                "patient_email": data.patient_email,
                "status": "confirmed"
            }

            result = self.client.table("appointments").insert(appointment_data).execute()

            if not result.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Errore nella creazione dell'appuntamento"
                )

            # Mark slot as unavailable
            self.client.table("availability_slots") \
                .update({"is_available": False}) \
                .eq("id", str(data.slot_id)) \
                .execute()

            return self._build_response(result.data[0], slot, slot.get("doctors"))

        except HTTPException:
            raise
        except Exception as e:
            # Catch unique constraint violation (PostgreSQL code 23505)
            if "duplicate key" in str(e) or "23505" in str(e):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Slot non più disponibile"
                )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Errore nella creazione dell'appuntamento: {str(e)}"
            )

    def get_my_appointments(self, user_id: UUID) -> List[AppointmentResponse]:
        """User get all their appointments"""
        try:
            result = self.client.table("appointments") \
                .select("*, availability_slots(*), doctors(*)") \
                .eq("user_id", str(user_id)) \
                .order("created_at", desc=True) \
                .execute()

            return [
                self._build_response(
                    apt,
                    apt.get("availability_slots"),
                    apt.get("doctors")
                )
                for apt in result.data
            ]

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Errore nel recupero degli appuntamenti: {str(e)}"
            )

    def get_by_id(
        self,
        appointment_id: UUID,
        user_id: UUID,
        is_admin: bool
    ) -> AppointmentResponse:
        """Get a single appointment by id. Patient can only get theirs, admin can get any."""
        try:
            result = self.client.table("appointments") \
                .select("*, availability_slots(*), doctors(*)") \
                .eq("id", str(appointment_id)) \
                .execute()

            if not result.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Appuntamento non trovato"
                )

            appointment = result.data[0]

            if not is_admin and appointment.get("user_id") != str(user_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Non puoi accedere ad appuntamenti di altri utenti"
                )

            return self._build_response(
                appointment,
                appointment.get("availability_slots"),
                appointment.get("doctors")
            )

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Errore nel recupero dell'appuntamento: {str(e)}"
            )

    def get_all(
        self,
        doctor_id: Optional[UUID] = None,
        date: Optional[str] = None,
        date_end: Optional[str] = None,
        status_filter: Optional[str] = None
    ) -> List[AppointmentResponse]:
        """Get all appointments (admin only)."""
        try:
            query = self.client.table("appointments") \
                .select("*, availability_slots(*), doctors(*)")

            if doctor_id:
                query = query.eq("doctor_id", str(doctor_id))

            if status_filter:
                query = query.eq("status", status_filter)

            result = query.order("created_at", desc=True).execute()

            appointments = []
            for apt in result.data:
                slot = apt.get("availability_slots")

                # Filter by date or date range
                if slot:
                    slot_date = slot["start_time"][:10]
                    if date and date_end:
                        if slot_date < date or slot_date > date_end:
                            continue
                    elif date:
                        if slot_date != date:
                            continue

                appointments.append(
                    self._build_response(apt, slot, apt.get("doctors"))
                )

            # Sort by slot time ascending
            appointments.sort(key=lambda x: x.slot.start_time if x.slot else "", reverse=False)

            return appointments

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Errore nel recupero degli appuntamenti: {str(e)}"
            )

    def update(
        self,
        appointment_id: UUID,
        data: AppointmentUpdate,
        user_id: UUID,
        is_admin: bool
    ) -> AppointmentResponse:
        """Update appointment patient data. Patient can update only theirs, admin can update any."""
        try:
            result = self.client.table("appointments") \
                .select("*, availability_slots(*), doctors(*)") \
                .eq("id", str(appointment_id)) \
                .execute()

            if not result.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Appuntamento non trovato"
                )

            appointment = result.data[0]

            if not is_admin and appointment.get("user_id") != str(user_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Non puoi modificare appuntamenti di altri utenti"
                )

            update_data = data.model_dump(exclude_unset=True)
            if not update_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Nessun dato da aggiornare"
                )

            update_result = self.client.table("appointments") \
                .update(update_data) \
                .eq("id", str(appointment_id)) \
                .execute()

            if not update_result.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Errore nell'aggiornamento"
                )

            return self._build_response(
                update_result.data[0],
                appointment.get("availability_slots"),
                appointment.get("doctors")
            )

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Errore nell'aggiornamento: {str(e)}"
            )

    def cancel(
        self,
        appointment_id: UUID,
        user_id: UUID,
        is_admin: bool
    ) -> AppointmentResponse:
        """
        Cancel an appointment. Admin can cancel any, patient can only cancel their future appointments.
        """
        try:

            result = self.client.table("appointments") \
                .select("*, availability_slots(*), doctors(*)") \
                .eq("id", str(appointment_id)) \
                .execute()

            if not result.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Appuntamento non trovato"
                )

            appointment = result.data[0]
            slot = appointment.get("availability_slots")

            # Check permissions
            if not is_admin:
                if appointment.get("user_id") != str(user_id):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Non puoi cancellare appuntamenti di altri utenti"
                    )

                # Check if appointment is in the future
                if slot:
                    slot_time = datetime.fromisoformat(slot["start_time"])
                    if slot_time <= datetime.now():
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Non puoi cancellare appuntamenti passati"
                        )

            # Check if already cancelled
            if appointment["status"] == "cancelled":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Appuntamento già cancellato"
                )

            # Cancel appointment
            update_result = self.client.table("appointments") \
                .update({"status": "cancelled"}) \
                .eq("id", str(appointment_id)) \
                .execute()

            # Mark the slot as free
            if slot:
                self.client.table("availability_slots") \
                    .update({"is_available": True}) \
                    .eq("id", slot["id"]) \
                    .execute()

            updated_appointment = update_result.data[0]
            updated_appointment["availability_slots"] = slot
            updated_appointment["doctors"] = appointment.get("doctors")

            return self._build_response(
                updated_appointment,
                slot,
                appointment.get("doctors")
            )

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Errore nella cancellazione: {str(e)}"
            )

    def _build_response(
        self,
        appointment: dict,
        slot: Optional[dict],
        doctor: Optional[dict]
    ) -> AppointmentResponse:
        response_data = {
            "id": appointment["id"],
            "doctor_id": appointment["doctor_id"],
            "patient_id": appointment.get("patient_id"),
            "slot_id": appointment["slot_id"],
            "patient_first_name": appointment["patient_first_name"],
            "patient_last_name": appointment["patient_last_name"],
            "patient_phone": appointment["patient_phone"],
            "patient_email": appointment["patient_email"],
            "status": appointment["status"],
            "created_at": appointment["created_at"],
        }

        if slot:
            response_data["slot"] = AvailabilitySlotResponse(**slot)

        if doctor:
            response_data["doctor"] = DoctorResponse(**doctor)

        return AppointmentResponse(**response_data)