from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# AUTHENTICATION MODELS

class MagicLinkRequest(BaseModel):
    email: EmailStr = Field(..., description="User email address")


class MagicLinkResponse(BaseModel):
    message: str = Field(..., description="Success message")
    email: str = Field(..., description="Email where link was sent")


# USER MODELS

class UserBase(BaseModel):
    email: EmailStr


class UserResponse(UserBase):
    id: UUID
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


# PATIENT MODELS

class PatientBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=10, max_length=20)


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, min_length=10, max_length=20)


class PatientResponse(PatientBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# DOCTOR MODELS

class DoctorBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    specialization: str = Field(..., min_length=1, max_length=100)
    profile_photo_url: Optional[str] = None


class DoctorCreate(DoctorBase):
    pass


class DoctorUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    specialization: Optional[str] = Field(None, min_length=1, max_length=100)
    profile_photo_url: Optional[str] = None


class DoctorResponse(DoctorBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# AVAILABILITY SLOT MODELS

class AvailabilitySlotCreate(BaseModel):
    """
    Model for creating availability slots.
    Admin provides doctor_id, date, start_time, and end_time.
    System automatically generates 30-minute slots.
    """
    doctor_id: UUID
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    start_time: str = Field(..., description="Start time in HH:MM format")
    end_time: str = Field(..., description="End time in HH:MM format")

    @validator('date')
    def validate_date_format(cls, v):
        """Ensure date is in correct format and not in the past."""
        try:
            date_obj = datetime.strptime(v, "%Y-%m-%d").date()
            today = datetime.now().date()
            if date_obj <= today:
                raise ValueError("Date must be at least tomorrow (no same-day slots)")
            return v
        except ValueError as e:
            raise ValueError(f"Invalid date format or value: {str(e)}")

    @validator('start_time', 'end_time')
    def validate_time_format(cls, v):
        """Ensure time is in HH:MM format."""
        try:
            datetime.strptime(v, "%H:%M")
            return v
        except ValueError:
            raise ValueError("Time must be in HH:MM format")


class AvailabilitySlotResponse(BaseModel):
    id: UUID
    doctor_id: UUID
    start_time: datetime
    end_time: datetime
    is_available: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AvailabilitySlotsCreatedResponse(BaseModel):
    message: str
    slots_created: int
    slots: List[AvailabilitySlotResponse]


# APPOINTMENT MODELS

class AppointmentCreate(BaseModel):
    slot_id: UUID
    patient_first_name: str = Field(..., min_length=1, max_length=100)
    patient_last_name: str = Field(..., min_length=1, max_length=100)
    patient_phone: str = Field(..., min_length=10, max_length=20)
    patient_email: EmailStr


class AppointmentManualCreate(AppointmentCreate):
    """
    Model for admin creating appointment manually (phone bookings).
    Extends AppointmentCreate with additional admin-only fields.
    """
    patient_id: Optional[UUID] = Field(
        None,
        description="Optional: link to existing patient account"
    )


class AppointmentUpdate(BaseModel):
    patient_first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    patient_last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    patient_phone: Optional[str] = Field(None, min_length=10, max_length=20)
    patient_email: Optional[EmailStr] = None


class AppointmentResponse(BaseModel):
    id: UUID
    doctor_id: UUID
    patient_id: Optional[UUID]
    slot_id: UUID
    patient_first_name: str
    patient_last_name: str
    patient_phone: str
    patient_email: str
    status: str
    created_at: datetime
    
    # Nested relationships
    doctor: Optional[DoctorResponse] = None
    slot: Optional[AvailabilitySlotResponse] = None

    class Config:
        from_attributes = True


class AppointmentListResponse(BaseModel):
    appointments: List[AppointmentResponse]
    total: int
    page: int
    page_size: int


# ADMIN MODELS

class DailyReportResponse(BaseModel):
    date: str
    total_appointments: int
    appointments_by_doctor: dict
    appointments: List[AppointmentResponse]


# GENERAL RESPONSE MODELS

class SuccessResponse(BaseModel):
    success: bool = True
    message: str


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: Optional[str] = None
