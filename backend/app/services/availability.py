from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from supabase import Client
from app.models import AvailabilitySlotCreate, AvailabilitySlotResponse


class AvailabilityService:

    def __init__(self, admin_client: Client):
        # Uses service_role key to bypass RLS
        self.client = admin_client

    def create_slots(self, data: AvailabilitySlotCreate) -> List[AvailabilitySlotResponse]:
        """
        Generate 30-minute slots for a given time range.
        Admin provides date, start_time, end_time and system generates individual slots.
        Skips slots that already exist (same doctor, same start_time).
        """
        try:
            # Parse date and times
            date_str = data.date
            start_dt = datetime.strptime(f"{date_str} {data.start_time}", "%Y-%m-%d %H:%M")
            end_dt = datetime.strptime(f"{date_str} {data.end_time}", "%Y-%m-%d %H:%M")

            if end_dt <= start_dt:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="L'ora di fine deve essere successiva all'ora di inizio"
                )

            # Get existing slots for this doctor on this date
            existing = self.client.table("availability_slots") \
                .select("start_time") \
                .eq("doctor_id", str(data.doctor_id)) \
                .gte("start_time", f"{date_str}T00:00:00") \
                .lte("start_time", f"{date_str}T23:59:59") \
                .execute()

            existing_times = {slot["start_time"] for slot in existing.data}

            # Generate 30-minute slots, skipping duplicates
            slots_to_create = []
            current = start_dt
            while current + timedelta(minutes=30) <= end_dt:
                slot_end = current + timedelta(minutes=30)
                slot_start_iso = current.isoformat()

                # Skip if slot already exists
                if slot_start_iso not in existing_times:
                    slots_to_create.append({
                        "doctor_id": str(data.doctor_id),
                        "start_time": slot_start_iso,
                        "end_time": slot_end.isoformat(),
                        "is_available": True
                    })
                current = slot_end

            if not slots_to_create:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Tutti gli slot in questo range esistono già"
                )

            # Insert only new slots
            result = self.client.table("availability_slots").insert(slots_to_create).execute()

            if not result.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Errore nella creazione degli slot"
                )

            return [AvailabilitySlotResponse(**slot) for slot in result.data]

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Errore nella creazione degli slot: {str(e)}"
            )

    def get_by_doctor(
        self,
        doctor_id: UUID,
        date: Optional[str] = None,
        available_only: bool = False
    ) -> List[AvailabilitySlotResponse]:
        """Get slots for a doctor, optionally filtered by date and availability."""
        try:
            query = self.client.table("availability_slots") \
                .select("*") \
                .eq("doctor_id", str(doctor_id))

            if date:
                # Filter by date (slots starting on that date)
                date_start = f"{date}T00:00:00"
                date_end = f"{date}T23:59:59"
                query = query.gte("start_time", date_start).lte("start_time", date_end)

            if available_only:
                query = query.eq("is_available", True)

            result = query.order("start_time").execute()

            return [AvailabilitySlotResponse(**slot) for slot in result.data]

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Errore nel recupero degli slot: {str(e)}"
            )

    def get_by_id(self, slot_id: UUID) -> AvailabilitySlotResponse:
        """Get a single slot by ID."""
        try:
            result = self.client.table("availability_slots") \
                .select("*") \
                .eq("id", str(slot_id)) \
                .execute()

            if not result.data or len(result.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Slot non trovato"
                )

            return AvailabilitySlotResponse(**result.data[0])

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Errore nel recupero dello slot: {str(e)}"
            )

    def toggle_availability(self, slot_id: UUID, is_available: bool) -> AvailabilitySlotResponse:
        """Enable or disable a slot."""
        try:
            # Check if slot exists
            self.get_by_id(slot_id)

            result = self.client.table("availability_slots") \
                .update({"is_available": is_available}) \
                .eq("id", str(slot_id)) \
                .execute()

            if not result.data or len(result.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Errore nell'aggiornamento dello slot"
                )

            return AvailabilitySlotResponse(**result.data[0])

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Errore nell'aggiornamento dello slot: {str(e)}"
            )

    def delete(self, slot_id: UUID) -> None:
        """Delete a slot."""
        try:
            # Check if slot exists
            self.get_by_id(slot_id)

            self.client.table("availability_slots") \
                .delete() \
                .eq("id", str(slot_id)) \
                .execute()

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Errore nell'eliminazione dello slot: {str(e)}"
            )

    def get_available_dates(self, doctor_id: UUID) -> List[str]:
        """Get list of dates that have available slots for a doctor."""
        try:
            # Get future slots that are available
            now = datetime.now().isoformat()

            result = self.client.table("availability_slots") \
                .select("start_time") \
                .eq("doctor_id", str(doctor_id)) \
                .eq("is_available", True) \
                .gte("start_time", now) \
                .order("start_time") \
                .execute()

            # Extract unique dates
            dates = set()
            for slot in result.data:
                date = slot["start_time"][:10]  # Extract YYYY-MM-DD
                dates.add(date)

            return sorted(list(dates))

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Errore nel recupero delle date: {str(e)}"
            )