import { db } from './db.js';
import { api } from './api.js';
import { charts } from './charts.js';
import { TrendHunter } from './views/trendHunter.js';
import { AssetRisk } from './views/assetRisk.js';
import { StockDetail } from './views/stockDetail.js';
import { BattleRecord } from './views/battleRecord.js';
import { Transaction } from './views/transaction.js';
import { Favorites } from './views/favorites.js';
import { router } from './router.js';
import { CorporateActions } from './corporateActions.js';
import { Dashboard } from './views/dashboard.js';

document.addEventListener('DOMContentLoaded', () => {
    const triggerImportBtn = document.getElementById('trigger-import');
    const sidebarImportBtn = document.getElementById('sidebar-import');
    const importJsonInput = document.getElementById('import-json');
    const portfolioBody = document.getElementById('portfolio-body');
    const emptyState = document.getElementById('empty-state');
    const manualRefreshBtn = document.getElementById('manual-refresh');
    const clearPortfolioBtn = document.getElementById('clear-portfolio');
    
    // Summary Card Elements
    const totalMarketValueEl = document.getElementById('total-market-value');
    const totalPnlEl = document.getElementById('total-pnl');
    const totalPnlPercentEl = document.getElementById('total-pnl-percent');
    const dailyPnlEl = document.getElementById('daily-pnl');

    // Detail Elements
    const stockDetailOverlay = document.getElementById('stock-detail');
    const closeDetailBtn = document.getElementById('close-detail');
    const detailSymbolEl = document.getElementById('detail-symbol');
    const detailNameEl = document.getElementById('detail-name');
    const detailPriceEl = document.getElementById('detail-price');
    const detailChangeEl = document.getElementById('detail-change');
    const detailTradesContainer = document.getElementById('detail-trades');
    
    // View Switchers
    const navDashboard = document.getElementById('nav-dashboard');
    const navPortfolio = document.getElementById('nav-portfolio');
    const navTrendHunter = document.getElementById('nav-trendHunter');
    const navAssetRisk = document.getElementById('nav-assetRisk');
    const navPerformance = document.getElementById('nav-performance');
    const navAddTrade = document.getElementById('nav-add-trade');
    const navFavorites = document.getElementById('nav-favorites');
    const themeToggleBtn = document.getElementById('theme-toggle');
    
    const mobileNavDashboard = document.getElementById('mobile-nav-dashboard');
    const mobileNavPortfolio = document.getElementById('mobile-nav-portfolio');
    const mobileNavTrendHunter = document.getElementById('mobile-nav-trendHunter');
    const mobileNavImport = document.getElementById('mobile-nav-import');
    const mobileNavFavorites = document.getElementById('mobile-nav-favorites');
    
    const viewPortfolio = document.getElementById('view-portfolio');
    const viewTrendHunter = document.getElementById('view-trendHunter');
    const viewTitle = document.getElementById('view-title');

    let currentQuotes = {};
    let currentDetailSymbol = null;
    let refreshInterval = null;

    function updateApiStatus(status, isError = false, source = 'OFFLINE') {
        const indicator = document.getElementById('status-indicator');
        const text = document.getElementById('status-text');
        const errorMsg = document.getElementById('api-error-msg');
        const sourceBadge = document.getElementById('data-source-badge');
        const timeEl = document.getElementById('last-refresh-time');

        if (!indicator || !text) return;

        text.textContent = status;
        indicator.className = `w-1.5 h-1.5 rounded-full mr-2 ${isError ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`;
        
        if (sourceBadge) {
            sourceBadge.textContent = source;
            sourceBadge.className = `px-2 py-0.5 rounded-full font-bold ${source === 'REALTIME' ? 'bg-green-500/10 text-green-500' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`;
        }

        if (timeEl) {
            timeEl.textContent = new Date().toLocaleTimeString();
        }
    }

    // --- Theme Logic ---
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            window.ThemeEngine.toggle();
        });
    }

    // --- Navigation Logic ---
    try {
        router.init();
    } catch (e) {
        console.error("Critical: Router init failed", e);
    }

    // 監聽路由變化，執行特定視圖的初始化
    window.addEventListener('router:changed', (e) => {
        const { primary, secondary } = e.detail;
        
        // 切換分頁時，強制關閉個股詳情
        if (stockDetailOverlay) stockDetailOverlay.classList.add('hidden');
        currentDetailSymbol = null;

        try {
            if (primary === 'dashboard') {
                Dashboard.init();
            } else if (primary === 'trendHunter') {
                TrendHunter.init(secondary);
            } else if (primary === 'assetRisk') {
                AssetRisk.init(secondary);
            } else if (primary === 'performance') {
                BattleRecord.init();
            } else if (primary === 'addTrade') {
                Transaction.init();
            } else if (primary === 'favorites') {
                Favorites.init(secondary);
            }
        } catch (err) {
            console.error(`${primary} view init error:`, err);
        }
    });

    // 監聽資料變動事件
    window.addEventListener('twstock:data-changed', () => {
        init();
    });

    if (navDashboard) navDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        router.switchPage('dashboard');
    });

    if (navPortfolio) navPortfolio.addEventListener('click', (e) => {
        e.preventDefault();
        router.switchPage('portfolio');
    });

    if (navTrendHunter) navTrendHunter.addEventListener('click', (e) => {
        e.preventDefault();
        router.switchPage('trendHunter');
    });

    if (navAssetRisk) navAssetRisk.addEventListener('click', (e) => {
        e.preventDefault();
        router.switchPage('assetRisk');
    });

    if (navPerformance) navPerformance.addEventListener('click', (e) => {
        e.preventDefault();
        router.switchPage('performance');
    });

    if (navAddTrade) navAddTrade.addEventListener('click', (e) => {
        e.preventDefault();
        router.switchPage('addTrade');
    });

    if (navFavorites) navFavorites.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Sidebar Favorites clicked');
        router.switchPage('favorites');
    });

    if (mobileNavDashboard) mobileNavDashboard.addEventListener('click', () => router.switchPage('dashboard'));
    if (mobileNavPortfolio) mobileNavPortfolio.addEventListener('click', () => router.switchPage('portfolio'));
    if (mobileNavTrendHunter) mobileNavTrendHunter.addEventListener('click', () => router.switchPage('trendHunter'));
    if (mobileNavFavorites) mobileNavFavorites.addEventListener('click', () => {
        console.log('Mobile Favorites clicked');
        router.switchPage('favorites');
    });

    if (triggerImportBtn && importJsonInput) {
        const handleImportClick = () => importJsonInput.click();
        triggerImportBtn.addEventListener('click', handleImportClick);
        if (sidebarImportBtn) sidebarImportBtn.addEventListener('click', handleImportClick);
        if (mobileNavImport) mobileNavImport.addEventListener('click', handleImportClick);

        importJsonInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    let trades = [];
                    
                    // 🚀 v2.16.1: 智慧偵測交易資料源，優先選取紀錄較完整的陣列
                    const nTrades = Array.isArray(data.normalizedTrades) ? data.normalizedTrades : [];
                    const rTransactions = Array.isArray(data.transactions) ? data.transactions : [];
                    
                    if (nTrades.length > 0 || rTransactions.length > 0) {
                        // 優先選擇長度較長的，防止 iOS 備份中 normalizedTrades 滯後的問題
                        trades = rTransactions.length >= nTrades.length ? rTransactions : nTrades;
                    } else if (Array.isArray(data)) {
                        trades = data;
                    }

                    if (trades.length > 0) {
                        await db.saveTrades(trades);
                        alert(`成功匯入 ${trades.length} 筆交易紀錄！系統將重新載入...`);
                        
                        // 🚀 v2.15.2: 深度系統重置
                        currentQuotes = {}; // 清空舊報價
                        const symbols = Array.from(new Set(trades.map(t => t.symbol || t.stock_id || t.stockId)));
                        await CorporateActions.loadCorporateActions(symbols); // 重新讀取除權息
                        await init(); // 重啟 UI 組件
                        await refreshQuotes(); // 立刻抓取最新報價
                    } else {
                        alert('在 JSON 檔案中找不到有效的交易紀錄。');
                    }
                } catch (err) {
                    alert('解析 JSON 檔案失敗。');
                }
            };
            reader.readAsText(file);
        });
    }

    if (manualRefreshBtn) {
        manualRefreshBtn.addEventListener('click', () => {
            refreshQuotes();
        });
    }

    if (clearPortfolioBtn) {
        clearPortfolioBtn.addEventListener('click', async () => {
            const confirmed = confirm("確定要清空所有持股紀錄嗎？此動作無法復原！");
            if (confirmed) {
                try {
                    await db.clearAllTrades();
                    alert('持股紀錄已清空');
                    // Force refresh view
                    const trades = await db.getAllTrades();
                    renderPortfolio(trades, {});
                    emptyState.classList.remove('hidden');
                } catch (e) {
                    alert('清空失敗：' + e);
                }
            }
        });
    }

    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', () => {
            stockDetailOverlay.classList.add('hidden');
            currentDetailSymbol = null;
        });
    }

    // 初始化讀取資料
    async function init() {
        try {
            // 如果當前頁面是儀表板，主動初始化它
            if (router.currentPrimary === 'dashboard') {
                Dashboard.init();
            }

            // 抓取說謊實錄
            const liarData = await api.fetchLiarData();
            renderLiarSection(liarData);

            const trades = await db.getAllTrades();
            if (trades.length > 0) {
                // 載入企業行為
                const symbols = Array.from(new Set(trades.map(t => t.symbol || t.stock_id || t.stockId)));
                await CorporateActions.loadCorporateActions(symbols);
                
                emptyState.classList.add('hidden');
                // 先用現有資料渲染一次 (可能沒有現價)
                renderPortfolio(trades);
                // 啟動自動刷新現價
                startAutoRefresh();
            } else {
                emptyState.classList.remove('hidden');
            }
        } catch (err) {
            console.error("Initialization failed:", err);
        }
    }

    function renderLiarSection(data) {
        const section = document.getElementById('liar-section');
        const container = document.getElementById('liar-container');
        if (!section || !container) return;

        if (!data || !data.data || data.data.length === 0) {
            section.classList.add('hidden');
            return;
        }

        section.classList.remove('hidden');
        container.innerHTML = data.data.map(item => `
            <div class="flex-none w-72 bg-white dark:bg-[#161b22] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm cursor-pointer hover:border-blue-500/50 transition-all"
                 onclick="window.StockDetail.show('${item.stockId}')">
                <div class="flex justify-between items-start mb-3">
                    <span class="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded font-bold">${item.brokerName}</span>
                    <span class="text-orange-500 text-[10px] font-bold">🔥 說謊指數 ${item.lyingScore}</span>
                </div>
                <div class="text-xs font-bold text-gray-900 dark:text-white mb-4 line-clamp-2 h-8">
                    ${item.newsTitle}
                </div>
                <div class="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-800 pt-3">
                    <div>
                        <div class="text-[10px] text-gray-500">喊價目標</div>
                        <div class="text-sm font-mono font-bold text-red-500">${formatNumber(item.targetPrice)} 元</div>
                    </div>
                    <div class="text-right">
                        <div class="text-[10px] text-gray-500">${item.netVolume < 0 ? '偷偷倒貨' : '偷偷吸籌'}</div>
                        <div class="text-sm font-mono font-bold text-blue-500">${formatNumber(Math.abs(item.netVolume), 0)} 張</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function startAutoRefresh() {
        if (refreshInterval) clearInterval(refreshInterval);
        refreshQuotes(); // 立即刷新一次
        refreshInterval = setInterval(refreshQuotes, 60000); // 每 60 秒刷新
    }

    async function refreshQuotes() {
        const trades = await db.getAllTrades();
        if (trades.length === 0) {
            updateApiStatus('無持股數據', false, 'IDLE');
            return;
        }

        const holdings = calculateHoldings(trades);
        const symbols = Object.keys(holdings);
        
        try {
            updateApiStatus('正在同步報價...', false, 'FETCHING');
            const quotes = await api.fetchQuotes(symbols);
            currentQuotes = quotes;
            
            const hasRealtime = Object.values(quotes).some(q => q.source === 'REALTIME');
            updateApiStatus('報價同步成功', false, hasRealtime ? 'REALTIME' : 'OFFLINE');

            renderPortfolio(trades, quotes);
            
            if (currentDetailSymbol && quotes[currentDetailSymbol]) {
                updateDetailHeader(currentDetailSymbol, quotes[currentDetailSymbol]);
            }
        } catch (err) {
            console.error("refreshQuotes failed:", err);
            updateApiStatus(`同步失敗: ${err.message}`, true, 'ERROR');
            renderPortfolio(trades, currentQuotes || {});
        }
    }

    function calculateHoldings(trades) {
        return CorporateActions.recalculateHoldings(trades);
    }

    function renderPortfolio(trades, quotes = {}) {
        const holdings = calculateHoldings(trades); // Now returns everything historical
        portfolioBody.innerHTML = '';

        let totalMarketValue = 0;
        let totalCostValue = 0;
        let totalRefMarketValue = 0;
        let totalRealizedPNL = 0;
        let totalDividendIncome = 0;

        const sortedSymbols = Object.keys(holdings).sort();

        sortedSymbols.forEach(sym => {
            const h = holdings[sym];
            
            // Accumulate historical gains for ALL symbols (even closed ones)
            totalRealizedPNL += (h.realizedPNL || 0);
            totalDividendIncome += (h.totalDividend || 0);

            // Only render active holdings in the table
            if (h.shares <= 0.001) return;

            const quote = quotes[sym] || quotes[sym.split('.')[0]] || {};
            const price = quote.price || 0;
            const refPrice = quote.referencePrice || price;
            
            const shares = h.shares;
            const avgCost = h.totalCost / shares;
            const marketValue = price > 0 ? (price * shares) : (avgCost * shares);
            const costValue = h.totalCost;
            
            // 未實現損益 (Unrealized)
            const unrealizedPnl = price > 0 ? (marketValue - costValue) : 0;
            const unrealizedRoi = costValue > 0 ? (unrealizedPnl / costValue * 100) : 0;
            
            // 🚀 v2.14.1: 改進顯示邏輯
            // 表格中顯示「目前庫存」的損益
            const currentPositionPnl = unrealizedPnl; 
            
            const changePercent = (price > 0 && refPrice > 0) ? ((price - refPrice) / refPrice * 100) : 0;

            totalMarketValue += marketValue;
            totalCostValue += costValue;
            totalRefMarketValue += (refPrice > 0 ? (refPrice * shares) : marketValue);

            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-800/30 transition-colors cursor-pointer';
            row.addEventListener('click', () => StockDetail.show(sym));
            
            row.innerHTML = `
                <td class="px-3 md:px-6 py-4">
                    <div class="font-bold text-white">${sym}</div>
                    <div class="text-[10px] text-gray-500 truncate max-w-[100px]">${h.name || quote.name || ''}</div>
                </td>
                <td class="px-3 md:px-6 py-4 text-right ${getPriceColor(price, refPrice)}">
                    ${price > 0 ? formatNumber(price) : '--'}
                </td>
                <td class="px-3 md:px-6 py-4 text-right ${getPriceColor(price, refPrice)} text-xs">
                    ${price > 0 ? `${changePercent > 0 ? '▲' : (changePercent < 0 ? '▼' : '')} ${Math.abs(changePercent).toFixed(2)}%` : '--'}
                </td>
                <td class="px-3 md:px-6 py-4 text-right hidden sm:table-cell">
                    ${formatNumber(shares, 0)}
                </td>
                <td class="px-3 md:px-6 py-4 text-right text-gray-400 text-xs hidden sm:table-cell">
                    ${formatNumber(avgCost)}
                </td>
                <td class="px-3 md:px-6 py-4 text-right font-bold text-blue-400 hidden md:table-cell">
                    ${formatNumber(marketValue, 0)}
                </td>
                <td class="px-3 md:px-6 py-4 text-right ${currentPositionPnl >= 0 ? 'text-red-500' : 'text-green-500'}">
                    <div class="font-bold">${(currentPositionPnl >= 0 ? '+' : '') + formatNumber(currentPositionPnl, 0)}</div>
                    <div class="text-[10px] opacity-70">${unrealizedRoi.toFixed(2)}% (未實現)</div>
                </td>
                <td class="px-3 md:px-6 py-4 text-right">
                    <button class="delete-stock p-2 text-gray-500 hover:text-red-500 transition-colors" data-symbol="${sym}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </td>
            `;
            
            row.querySelector('.delete-stock').addEventListener('click', async (e) => {
                e.stopPropagation();
                const confirmed = confirm(`確定要刪除 ${sym} 的所有持股交易紀錄嗎？`);
                if (confirmed) {
                    await deleteStockTrades(sym);
                }
            });

            portfolioBody.appendChild(row);
        });

        // 更新 Summary Cards
        // 總盈虧 = (當前市值 - 當前調整後成本) + 歷史已實現損益 + 歷史總股息
        const totalPnl = (totalMarketValue - totalCostValue) + totalRealizedPNL + totalDividendIncome;
        const totalPnlPercent = totalCostValue > 0 ? (totalPnl / totalCostValue * 100) : 0;
        const dailyPnl = totalMarketValue - totalRefMarketValue;

        totalMarketValueEl.textContent = formatNumber(totalMarketValue, 0);
        
        totalPnlEl.textContent = `${totalPnl >= 0 ? '+' : ''}${formatNumber(totalPnl, 0)}`;
        totalPnlEl.className = `text-3xl font-mono font-bold ${totalPnl >= 0 ? 'text-red-500' : 'text-green-500'}`;
        
        totalPnlPercentEl.textContent = `${totalPnlPercent.toFixed(2)}%`;
        totalPnlPercentEl.className = `text-xs mt-1 ${totalPnl >= 0 ? 'text-red-500' : 'text-green-500'}`;
        
        dailyPnlEl.textContent = `${dailyPnl >= 0 ? '+' : ''}${formatNumber(dailyPnl, 0)}`;
        dailyPnlEl.className = `text-3xl font-mono font-bold ${dailyPnl >= 0 ? 'text-red-500' : 'text-green-500'}`;

        // 🚀 新增：顯示數據來源提醒
        const sourceInfo = Object.values(quotes).some(q => q.source === 'REALTIME') ? '📡 即時報價' : '📂 盤後數據 (昨日)';
        const sourceEl = document.getElementById('price-source-indicator');
        if (sourceEl) {
            sourceEl.textContent = sourceInfo;
            sourceEl.className = `text-[10px] px-2 py-0.5 rounded-full ${sourceInfo.includes('即時') ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`;
        }
    }

    async function deleteStockTrades(symbol) {
        const trades = await db.getAllTrades();
        const remainingTrades = trades.filter(t => (t.symbol || t.stock_id || t.stockId) !== symbol);
        
        await db.clearAllTrades();
        if (remainingTrades.length > 0) {
            await db.saveTrades(remainingTrades);
        }
        
        alert(`${symbol} 的紀錄已刪除`);
        init();
    }

    function formatNumber(num, decimals = 2) {
        return new Intl.NumberFormat('zh-TW', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    }

    function getPriceColor(price, refPrice) {
        if (!price || !refPrice) return 'text-white';
        if (price > refPrice) return 'text-red-500';
        if (price < refPrice) return 'text-green-500';
        return 'text-white';
    }

    // 監聽 ready 事件 (由 auth.js 觸發)
    window.addEventListener('twstock:ready', () => {
        init();
    });

    // Expose for debugging
    window.api = api;
    window.CorporateActions = CorporateActions;

    // 檢查是否已登入
    if (localStorage.getItem('twstock_secret')) {
        init();
    }
});
