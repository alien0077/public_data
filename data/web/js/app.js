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
    const navPortfolio = document.getElementById('nav-portfolio');
    const navTrendHunter = document.getElementById('nav-trendHunter');
    const navAssetRisk = document.getElementById('nav-assetRisk');
    const navPerformance = document.getElementById('nav-performance');
    const navAddTrade = document.getElementById('nav-add-trade');
    const themeToggleBtn = document.getElementById('theme-toggle');
    
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

    // --- Theme Logic ---
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            window.ThemeEngine.toggle();
        });
    }

    // --- Navigation Logic ---
    router.init();

    // 監聽路由變化，執行特定視圖的初始化
    window.addEventListener('router:changed', (e) => {
        const { primary, secondary } = e.detail;
        
        // 切換分頁時，強制關閉個股詳情
        if (stockDetailOverlay) stockDetailOverlay.classList.add('hidden');
        currentDetailSymbol = null;

        if (primary === 'trendHunter') {
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
    });

    // 監聽資料變動事件
    window.addEventListener('twstock:data-changed', () => {
        init();
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

    if (mobileNavPortfolio) mobileNavPortfolio.addEventListener('click', () => router.switchPage('portfolio'));
    if (mobileNavTrendHunter) mobileNavTrendHunter.addEventListener('click', () => router.switchPage('trendHunter'));
    if (mobileNavFavorites) mobileNavFavorites.addEventListener('click', () => router.switchPage('favorites'));

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
                    if (Array.isArray(data.normalizedTrades)) {
                        trades = data.normalizedTrades;
                    } else if (Array.isArray(data.transactions)) {
                        trades = data.transactions;
                    } else if (Array.isArray(data)) {
                        trades = data;
                    }

                    if (trades.length > 0) {
                        await db.saveTrades(trades);
                        alert(`成功匯入 ${trades.length} 筆交易紀錄！`);
                        init();
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
            // 抓取說謊實錄
            const liarData = await api.fetchLiarData();
            renderLiarSection(liarData);

            const trades = await db.getAllTrades();
            if (trades.length > 0) {
                emptyState.classList.add('hidden');
                // 先用現有資料渲染一次 (可能沒有現價)
                renderPortfolio(trades);
                // 啟動自動刷新現價
                startAutoRefresh();
            } else {
                emptyState.classList.remove('hidden');
            }
        } catch (err) {
            // Error handling
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
        if (trades.length === 0) return;

        const holdings = calculateHoldings(trades);
        const symbols = Object.keys(holdings);
        
        try {
            const quotes = await api.fetchQuotes(symbols);
            currentQuotes = quotes;
            renderPortfolio(trades, quotes);
            
            if (currentDetailSymbol && quotes[currentDetailSymbol]) {
                updateDetailHeader(currentDetailSymbol, quotes[currentDetailSymbol]);
            }
        } catch (err) {
            console.error("fetchQuotes failed:", err);
            // Render portfolio anyway with whatever currentQuotes we have
            renderPortfolio(trades, currentQuotes || {});
        }
    }

    function calculateHoldings(trades) {
        const holdings = {};
        // 排序交易紀錄，確保按日期處理 (假設有 date 欄位)
        const sortedTrades = [...trades].sort((a, b) => new Date(a.date || a.timestamp || a.tradeDate) - new Date(b.date || b.timestamp || b.tradeDate));

        sortedTrades.forEach(t => {
            const sym = t.symbol || t.stock_id || t.stockId;
            if (!sym) return;

            if (!holdings[sym]) {
                holdings[sym] = {
                    symbol: sym,
                    name: t.name || t.stockName || '',
                    shares: 0,
                    totalCost: 0
                };
            }
            
            const rawType = (t.side || t.type || '').trim().toLowerCase();
            const qty = parseFloat(t.quantity || t.shares || 0);
            const price = parseFloat(t.price || 0);

            // 支援：買入, 買進, buy
            if (rawType === '買入' || rawType === '買進' || rawType === 'buy') {
                holdings[sym].shares += qty;
                holdings[sym].totalCost += qty * price;
            } 
            // 支援：賣出, sell
            else if (rawType === '賣出' || rawType === 'sell') {
                const avgCostBefore = holdings[sym].shares > 0 ? holdings[sym].totalCost / holdings[sym].shares : 0;
                holdings[sym].shares -= qty;
                // 賣出後按比例減少剩餘總成本
                holdings[sym].totalCost = holdings[sym].shares * avgCostBefore;
            }
        });
        
        // 過濾掉已清空的持股
        const activeHoldings = {};
        for (const sym in holdings) {
            if (holdings[sym].shares > 0.001) { // 避免浮點數殘留
                activeHoldings[sym] = holdings[sym];
            }
        }
        return activeHoldings;
    }

    function renderPortfolio(trades, quotes = {}) {
        const holdings = calculateHoldings(trades);
        portfolioBody.innerHTML = '';

        let totalMarketValue = 0;
        let totalCostValue = 0;
        let totalRefMarketValue = 0;

        const sortedSymbols = Object.keys(holdings).sort();

        sortedSymbols.forEach(sym => {
            const h = holdings[sym];
            const rawSym = sym.split('.')[0];
            const quote = quotes[sym] || quotes[rawSym] || {};
            const price = quote.price || 0;
            const refPrice = quote.referencePrice || price;
            const shares = h.shares;
            const avgCost = h.totalCost / shares;
            const marketValue = price > 0 ? (price * shares) : (avgCost * shares); // 若無現價則用成本估
            const costValue = h.totalCost;
            const pnl = price > 0 ? (marketValue - costValue) : 0;
            const pnlPercent = costValue > 0 ? (pnl / costValue * 100) : 0;
            const changePercent = (price > 0 && refPrice > 0) ? ((price - refPrice) / refPrice * 100) : 0;

            totalMarketValue += marketValue;
            totalCostValue += costValue;
            totalRefMarketValue += (refPrice > 0 ? (refPrice * shares) : marketValue);

            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-800/30 transition-colors cursor-pointer';
            row.addEventListener('click', () => StockDetail.show(sym));
            
            row.innerHTML = `
                <td class="px-3 md:px-6 py-4">
                    <div class="font-bold text-white">${h.symbol}</div>
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
                <td class="px-3 md:px-6 py-4 text-right ${pnl >= 0 ? 'text-red-500' : 'text-green-500'}">
                    <div class="font-bold">${price > 0 ? (pnl >= 0 ? '+' : '') + formatNumber(pnl, 0) : '--'}</div>
                    <div class="text-[10px] opacity-70">${price > 0 ? pnlPercent.toFixed(2) + '%' : ''}</div>
                </td>
            `;
            portfolioBody.appendChild(row);
        });

        // 更新 Summary Cards
        const totalPnl = totalMarketValue - totalCostValue;
        const totalPnlPercent = totalCostValue > 0 ? (totalPnl / totalCostValue * 100) : 0;
        const dailyPnl = totalMarketValue - totalRefMarketValue;

        totalMarketValueEl.textContent = formatNumber(totalMarketValue, 0);
        
        totalPnlEl.textContent = `${totalPnl >= 0 ? '+' : ''}${formatNumber(totalPnl, 0)}`;
        totalPnlEl.className = `text-3xl font-mono font-bold ${totalPnl >= 0 ? 'text-red-500' : 'text-green-500'}`;
        
        totalPnlPercentEl.textContent = `${totalPnlPercent.toFixed(2)}%`;
        totalPnlPercentEl.className = `text-xs mt-1 ${totalPnl >= 0 ? 'text-red-500' : 'text-green-500'}`;
        
        dailyPnlEl.textContent = `${dailyPnl >= 0 ? '+' : ''}${formatNumber(dailyPnl, 0)}`;
        dailyPnlEl.className = `text-3xl font-mono font-bold ${dailyPnl >= 0 ? 'text-red-500' : 'text-green-500'}`;
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

    // 檢查是否已登入
    if (sessionStorage.getItem('twstock_secret')) {
        init();
    }
});
