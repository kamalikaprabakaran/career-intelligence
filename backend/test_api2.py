import threading
import uvicorn
import time
import urllib.request
import sys
from app.main import app

def start_server():
    uvicorn.run(app, host="127.0.0.1", port=8013, log_level="error")

t = threading.Thread(target=start_server, daemon=True)
t.start()

time.sleep(3)

try:
    req = urllib.request.urlopen("http://127.0.0.1:8013/")
    print("ROOT_OK:", req.read().decode('utf-8'))
except Exception as e:
    print("ROOT_ERROR:", e)

try:
    req2 = urllib.request.urlopen("http://127.0.0.1:8013/health/db")
    print("HEALTH_OK:", req2.read().decode('utf-8'))
except Exception as e:
    print("HEALTH_ERROR:", e)

sys.exit(0)
