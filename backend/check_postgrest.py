from supabase import create_client
import os

from app.config import settings
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

print("Original session:", supabase.postgrest.session)
print("Is HTTP2 enabled natively?", getattr(supabase.postgrest.session, '_http2', False))

import httpx
# Can we override?
supabase.postgrest.session = httpx.Client(http2=False, timeout=10.0)
print("New session:", supabase.postgrest.session)

# Does it still work?
res = supabase.table("users").select("id").limit(1).execute()
print("Success:", len(res.data) > 0)
