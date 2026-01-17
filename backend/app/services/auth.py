from typing import Optional, Dict, Any
from uuid import UUID
from fastapi import HTTPException, status
from supabase import Client
from app.models import MagicLinkRequest, MagicLinkResponse, UserResponse
from app.core.config import settings


class AuthService:

    def __init__(self, supabase_client: Client):
        self.client = supabase_client

    def send_magic_link(self, request: MagicLinkRequest) -> MagicLinkResponse:
        try:
            # Request magic link from Supabase Auth
            result = self.client.auth.sign_in_with_otp(
                email=request.email,
                options={
                    "email_redirect_to": settings.frontend_url,
                    "should_create_user": True
                }
            )

            return MagicLinkResponse(
                message="Magic link inviato con successo. Controlla la tua email.",
                email=request.email
            )

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Errore nell'invio del magic link: {str(e)}"
            )

    def get_current_user(self, token: str) -> UserResponse:
        try:
            # Get user from token
            user_response = self.client.auth.get_user(token)

            if not user_response or not user_response.user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token non valido o scaduto"
                )

            user = user_response.user

            # Get user role from custom table
            user_data = self._get_user_data(user.id)

            return UserResponse(
                id=user.id,
                email=user.email,
                role=user_data.get("role", "patient"),
                created_at=user.created_at
            )

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Errore nell'autenticazione: {str(e)}"
            )

    def _get_user_data(self, user_id: str) -> Dict[str, Any]:
        try:
            # Try to get existing user
            result = self.client.table("users").select("*").eq("id", user_id).execute()

            if result.data and len(result.data) > 0:
                return result.data[0]

            # User doesn't exist - create with default role 'patient'
            # This happens on first login after magic link click
            new_user = {
                "id": user_id,
                "role": "patient"
            }

            insert_result = self.client.table("users").insert(new_user).execute()

            if insert_result.data and len(insert_result.data) > 0:
                return insert_result.data[0]

            # Fallback
            return {"role": "patient"}

        except Exception as e:
            # If table query fails, return default
            return {"role": "patient"}

    def verify_token(self, token: str) -> bool:
        try:
            user_response = self.client.auth.get_user(token)
            return user_response and user_response.user is not None
        except:
            return False

    def get_user_role(self, user_id: str) -> str:
        user_data = self._get_user_data(user_id)
        return user_data.get("role", "patient")

    def create_patient_profile(self, user_id: UUID, first_name: str, last_name: str, phone: str) -> Dict[str, Any]:
        try:
            patient_data = {
                "user_id": str(user_id),
                "first_name": first_name,
                "last_name": last_name,
                "phone": phone
            }

            result = self.client.table("patients").insert(patient_data).execute()

            if result.data and len(result.data) > 0:
                return result.data[0]

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Errore nella creazione del profilo paziente"
            )

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Errore nella creazione del profilo: {str(e)}"
            )
