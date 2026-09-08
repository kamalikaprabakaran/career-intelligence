import subprocess
import time
import urllib.request
import sys

print("Starting Uvicorn...")
proc = subprocess.Popen([sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8011"], cwd=r"D:\career-intelligence\backend")
time.sleep(3)

print("\nCurling http://127.0.0.1:8011/ ...")
try:
    req = urllib.request.urlopen("http://127.0.0.1:8011/")
    print(req.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP ERROR: {e.code} {e.reason}")
    print(e.read().decode('utf-8'))
except Exception as e:
    print("OTHER ERROR:", e)

proc.terminate()
