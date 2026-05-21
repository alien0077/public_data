import subprocess
import time
import os
import sys
from playwright.sync_api import sync_playwright

def run_test():
    # 1. 啟動 HTTP 伺服器
    cwd = "/Users/alien/Desktop/TWStockTracker"
    server_process = subprocess.Popen(
        ["python3", "-m", "http.server", "8000"],
        cwd=cwd,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    print("HTTP Server started on port 8000...")
    
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
            url = "http://localhost:8000/temp_repo/data/web/index.html"
            print(f"Navigating to {url}...")
            page.goto(url)
            page.wait_for_load_state("networkidle")
            
            # 繞過登入
            print("Setting localStorage for auth bypass...")
            page.evaluate("localStorage.setItem('twstock_secret', 'local_dev_bypass')")
            page.reload()
            page.wait_for_load_state("networkidle")
            
            # 測試儀表板 (Dashboard)
            print("--- Testing Dashboard Data Flow ---")
            
            # 注入測試腳本，主動測試 api.fetchQuotes
            test_results = page.evaluate("""
                async () => {
                    const symbols = ['IX0001', 'IX0043', 'DJI', 'TSM'];
                    const results = {};
                    
                    // 1. 測試格式化
                    results.formatted = await Promise.all(symbols.map(s => api.formatSymbol(s)));
                    
                    // 2. 測試報價獲取 (直接呼叫)
                    try {
                        results.quotes = await api.fetchQuotes(symbols);
                    } catch (e) {
                        results.error = e.message;
                    }
                    
                    // 3. 檢查市場狀態判定
                    results.marketStatus = {
                        IX0001: api.isMarketOpen('IX0001'),
                        DJI: api.isMarketOpen('DJI')
                    };
                    
                    return results;
                }
            """)
            print(f"Format Check: {test_results['formatted']}")
            print(f"Market Status: {test_results['marketStatus']}")
            if 'error' in test_results:
                print(f"Fetch Error: {test_results['error']}")
            else:
                print(f"Quotes Keys: {list(test_results['quotes'].keys())}")
                print(f"Quotes Sample (TSE): {test_results['quotes'].get('TSE') or test_results['quotes'].get('IX0001')}")

            page.evaluate("router.switchPage('dashboard')")
            page.wait_for_timeout(5000)
            page.screenshot(path="temp_repo/data/web/test_dashboard_final.png")
            
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
