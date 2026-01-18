from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from uuid import UUID
from app.core.database import get_supabase_admin_client
from app.services.appointments import AppointmentService
from app.models import (
    AppointmentCreate,
    AppointmentManualCreate,
    AppointmentUpdate,
    AppointmentResponse,
    SuccessResponse,
    UserResponse
)
from app.routes.auth import get_current_user
from app.routes.doctors import require_admin


router = APIRouter()


def get_appointment_service() -> AppointmentService:
    admin_client = get_supabase_admin_client()
    return AppointmentService(admin_client)


# PATIENT ENDPOINTS

@router.post(
    "",
    response_model=AppointmentResponse,
    summary="Book Appointment",
    description="Book an appointment for a slot"
)
async def create_appointment(
    data: AppointmentCreate,
    current_user: UserResponse = Depends(get_current_user),
    service: AppointmentService = Depends(get_appointment_service)
):
    return service.create(data, current_user.id)


@router.get(
    "/me",
    response_model=List[AppointmentResponse],
    summary="My Appointments",
    description="Get all appointments for the current user"
)
async def get_my_appointments(
    current_user: UserResponse = Depends(get_current_user),
    service: AppointmentService = Depends(get_appointment_service)
):
    return service.get_my_appointments(current_user.id)


@router.patch(
    "/{appointment_id}",
    response_model=AppointmentResponse,
    summary="Update Appointment",
    description="Update appointment patient data"
)
async def update_appointment(
    appointment_id: UUID,
    data: AppointmentUpdate,
    current_user: UserResponse = Depends(get_current_user),
    service: AppointmentService = Depends(get_appointment_service)
):
    is_admin = current_user.role == "admin"
    return service.update(appointment_id, data, current_user.id, is_admin)


@router.delete(
    "/{appointment_id}",
    response_model=AppointmentResponse,
    summary="Cancel Appointment",
    description="Cancel an appointment"
)
async def cancel_appointment(
    appointment_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    service: AppointmentService = Depends(get_appointment_service)
):
    is_admin = current_user.role == "admin"
    return service.cancel(appointment_id, current_user.id, is_admin)


# ADMIN ENDPOINTS

@router.get(
    "/admin/all",
    response_model=List[AppointmentResponse],
    summary="All Appointments",
    description="Get all appointments (admin only)"
)
async def get_all_appointments(
    doctor_id: Optional[UUID] = Query(None, description="Filter by doctor"),
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    status: Optional[str] = Query(None, description="Filter by status"),
    service: AppointmentService = Depends(get_appointment_service),
    _: UserResponse = Depends(require_admin)
):
    return service.get_all(doctor_id, date, status)


@router.post(
    "/admin/manual",
    response_model=AppointmentResponse,
    summary="Manual Booking",
    description="Admin creates appointment manually ( phone booking or in person booking )"
)
async def create_manual_appointment(
    data: AppointmentManualCreate,
    service: AppointmentService = Depends(get_appointment_service),
    _: UserResponse = Depends(require_admin)
):
    return service.create_manual(data)