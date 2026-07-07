from pydantic import BaseModel, ConfigDict


class SettingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    setting_key: str
    setting_value: str | None
    description: str | None


class SettingUpdate(BaseModel):
    setting_value: str
