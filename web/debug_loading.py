import subprocess
import time
from playwright.sync_api import sync_playwright

def run_test():
    cwd = "/Users/alien/Desktop/TWStockTracker"
    server_process = subprocess.Popen(["python3", "-m", "http.server", "8006"], cwd=cwd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(2)
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            page.on("console", lambda msg: print(f"[Browser Console] {msg.type}: {msg.text}"))
            page.on("pageerror", lambda err: print(f"[Browser JS Error] {err}"))
            
            print("Navigating to index.html...")
            page.goto("http://localhost:8006/temp_repo/web/index.html")
            page.wait_for_timeout(5000) # Give it time to initialize
            
            print("Checking page state...")
            state = page.evaluate("""
                () => {
                    return {
                        title: document.title,
                        bodyEmpty: document.body.innerHTML.trim() === '',
                        appReady: !!window.api && !!window.db && !!window.CorporateActions,
                        detailVisible: !document.getElementById('stock-detail').classList.contains('hidden')
                    };
                }
            """)
            print(f"Page State: {state}")
            browser.close()
    finally:
        server_process.terminate()

if __name__ == "__main__":
    run_test()
