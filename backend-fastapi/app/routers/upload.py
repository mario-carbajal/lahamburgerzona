import os
import uuid

from fastapi import APIRouter, Depends, UploadFile

from app.core.config import settings
from app.core.deps import error_negocio, require_roles
from app.models.admin_user import RolAdmin

router = APIRouter(prefix="/api/upload", tags=["upload"])

TIPOS_PERMITIDOS = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif"}
TAMANO_MAXIMO = 5 * 1024 * 1024  # 5MB


@router.post("")
async def subir_imagen(
    file: UploadFile,
    _admin=Depends(require_roles(RolAdmin.ADMIN)),
):
    if file.content_type not in TIPOS_PERMITIDOS:
        raise error_negocio("Solo se permiten imágenes JPG, PNG, WEBP o GIF")

    contenido = await file.read()
    if len(contenido) > TAMANO_MAXIMO:
        raise error_negocio("La imagen no debe superar 5MB")

    os.makedirs(settings.upload_dir, exist_ok=True)
    nombre_archivo = f"{uuid.uuid4().hex}{TIPOS_PERMITIDOS[file.content_type]}"
    ruta = os.path.join(settings.upload_dir, nombre_archivo)

    with open(ruta, "wb") as f:
        f.write(contenido)

    url = f"{settings.public_base_url}/uploads/{nombre_archivo}"
    return {"ok": True, "data": {"url": url, "filename": nombre_archivo}}
