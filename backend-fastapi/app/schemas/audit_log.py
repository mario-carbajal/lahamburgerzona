from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    admin_user_id: int
    admin_user_name: str
    action: str
    module: str
    entity_id: str | None
    details: str | None
    created_at: datetime
