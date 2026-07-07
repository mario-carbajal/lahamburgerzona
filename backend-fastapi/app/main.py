import os

import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.core.limiter import limiter

if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.env,
        # Traza una fracción de requests para monitoreo de performance;
        # 100% de los errores siempre se capturan sin importar esto.
        traces_sample_rate=0.2,
    )
from app.routers import (
    admin_users,
    audit_log,
    auth,
    contact,
    coupons,
    cuenta,
    customers,
    hero,
    insumos,
    loyalty,
    menu,
    orders,
    payments,
    reports,
    reviews,
    settings as settings_router,
    upload,
)

app = FastAPI(title="La Hamburguezona API", version="1.0.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

app.include_router(auth.router)
app.include_router(admin_users.router)
app.include_router(audit_log.router)
app.include_router(menu.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(customers.router)
app.include_router(reviews.router)
app.include_router(reports.router)
app.include_router(contact.router)
app.include_router(hero.router)
app.include_router(insumos.router)
app.include_router(coupons.router)
app.include_router(loyalty.router)
app.include_router(cuenta.router)
app.include_router(settings_router.router)
app.include_router(upload.router)


@app.get("/api/health")
async def health():
    return {"ok": True, "data": {"status": "ok"}}
