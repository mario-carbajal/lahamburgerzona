from pydantic import BaseModel


class PaymentPreferenceRequest(BaseModel):
    order_id: int


class PaymentPreferenceOut(BaseModel):
    init_point: str
    preference_id: str
