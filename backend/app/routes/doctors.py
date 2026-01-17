from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from uuid import UUID
from app.core.database import get_supabase_admin_client
from app.services.doctors import DoctorService
from app.models import DoctorCreate, DoctorUpdate, DoctorResponse, SuccessResponse, UserResponse
from app.routes.auth import get_current_user


router = APIRouter()


def get_doctor_service() -> DoctorService:
    admin_client = get_supabase_admin_client()
    return DoctorService(admin_client)


def require_admin(current_user: UserResponse = Depends(get_current_user)) -> UserResponse:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accesso riservato agli amministratori"
        )
    return current_user


# PUBLIC ENDPOINTS

@router.get(
    "",
    response_model=List[DoctorResponse],
    summary="List Doctors",
    description="Get all doctors, optionally filtered by specialization"
)
async def list_doctors(
    specialization: Optional[str] = Query(None, description="Filter by specialization"),
    service: DoctorService = Depends(get_doctor_service)
):
    return service.get_all(specialization)


@router.get(
    "/specializations",
    response_model=List[str],
    summary="List Specializations",
    description="Get all unique specializations"
)
async def list_specializations(
    service: DoctorService = Depends(get_doctor_service)
):
    return service.get_specializations()


@router.get(
    "/{doctor_id}",
    response_model=DoctorResponse,
    summary="Get Doctor",
    description="Get a doctor by ID"
)
async def get_doctor(
    doctor_id: UUID,
    service: DoctorService = Depends(get_doctor_service)
):
    return service.get_by_id(doctor_id)


# ADMIN ENDPOINTS

@router.post(
    "",
    response_model=DoctorResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Doctor",
    description="Create a new doctor (admin only)"
)
async def create_doctor(
    data: DoctorCreate,
    service: DoctorService = Depends(get_doctor_service),
    _: UserResponse = Depends(require_admin)
):
    return service.create(data)


@router.put(
    "/{doctor_id}",
    response_model=DoctorResponse,
    summary="Update Doctor",
    description="Update a doctor (admin only)"
)
async def update_doctor(
    doctor_id: UUID,
    data: DoctorUpdate,
    service: DoctorService = Depends(get_doctor_service),
    _: UserResponse = Depends(require_admin)
):
    return service.update(doctor_id, data)


@router.delete(
    "/{doctor_id}",
    response_model=SuccessResponse,
    summary="Delete Doctor",
    description="Delete a doctor (admin only)"
)
async def delete_doctor(
    doctor_id: UUID,
    service: DoctorService = Depends(get_doctor_service),
    _: UserResponse = Depends(require_admin)
):
    service.delete(doctor_id)
    return SuccessResponse(message="Dottore eliminato con successo")