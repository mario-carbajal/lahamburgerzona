from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


async def registrar(
    db: AsyncSession,
    *,
    admin_user_id: int,
    action: str,
    module: str,
    entity_id: str | int | None = None,
    details: str | None = None,
) -> None:
    """Registra una acción administrativa. No lanza excepciones: un fallo al
    auditar nunca debe tumbar la operación real que se está registrando."""
    try:
        db.add(
            AuditLog(
                admin_user_id=admin_user_id,
                action=action,
                module=module,
                entity_id=str(entity_id) if entity_id is not None else None,
                details=details,
            )
        )
        await db.commit()
    except Exception:
        await db.rollback()
