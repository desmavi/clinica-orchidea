from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from uuid import UUID
from app.core.database import get_supabase_admin_client
from app.services.availability import AvailabilityService
from app.models import (
    AvailabilitySlotCreate,
    AvailabilitySlotResponse,
    AvailabilitySlotsCreatedResponse,
    SuccessResponse,
    UserResponse
)
from app.routes.doctors import require_admin


router = APIRouter()


def get_availability_service() -> AvailabilityService:
    admin_client = get_supabase_admin_client()
    return AvailabilityService(admin_client)


# PUBLIC ENDPOINTS

@router.get(
    "/doctors/{doctor_id}/slots",
    response_model=List[AvailabilitySlotResponse],
    summary="Get Doctor Availability",
    description="Get available slots for a doctor, optionally filtered by date"
)
async def get_doctor_slots(
    doctor_id: UUID,
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    available_only: bool = Query(True, description="Only return available slots"),
    service: AvailabilityService = Depends(get_availability_service)
):
    return service.get_by_doctor(doctor_id, date, available_only)


@router.get(
    "/doctors/{doctor_id}/available-dates",
    response_model=List[str],
    summary="Get Available Dates",
    description="Get list of dates that have available slots for a doctor"
)
async def get_available_dates(
    doctor_id: UUID,
    service: AvailabilityService = Depends(get_availability_service)
):
    return service.get_available_dates(doctor_id)


# ADMIN ENDPOINTS

@router.post(
    "/admin/availability",
    response_model=AvailabilitySlotsCreatedResponse,
    summary="Create Availability Slots",
    description="Create availability slots for a doctor (admin only)"
)
async def create_slots(
    data: AvailabilitySlotCreate,
    service: AvailabilityService = Depends(get_availability_service),
    _: UserResponse = Depends(require_admin)
):
    slots = service.create_slots(data)
    return AvailabilitySlotsCreatedResponse(
        message=f"Creati {len(slots)} slot",
        slots_created=len(slots),
        slots=slots
    )


@router.patch(
    "/admin/availability/{slot_id}",
    response_model=AvailabilitySlotResponse,
    summary="Toggle Slot Availability",
    description="Enable or disable a slot (admin only)"
)
async def toggle_slot(
    slot_id: UUID,
    is_available: bool = Query(..., description="New availability status"),
    service: AvailabilityService = Depends(get_availability_service),
    _: UserResponse = Depends(require_admin)
):
    return service.toggle_availability(slot_id, is_available)


@router.delete(
    "/admin/availability/{slot_id}",
    response_model=SuccessResponse,
    summary="Delete Slot",
    description="Delete a slot (admin only)"
)
async def delete_slot(
    slot_id: UUID,
    service: AvailabilityService = Depends(get_availability_service),
    _: UserResponse = Depends(require_admin)
):
    service.delete(slot_id)
    return SuccessResponse(message="Slot eliminato con successo")