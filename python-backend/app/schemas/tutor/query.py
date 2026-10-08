from pydantic import BaseModel


class AIResponse(BaseModel):
    response: str
    resource_search: str | None = None
