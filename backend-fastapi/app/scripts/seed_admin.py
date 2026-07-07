"""Crea el primer usuario ADMIN si todavía no existe ninguno. Idempotente."""
import asyncio
import os

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.admin_user import AdminUser, RolAdmin


async def main():
    username = os.environ.get("SEED_ADMIN_USERNAME", "admin")
    email = os.environ.get("SEED_ADMIN_EMAIL", "admin@lahamburguezona.com")
    password = os.environ.get("SEED_ADMIN_PASSWORD")
    full_name = os.environ.get("SEED_ADMIN_FULL_NAME", "Administrador")

    if not password:
        raise SystemExit("Define SEED_ADMIN_PASSWORD antes de correr este script")

    async with AsyncSessionLocal() as db:
        existing = await db.execute(select(AdminUser).where(AdminUser.role == RolAdmin.ADMIN))
        if existing.scalars().first() is not None:
            print("Ya existe un usuario ADMIN, no se crea otro.")
            return

        admin = AdminUser(
            username=username,
            email=email,
            password_hash=hash_password(password),
            role=RolAdmin.ADMIN,
            full_name=full_name,
            is_active=True,
        )
        db.add(admin)
        await db.commit()
        print(f"Usuario ADMIN creado: {username} / {email}")


asyncio.run(main())
