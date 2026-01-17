from typing import Generator
from supabase import create_client, Client
from app.core.config import settings


def get_supabase_client() -> Client:
    return create_client(
        supabase_url=settings.supabase_url,
        supabase_key=settings.supabase_key
    )


def get_supabase_admin_client() -> Client:
    return create_client(
        supabase_url=settings.supabase_url,
        supabase_key=settings.supabase_service_key
    )


# Dependency for route handlers
def get_db() -> Generator[Client, None, None]:
    """
    FastAPI dependency that provides a Supabase client.

    Yields:
        Client: Supabase client instance
    """
    client = get_supabase_client()
    try:
        yield client
    finally:
        # Cleanup if needed
        pass
