from pydantic import BaseModel

class PermissionRequest(BaseModel):
    permission_type: str
