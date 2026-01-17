from fastapi import APIRouter, Depends, HTTPException, status, Header
from typing import Optional
from supabase import Client
from app.core.database import get_db
from app.services.auth import AuthService
from app.models import MagicLinkRequest, MagicLinkResponse, UserResponse


# Create router
router = APIRouter()


def get_auth_service(db: Client = Depends(get_db)) -> AuthService:
    return AuthService(db)


def get_token_from_header(authorization: Optional[str] = Header(None)) -> str:
    """
    Extract and validate JWT token from Authorization header.

    Args:
        authorization: Authorization header value

    Returns:
        JWT token string

    Raises:
        HTTPException: If token is missing or invalid format
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token di autenticazione mancante",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if it's Bearer token format
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Formato token non valido. Usa: 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return parts[1]


def get_current_user(
    token: str = Depends(get_token_from_header),
    auth_service: AuthService = Depends(get_auth_service)
) -> UserResponse:

    return auth_service.get_current_user(token)


# AUTH ENDPOINTS

@router.post(
    "/magic-link",
    response_model=MagicLinkResponse,
    summary="Request Magic Link",
    description="Send a magic link to the user's email for passwordless authentication"
)
async def request_magic_link(
    request: MagicLinkRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    return auth_service.send_magic_link(request)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get Current User",
    description="Get the currently authenticated user's information"
)
async def get_me(
    current_user: UserResponse = Depends(get_current_user)
):
    return current_user


@router.get(
    "/verify",
    summary="Verify Token",
    description="Verify if the current token is valid"
)
async def verify_token(
    auth_service: AuthService = Depends(get_auth_service),
    token: str = Depends(get_token_from_header)
):
    is_valid = auth_service.verify_token(token)

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token non valido o scaduto"
        )

    return {
        "valid": True,
        "message": "Token valido"
    }