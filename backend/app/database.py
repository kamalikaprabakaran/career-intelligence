"""
Creates one shared Supabase client for the whole backend.
Every service/router imports `supabase` from here instead of
creating a new connection every time.
"""

from supabase import create_client, Client
from app.config import settings

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)