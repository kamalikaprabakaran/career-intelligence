from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ResumeResponse(BaseModel):
    id: str
    user_id: str
    file_path: str
    original_filename: Optional[str] = None
    extracted_skills: Optional[List[str]] = None
    uploaded_at: datetime