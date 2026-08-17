"""
Pydantic models define what data looks like going IN to the API
(UserCreate) and what we send back OUT (UserResponse).
These mirror the `users` table from Phase 2 of the roadmap.
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    education: Optional[str] = None
    target_role: Optional[str] = None
    experience: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    education: Optional[str] = None
    target_role: Optional[str] = None
    experience: Optional[str] = None
    created_at: Optional[datetime] = None