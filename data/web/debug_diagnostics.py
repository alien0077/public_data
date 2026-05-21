import subprocess
import time
import os
import sys
from playwright.sync_api import sync_playwright

def run_test():
    # 1. 啟動 HTTP 伺服器
    cwd = "/Users/alien/Desktop/TWStockTracker"
    server_process = subprocess.Popen(
        ["python3", "-m", "http.server", "8001"],
        cwd=cwd,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    print("HTTP Server started on port 8001...")
    
    time.sleep(2)
    
    try:
        with sync_playwright() as p:
            print("Launching headless browser...")
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            # 監聽 console 訊息 (排除 ECharts 的一些警告)
            page.on("console", lambda msg: print(f"[Browser Console] {msg.type}: {msg.text}") if "WARN" not in msg.text else None)
            page.on("pageerror", lambda err: print(f"[Browser JS Error] {err}"))
            
            # 載入頁面 (修正路徑)
            url = "http://localhost:8001/temp_repo/data/web/index.html"
            print(f"Navigating to {url}...")
            page.goto(url)
            page.wait_for_load_state("networkidle")
            
            # 繞過登入
            print("Setting localStorage for auth bypass...")
            page.evaluate("localStorage.setItem('twstock_secret', 'local_dev_bypass')")
            page.reload()
            page.wait_for_load_state("networkidle")
            
            # 測試儀表板 (Dashboard)
            print("--- Testing Dashboard Data Flow (Deep Trace) ---")
            
            # 注入測試腳本，主動測試 api.fetchQuotes 並捕捉原始回應
            test_results = page.evaluate("""
                async () => {
                    const symbols = ['IX0001', '2330', 'TSM'];
                    const results = {
                        browserTime: new Date().toString(),
                        isMarketOpen: {
                            IX0001: api.isMarketOpen('IX0001'),
                            s2330: api.isMarketOpen('2330')
                        }
                    };
                    
                    try {
                        // 1. 測試格式化後的 Query
                        const formatted = await Promise.all(symbols.map(s => api.formatSymbol(s)));
                        results.query = formatted.join(',');
                        
                        // 2. 攔截 fetch 請求以查看原始回傳
                        const originalFetch = window.fetch;
                        let lastResponse = null;
                        window.fetch = async (...args) => {
                            const res = await originalFetch(...args);
                            if (args[0].includes('/quote')) {
                                try {
                                    const cloned = res.clone();
                                    lastResponse = await cloned.json();
                                } catch(e) { lastResponse = 'JSON_PARSE_ERROR'; }
                            }
                            return res;
                        };
                        
                        // 3. 執行請求
                        results.quotes = await api.fetchQuotes(symbols);
                        results.rawApiResponse = lastResponse;
                        
                        // 恢復 fetch
                        window.fetch = originalFetch;
                    } catch (e) {
                        results.error = e.message;
                    }
                    
                    return results;
                }
            """)
            print(f"Browser Time: {test_results.get('browserTime')}")
            print(f"Market Status Check: {test_results.get('isMarketOpen')}")
            print(f"Formatted Query: {test_results.get('query')}")
            print(f"Raw API Response: {test_results.get('rawApiResponse')}")
            print(f"Final Quotes Keys: {list(test_results.get('quotes', {}).keys())}")
            
            if 'error' in test_results:
                print(f"Fetch Error: {test_results['error']}")

            page.evaluate("router.switchPage('dashboard')")
            page.wait_for_timeout(5000)
            page.screenshot(path="temp_repo/data/web/test_dashboard_trace.png")
            
            # 測試企業行為與持股
            print("--- Testing Corporate Actions & Portfolio ---")
            page.evaluate("""
                new Promise((resolve, reject) => {
                    const request = indexedDB.open('TWStockTrackerDB', 1);
                    request.onsuccess = (e) => {
                        const db = e.target.result;
                        const tx = db.transaction('trades', 'readwrite');
                        const store = tx.objectStore('trades');
                        store.clear();
                        // 插入一筆包含除權息歷史的股票 (例如 2330)
                        store.put({
                            symbol: '2330',
                            name: '台積電',
                            side: 'buy',
                            quantity: 1000,
                            price: 500.0,
                            date: '2023-01-01'
                        });
                        tx.oncomplete = () => resolve();
                        tx.onerror = () => reject();
                    };
                })
            """)
            page.evaluate("router.switchPage('portfolio')")
            page.wait_for_timeout(3000)
            page.screenshot(path="temp_repo/data/web/test_portfolio_adjusted.png")
            
            # 測試資產風險 - 現金流 (驗證新實作)
            print("--- Testing AssetRisk Cashflow (New) ---")
            page.evaluate("router.switchPage('assetRisk', '現金流')")
            page.wait_for_timeout(3000)
            page.screenshot(path="temp_repo/data/web/test_assetRisk_cashflow_new.png")
            
            # 測試歷年戰績 (驗證個股分類模式)
            print("--- Testing BattleRecord (New Grouping) ---")
            page.evaluate("router.switchPage('performance')")
            page.wait_for_timeout(3000)
            page.screenshot(path="temp_repo/data/web/test_battle_record.png")

            # 測試個股詳情時間軸
            print("--- Testing StockDetail Timeline ---")
            page.evaluate("StockDetail.show('2330')")
            page.wait_for_timeout(3000)
            page.screenshot(path="temp_repo/data/web/test_detail_timeline.png")

            print("Diagnostics complete. No fatal JS errors detected if none printed above.")
            browser.close()
    except Exception as e:
        print("Error during playwright diagnostics:", e)
    finally:
        server_process.terminate()
        server_process.wait()
        print("HTTP Server stopped.")

if __name__ == "__main__":
    run_test()
