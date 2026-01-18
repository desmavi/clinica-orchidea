from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from uuid import UUID
from app.core.database import get_supabase_admin_client
from app.services.appointments import AppointmentService
from app.services.email import EmailService, get_email_service
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


def format_date_for_email(iso_string: str) -> str:
    from datetime import datetime
    date_part = iso_string[:10]
    date_obj = datetime.strptime(date_part, "%Y-%m-%d")
    return date_obj.strftime("%d/%m/%Y")


def format_time_for_email(iso_string: str) -> str:
    return iso_string[11:16] if len(iso_string) > 16 else ""


def send_confirmation_email(appointment: AppointmentResponse, email_service: EmailService):
    if not appointment.doctor or not appointment.slot:
        return

    email_service.send_confirmation(
        to_email=appointment.patient_email,
        patient_name=f"{appointment.patient_first_name} {appointment.patient_last_name}",
        doctor_name=f"{appointment.doctor.first_name} {appointment.doctor.last_name}",
        specialization=appointment.doctor.specialization,
        date=format_date_for_email(str(appointment.slot.start_time)),
        time=format_time_for_email(str(appointment.slot.start_time))
    )


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
    service: AppointmentService = Depends(get_appointment_service),
    email_service: EmailService = Depends(get_email_service)
):
    appointment = service.create(data, current_user.id)
    send_confirmation_email(appointment, email_service)
    return appointment


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
    service: AppointmentService = Depends(get_appointment_service),
    email_service: EmailService = Depends(get_email_service)
):
    is_admin = current_user.role == "admin"
    appointment = service.cancel(appointment_id, current_user.id, is_admin)

    # Send cancellation email
    if appointment.doctor and appointment.slot:
        patient_name = f"{appointment.patient_first_name} {appointment.patient_last_name}"
        doctor_name = f"{appointment.doctor.first_name} {appointment.doctor.last_name}"
        date = format_date_for_email(str(appointment.slot.start_time))
        time = format_time_for_email(str(appointment.slot.start_time))

        if is_admin:
            email_service.send_cancellation_by_clinic(
                appointment.patient_email, patient_name, doctor_name, date, time
            )
        else:
            email_service.send_cancellation_by_patient(
                appointment.patient_email, patient_name, doctor_name, date, time
            )

    return appointment


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
    date_end: Optional[str] = Query(None, description="End date for range filter (YYYY-MM-DD)"),
    status: Optional[str] = Query(None, description="Filter by status"),
    service: AppointmentService = Depends(get_appointment_service),
    _: UserResponse = Depends(require_admin)
):
    return service.get_all(doctor_id, date, date_end, status)


@router.post(
    "/admin/manual",
    response_model=AppointmentResponse,
    summary="Manual Booking",
    description="Admin creates appointment manually ( phone booking or in person booking )"
)
async def create_manual_appointment(
    data: AppointmentManualCreate,
    service: AppointmentService = Depends(get_appointment_service),
    email_service: EmailService = Depends(get_email_service),
    _: UserResponse = Depends(require_admin)
):
    appointment = service.create_manual(data)
    send_confirmation_email(appointment, email_service)
    return appointment


@router.post(
    "/{appointment_id}/resend-email",
    response_model=SuccessResponse,
    summary="Resend Confirmation Email",
    description="Resend confirmation email for an appointment"
)
async def resend_confirmation_email(
    appointment_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    service: AppointmentService = Depends(get_appointment_service),
    email_service: EmailService = Depends(get_email_service)
):
    is_admin = current_user.role == "admin"
    appointment = service.get_by_id(appointment_id, current_user.id, is_admin)
    send_confirmation_email(appointment, email_service)
    return SuccessResponse(message="Email inviata")