from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routes import auth

# Create FastAPI app instance
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="API for Clinica Orchidea appointment booking system",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS - Must be added BEFORE routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])


@app.get("/")
async def root():
    """Root endpoint - API health check."""
    return {
        "message": "Clinica Orchidea API",
        "version": settings.app_version,
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )
