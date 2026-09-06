from supabase import create_client, ClientOptions
import os, time
from app.config import settings
import concurrent.futures

# Option 1: Disable keep-alive
opts = ClientOptions(headers={"Connection": "close"})
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY, options=opts)

def test_fetch(idx):
    try:
        r = supabase.table("users").select("id").limit(1).execute()
        return "OK"
    except Exception as e:
        return str(e)

print("Running 50 requests concurrently...")
t0 = time.time()
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    results = list(executor.map(test_fetch, range(50)))

errors = [r for r in results if r != "OK"]
print(f"Done. Time: {time.time()-t0:.2f}s. Errors: {len(errors)}")
if errors:
    print(errors[:5])

