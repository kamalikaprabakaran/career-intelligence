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

# --- Connection Pool Hotfix ---
# Disable HTTP/2 and set strong keep-alive limits to solve intermittent
# httpx.RemoteProtocolError: Server disconnected issues across threadpools.
old_session = supabase.postgrest.session
supabase.postgrest.session = httpx.Client(
    base_url=old_session.base_url,
    headers=old_session.headers,
    auth=old_session.auth,
    http2=False, # HTTP/1.1 is more stable across FastAPI thread boundary
    timeout=old_session.timeout,
    limits=httpx.Limits(max_connections=50, max_keepalive_connections=20, keepalive_expiry=5.0)
)
# ------------------------------

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