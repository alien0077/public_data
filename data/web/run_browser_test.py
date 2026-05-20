import subprocess
import time
import os
import sys
from playwright.sync_api import sync_playwright

def run_test():
    # 1. 啟動 HTTP 伺服器
    # 我們在工作區的根目錄啟動服務，即 /Users/alien/Desktop/TWStockTracker
    cwd = "/Users/alien/Desktop/TWStockTracker"
    server_process = subprocess.Popen(
        ["python3", "-m", "http.server", "8000"],
        cwd=cwd,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    print("HTTP Server started on port 8000...")
    
    # 給伺服器一點時間啟動
    time.sleep(1)
    
    try:
        with sync_playwright() as p:
            # 啟動 headless 瀏覽器
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            # 監聽 console 訊息
            page.on("console", lambda msg: print(f"[Browser Console] {msg.type}: {msg.text}"))
            page.on("pageerror", lambda err: print(f"[Browser JS Error] {err}"))
            
            # 首先載入頁面
            print("Navigating to index.html...")
            page.goto("http://localhost:8000/temp_repo/docs/index.html")
            page.wait_for_load_state("networkidle")
            
            # 繞過登入：設定 sessionStorage 并重新載入
            print("Setting session storage for auth bypass...")
            page.evaluate("sessionStorage.setItem('twstock_secret', 'local_dev_bypass')")
            
            # 寫入模擬的 IndexedDB 交易資料
            print("Inserting mock trades into IndexedDB...")
            page.evaluate("""
                new Promise((resolve, reject) => {
                    const request = indexedDB.open('TWStockTrackerDB', 1);
                    request.onupgradeneeded = (e) => {
                        const db = e.target.result;
                        if (!db.objectStoreNames.contains('trades')) {
                            db.createObjectStore('trades', { keyPath: 'id', autoIncrement: true });
                        }
                    };
                    request.onsuccess = (e) => {
                        const db = e.target.result;
                        const tx = db.transaction('trades', 'readwrite');
                        const store = tx.objectStore('trades');
                        store.clear(); // 清空舊的
                        store.put({
                            symbol: '0050',
                            name: '元大台灣50',
                            side: 'buy',
                            quantity: 1000,
                            price: 95.0,
                            date: '2026-05-18'
                        });
                        store.put({
                            symbol: '00949',
                            name: '復華台灣科技優選',
                            side: 'buy',
                            quantity: 2000,
                            price: 20.0,
                            date: '2026-05-18'
                        });
                        tx.oncomplete = () => resolve();
                        tx.onerror = () => reject();
                    };
                    request.onerror = () => reject();
                })
            """)
            
            print("Reloading page to trigger authenticated state...")
            page.reload()
            page.wait_for_load_state("networkidle")
            
            # 等待一段時間讓 API fetch 完成
            print("Waiting for API updates...")
            page.wait_for_timeout(3000)
            
            # 截圖保存主持股頁面
            screenshot_path = "/Users/alien/Desktop/TWStockTracker/temp_repo/docs/test_screenshot.png"
            page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to: {screenshot_path}")
            
            # --- 測試資金輪動分頁 ---
            print("Switching to 資金輪動 subpage...")
            page.evaluate("router.switchPage('trendHunter', '資金輪動')")
            page.wait_for_timeout(2000)
            page.screenshot(path="/Users/alien/Desktop/TWStockTracker/temp_repo/docs/test_rotation.png")
            print("Screenshot for 資金輪動 saved.")
            
            # --- 測試精選策略分頁 ---
            print("Switching to 精選策略 subpage...")
            page.evaluate("router.switchPage('trendHunter', '精選策略')")
            page.wait_for_timeout(2000)
            page.screenshot(path="/Users/alien/Desktop/TWStockTracker/temp_repo/docs/test_strategy.png")
            print("Screenshot for 精選策略 saved.")

            # --- 測試量化精選分頁 ---
            # Test 1: Portfolio View
            print("Navigating to Portfolio View...")
            page.evaluate("window.router.switchPage('portfolio');")
            page.wait_for_timeout(3000)
            page.screenshot(path="test_portfolio.png", full_page=True)
            print("Saved test_portfolio.png")

            # Test 2: Asset Risk View - 配置
            print("Navigating to Asset Risk View - 配置...")
            page.evaluate("window.router.switchPage('assetRisk', '配置');")
            page.wait_for_timeout(3000)
            page.screenshot(path="test_assetRisk_config.png", full_page=True)
            print("Saved test_assetRisk_config.png")
            print("Switching to 量化精選 subpage...")
            page.evaluate("router.switchPage('trendHunter', '量化精選')")
            page.wait_for_timeout(2000)
            page.screenshot(path="/Users/alien/Desktop/TWStockTracker/temp_repo/docs/test_quant.png")
            print("Screenshot for 量化精選 saved.")

            # --- 測試今日最熱分頁 ---
            print("Switching to 今日最熱 subpage...")
            page.evaluate("router.switchPage('trendHunter', '今日最熱')")
            page.wait_for_timeout(2000)
            page.screenshot(path="/Users/alien/Desktop/TWStockTracker/temp_repo/docs/test_hottest.png")
            print("Screenshot for 今日最熱 saved.")

            # --- 測試 ETF戰情分頁 ---
            print("Switching to ETF戰情 subpage...")
            page.evaluate("router.switchPage('trendHunter', 'ETF戰情')")
            page.wait_for_timeout(2000)
            page.screenshot(path="/Users/alien/Desktop/TWStockTracker/temp_repo/docs/test_etf.png")
            print("Screenshot for ETF戰情 saved.")
            
            # --- 測試熱力圖分頁 ---
            print("Switching to 熱力圖 subpage...")
            page.evaluate("router.switchPage('trendHunter', '熱力圖')")
            page.wait_for_timeout(2000)
            page.screenshot(path="/Users/alien/Desktop/TWStockTracker/temp_repo/docs/test_heatmap.png")
            print("Screenshot for 熱力圖 saved.")

            # --- 測試資產配置分頁 ---
            print("Switching to assetRisk (資產配置) page...")
            page.evaluate("router.switchPage('assetRisk', '配置')")
            page.wait_for_timeout(2000)
            page.screenshot(path="/Users/alien/Desktop/TWStockTracker/temp_repo/docs/test_assetRisk_allocation.png")
            print("Screenshot for 資產配置 saved.")

            # --- 測試風險評估分頁 ---
            print("Switching to assetRisk (風險評估) subpage...")
            page.evaluate("router.switchPage('assetRisk', '風險')")
            page.wait_for_timeout(2000)
            page.screenshot(path="/Users/alien/Desktop/TWStockTracker/temp_repo/docs/test_assetRisk_risk.png")
            print("Screenshot for 風險評估 saved.")

            # --- 測試股利預估分頁 ---
            print("Switching to assetRisk (股利預估) subpage...")
            page.evaluate("router.switchPage('assetRisk', '現金流')")
            page.wait_for_timeout(2000)
            page.screenshot(path="/Users/alien/Desktop/TWStockTracker/temp_repo/docs/test_assetRisk_cashflow.png")
            print("Screenshot for 股利預估 saved.")

            # --- 測試個股詳情彈窗 (2330) ---
            print("Showing StockDetail for 2330...")
            page.evaluate("StockDetail.show('2330')")
            page.wait_for_timeout(3000)
            page.screenshot(path="/Users/alien/Desktop/TWStockTracker/temp_repo/docs/test_stockDetail_2330.png")
            print("Screenshot for StockDetail 2330 saved.")

            browser.close()
    except Exception as e:
        print("Error during playwright run:", e)
    finally:
        # 關閉伺服器
        server_process.terminate()
        server_process.wait()
        print("HTTP Server stopped.")

if __name__ == "__main__":
    run_test()
