import subprocess
import time
import os
import sys
import json
from playwright.sync_api import sync_playwright

def run_empirical_test():
    cwd = "/Users/alien/Desktop/TWStockTracker"
    server_process = subprocess.Popen(
        ["python3", "-m", "http.server", "8000"],
        cwd=cwd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    print("HTTP Server started.")
    
    time.sleep(2)
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            url = "http://localhost:8000/temp_repo/data/web/index.html"
            page.goto(url)
            page.evaluate("localStorage.setItem('twstock_secret', 'local_dev_bypass')")
            page.reload()
            page.wait_for_load_state("networkidle")
            
            print("--- Executing Direct API Test in Browser ---")
            
            # 測試 1: 測試 fetchQuotes 直接回傳
            # 我們要看的是有沒有任何一個 symbol 拿到價錢 (>0)
            result = page.evaluate("""
                async () => {
                    const symbols = ['IX0001', '2330', 'TSM', 'NVDA'];
                    const quotes = await api.fetchQuotes(symbols);
                    return {
                        quotes: quotes,
                        rawCount: Object.keys(quotes).length,
                        validPrices: Object.values(quotes).filter(q => q.price > 0).length
                    };
                }
            """)
            
            print(f"API Test Results: Found {result['rawCount']} keys, {result['validPrices']} have valid prices.")
            print("Detailed Quotes Data:")
            print(json.dumps(result['quotes'], indent=2, ensure_ascii=False))
            
            # 測試 2: 檢查 Dashboard DOM 實際內容
            page.evaluate("router.switchPage('dashboard')")
            page.wait_for_timeout(4000)
            
            dom_check = page.evaluate("""
                () => {
                    const tseVal = document.body.innerText.includes('加權') ? 'Found Text' : 'Not Found';
                    const allText = document.body.innerText;
                    // 尋找數字格式 (e.g. 20,000.0)
                    const hasNumbers = /[0-9]{1,3}(,[0-9]{3})*(\.[0-9]+)?/.test(allText);
                    return { tseVal, hasNumbers, sample: allText.substring(0, 500) };
                }
            """)
            print(f"DOM Check: {dom_check['tseVal']}, Has Numbers: {dom_check['hasNumbers']}")
            
            page.screenshot(path="temp_repo/data/web/empirical_verification.png")
            
            if result['validPrices'] > 0:
                print("SUCCESS: Valid data retrieved and processed.")
            else:
                print("FAILURE: No valid data found in final quotes object.")
                
            browser.close()
    except Exception as e:
        print("Error during empirical test:", e)
    finally:
        server_process.terminate()
        server_process.wait()
        print("HTTP Server stopped.")

if __name__ == "__main__":
    run_empirical_test()
