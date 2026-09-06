import httpx
import concurrent.futures
import time

URL = "http://127.0.0.1:8000/recommendations/ceb0b225-c0ff-4bb0-adc6-ee7100a9058f"

def fetch(idx):
    try:
        r = httpx.get(URL, timeout=10.0)
        return r.status_code
    except Exception as e:
        return str(e)

print(f"Testing {URL} sequentially...")
t0 = time.time()
err_count = 0
for i in range(20):
    status = fetch(i)
    if status != 200:
        print(f"Seq request {i} failed with status {status}")
        err_count += 1
print(f"Done sequential. Errors: {err_count}. Time: {time.time()-t0:.2f}s")
    
print(f"Testing {URL} concurrently...")
t0 = time.time()
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    results = list(executor.map(fetch, range(50)))

err_count = 0
for idx, res in enumerate(results):
    if res != 200:
        print(f"Concurrent request {idx} failed with {res}")
        err_count += 1

print(f"Done concurrent. Total errors: {err_count}. Time: {time.time()-t0:.2f}s")
