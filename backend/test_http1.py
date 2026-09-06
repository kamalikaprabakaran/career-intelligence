from supabase import create_client, ClientOptions
import os, time
from app.config import settings
import concurrent.futures
import httpx

supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

# Strip HTTP/2
old = supabase.postgrest.session
new_session = httpx.Client(
    base_url=old.base_url,
    headers=old.headers,
    auth=old.auth,
    http2=False,
    timeout=old.timeout,
    limits=httpx.Limits(max_connections=50, max_keepalive_connections=20, keepalive_expiry=5.0)
)
supabase.postgrest.session = new_session

def test_fetch(idx):
    try:
        r = supabase.table("users").select("id").limit(1).execute()
        return "OK"
    except Exception as e:
        return str(type(e).__name__)

print("Running 50 requests concurrently with HTTP/1.1...")
t0 = time.time()
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
    results = list(executor.map(test_fetch, range(100)))

errors = [r for r in results if r != "OK"]
print(f"Done. Time: {time.time()-t0:.2f}s. Errors: {len(errors)}")
if errors:
    print(errors[:5])

