from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import (
    auth,
    departments,
    categories,
    environmental,
    social,
    governance,
    gamification,
    dashboard,
    reports,
    notifications,
    settings as settings_router,
    products,
)

app = FastAPI(
    title="EcoSphere ESG Platform API",
    description="Backend API for the EcoSphere ESG Management Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
config = get_settings()
origins = [origin.strip() for origin in config.cors_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(departments.router, prefix="/api/departments", tags=["Departments"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(environmental.router, prefix="/api/environmental", tags=["Environmental"])
app.include_router(social.router, prefix="/api/social", tags=["Social"])
app.include_router(governance.router, prefix="/api/governance", tags=["Governance"])
app.include_router(gamification.router, prefix="/api/gamification", tags=["Gamification"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(settings_router.router, prefix="/api/settings", tags=["Settings"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "app": "EcoSphere ESG Platform"}


@app.get("/")
async def root_redirect():
    return RedirectResponse(url="/docs")
