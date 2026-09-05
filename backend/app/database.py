"""
Creates one shared Supabase client for the whole backend.
Every service/router imports `supabase` from here instead of
creating a new connection every time.
"""

from supabase import create_client, Client
from app.config import settings
import httpx
import time

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def execute_with_retry(query, max_retries=2):
    """
    Executes a Supabase query builder with a small bounded retry.
    Useful for catching transient HTTP/2 RemoteProtocolErrors 
    caused by stale/dropped connections.
    """
    for attempt in range(max_retries):
        try:
            return query.execute()
        except httpx.RemoteProtocolError:
            if attempt == max_retries - 1:
                raise
            time.sleep(0.5)