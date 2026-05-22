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
    const portfolioBody = document.getElementById('portfolio-body');
    const emptyState = document.getElementById('empty-state');
    const manualRefreshBtn = document.getElementById('manual-refresh');
    const clearPortfolioBtn = document.getElementById('clear-portfolio');
    
    const totalMarketValueEl = document.getElementById('total-market-value');
    const totalPnlEl = document.getElementById('total-pnl');
    const totalPnlPercentEl = document.getElementById('total-pnl-percent');
    const dailyPnlEl = document.getElementById('daily-pnl');

    const stockDetailOverlay = document.getElementById('stock-detail');
    const closeDetailBtn = document.getElementById('close-detail');
    const themeToggleBtn = document.getElementById('theme-toggle');

    let currentQuotes = {};
    let refreshInterval = null;

    function updateApiStatus(status, isError = false, source = 'OFFLINE') {
        const indicator = document.getElementById('status-indicator');
        const text = document.getElementById('status-text');
        const sourceBadge = document.getElementById('data-source-badge');
        if (!indicator || !text) return;
        text.textContent = status;
        indicator.className = 'w-1.5 h-1.5 rounded-full mr-2 ' + (isError ? 'bg-red-500 animate-pulse' : 'bg-green-500');
        if (sourceBadge) {
            sourceBadge.textContent = source;
            sourceBadge.className = 'px-2 py-0.5 rounded-full font-bold ' + (source.includes('REALTIME') ? 'bg-green-500/10 text-green-500' : 'bg-gray-200 dark:bg-gray-800 text-gray-500');
        }
    }

    if (themeToggleBtn) themeToggleBtn.addEventListener('click', () => window.ThemeEngine.toggle());
    try { router.init(); } catch (e) { console.error('Router init failed', e); }

    window.addEventListener('router:changed', (e) => {
        const { primary, secondary } = e.detail;
        if (stockDetailOverlay) stockDetailOverlay.classList.add('hidden');
        try {
            if (primary === 'dashboard') Dashboard.init();
            else if (primary === 'trendHunter') TrendHunter.init(secondary);
            else if (primary === 'assetRisk') AssetRisk.init(secondary);
            else if (primary === 'performance') BattleRecord.init();
            else if (primary === 'addTrade') Transaction.init();
            else if (primary === 'favorites') Favorites.init(secondary);
        } catch (err) { console.error(primary + ' view error:', err); }
    });

    window.addEventListener('twstock:data-changed', () => init());

    const bindPage = (id, p) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', (e) => { e.preventDefault(); router.switchPage(p); });
    };
    ['dashboard', 'portfolio', 'trendHunter', 'assetRisk', 'performance', 'addTrade', 'favorites'].forEach(p => {
        bindPage('nav-' + p, p);
        bindPage('mobile-nav-' + p, p);
    });

    const triggerImportBtn = document.getElementById('trigger-import');
    const importJsonInput = document.getElementById('import-json');
    if (triggerImportBtn && importJsonInput) {
        const hImp = () => importJsonInput.click();
        triggerImportBtn.addEventListener('click', hImp);
        document.getElementById('sidebar-import')?.addEventListener('click', hImp);
        document.getElementById('mobile-nav-import')?.addEventListener('click', hImp);
        importJsonInput.addEventListener('change', async (event) => {
            const file = event.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    let trades = Array.isArray(data.normalizedTrades) ? data.normalizedTrades : (Array.isArray(data.transactions) ? data.transactions : (Array.isArray(data) ? data : []));
                    if (trades.length > 0) {
                        await db.saveTrades(trades);
                        alert('成功匯入 ' + trades.length + ' 筆紀錄！');
                        currentQuotes = {}; await init(); await refreshQuotes();
                    } else alert('找不到交易紀錄。');
                } catch (err) { alert('解析 JSON 失敗。'); }
            };
            reader.readAsText(file);
        });
    }

    manualRefreshBtn && manualRefreshBtn.addEventListener('click', () => refreshQuotes());
    clearPortfolioBtn && clearPortfolioBtn.addEventListener('click', async () => {
        if (confirm('確定要清空持股紀錄嗎？')) {
            await db.clearAllTrades(); alert('已清空'); renderPortfolio([], {}); emptyState.classList.remove('hidden');
        }
    });
    closeDetailBtn && closeDetailBtn.addEventListener('click', () => stockDetailOverlay.classList.add('hidden'));

    async function init() {
        try {
            if (router.currentPrimary === 'dashboard') Dashboard.init();
            const trades = await db.getAllTrades();
            if (trades.length > 0) {
                const symbols = Array.from(new Set(trades.map(t => t.symbol || t.stock_id || t.stockId)));
                await CorporateActions.loadCorporateActions(symbols);
                emptyState.classList.add('hidden');
                renderPortfolio(trades);
                startAutoRefresh();
            } else {
                emptyState.classList.remove('hidden');
            }
        } catch (err) { console.error('Init failed:', err); }
    }

    function startAutoRefresh() {
        if (refreshInterval) clearInterval(refreshInterval);
        refreshQuotes();
        refreshInterval = setInterval(refreshQuotes, 60000);
    }

    async function refreshQuotes() {
        const trades = await db.getAllTrades();
        if (trades.length === 0) { updateApiStatus('無持股數據', false, 'IDLE'); return; }
        try {
            updateApiStatus('正在同步報價...', false, 'FETCHING');
            const ytdRef = await api.fetchYTDRef();
            const h = CorporateActions.recalculateHoldings(trades, true, ytdRef.prices);
            const q = await api.fetchQuotes(Object.keys(h).filter(k => k !== 'yearlyStats'));
            currentQuotes = q;
            updateApiStatus('報價同步成功', false, Object.values(q).some(x => x.source && x.source.includes('REALTIME')) ? 'REALTIME' : 'OFFLINE');
            renderPortfolio(trades, q);
        } catch (err) {
            updateApiStatus('同步失敗: ' + err.message, true, 'ERROR');
            renderPortfolio(trades, currentQuotes);
        }
    }

    async function renderPortfolio(trades, quotes = {}) {
        const ytdRef = await api.fetchYTDRef();
        const holdings = CorporateActions.recalculateHoldings(trades, true, ytdRef.prices);
        portfolioBody.innerHTML = '';
        let totalMV = 0, totalYtdBasis = 0, totalRefMV = 0;

        Object.keys(holdings).sort().forEach(sym => {
            if (sym === 'yearlyStats') return;
            const h = holdings[sym];
            if (h.shares <= 0.001) return;
            const q = quotes[sym] || quotes[sym.split('.')[0]] || {};
            const price = parseFloat(q.price || 0);
            const refPrice = parseFloat(q.referencePrice || price);
            const shares = parseFloat(h.shares || 0);
            const avgCost = shares > 0 ? (h.totalCost / shares) : 0;
            const mv = price > 0 ? (price * shares) : (avgCost * shares);
            
            totalMV += mv;
            totalYtdBasis += (h.ytdBasis || h.totalCost);
            totalRefMV += (refPrice > 0 ? (refPrice * shares) : mv);

            const pnl = price > 0 ? (mv - h.totalCost) : 0;
            const roi = h.totalCost > 0 ? (pnl / h.totalCost * 100) : 0;
            const pct = (price > 0 && refPrice > 0) ? ((price - refPrice) / refPrice * 100) : 0;

            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-800/30 transition-colors cursor-pointer';
            row.addEventListener('click', () => StockDetail.show(sym));
            
            row.innerHTML = '<td class="px-3 md:px-6 py-4"><div class="font-bold text-white">' + sym + '</div><div class="text-[10px] text-gray-500 truncate max-w-[100px]">' + (h.name || q.name || '') + '</div></td>' +
                '<td class="px-3 md:px-6 py-4 text-right ' + getPriceColor(price, refPrice) + '">' + (price > 0 ? formatNumber(price) : '--') + '</td>' +
                '<td class="px-3 md:px-6 py-4 text-right ' + getPriceColor(price, refPrice) + ' text-xs">' + (price > 0 ? (pct > 0 ? '▲' : (pct < 0 ? '▼' : '')) + ' ' + Math.abs(pct).toFixed(2) + '%' : '--') + '</td>' +
                '<td class="px-3 md:px-6 py-4 text-right hidden sm:table-cell">' + formatNumber(shares, 0) + '</td>' +
                '<td class="px-3 md:px-6 py-4 text-right text-gray-400 text-xs hidden sm:table-cell">' + formatNumber(avgCost) + '</td>' +
                '<td class="px-3 md:px-6 py-4 text-right font-bold text-blue-400 hidden md:table-cell">' + formatNumber(mv, 0) + '</td>' +
                '<td class="px-3 md:px-6 py-4 text-right ' + (pnl >= 0 ? 'text-red-500' : 'text-green-500') + '"><div class="font-bold">' + (pnl >= 0 ? '+' : '') + formatNumber(pnl, 0) + '</div><div class="text-[10px] opacity-70">' + roi.toFixed(2) + '% (未實現)</div></td>' +
                '<td class="px-3 md:px-6 py-4 text-right"><button class="delete-stock p-2 text-gray-500 hover:text-red-500"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></td>';
            
            row.querySelector('.delete-stock').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteStockTrades(sym);
            });
            
            portfolioBody.appendChild(row);
        });

        const curY = new Date().getFullYear().toString();
        const yS = (holdings.yearlyStats && holdings.yearlyStats[curY]) || { realizedPNL: 0, dividend: 0, ytdRealizedPNL: 0 };
        
        const ytdUnrealized = (isNaN(totalMV) || isNaN(totalYtdBasis)) ? 0 : (totalMV - totalYtdBasis);
        const totalPnl = ytdUnrealized + (yS.ytdRealizedPNL || 0) + (yS.dividend || 0);
        const totalPnlPercent = totalYtdBasis > 0 ? (totalPnl / totalYtdBasis * 100) : 0;
        const dPnl = isNaN(totalMV) || isNaN(totalRefMV) ? 0 : (totalMV - totalRefMV);

        totalMarketValueEl.textContent = formatNumber(totalMV, 0);
        totalPnlEl.textContent = (totalPnl >= 0 ? '+' : '') + formatNumber(totalPnl, 0);
        totalPnlEl.className = 'text-3xl font-mono font-bold ' + (totalPnl >= 0 ? 'text-red-500' : 'text-green-500');
        totalPnlPercentEl.textContent = totalPnlPercent.toFixed(2) + '%';
        totalPnlPercentEl.className = 'text-xs mt-1 ' + (totalPnl >= 0 ? 'text-red-500' : 'text-green-500');
        dailyPnlEl.textContent = (dPnl >= 0 ? '+' : '') + formatNumber(dPnl, 0);
        dailyPnlEl.className = 'text-3xl font-mono font-bold ' + (dPnl >= 0 ? 'text-red-500' : 'text-green-500');
        const pt = document.querySelector('#total-pnl')?.previousElementSibling;
        if (pt) pt.textContent = '今年度總盈虧 (' + curY + ')';
    }

    async function deleteStockTrades(symbol) {
        if (!confirm('確定要刪除 ' + symbol + ' 的紀錄嗎？')) return;
        const trades = await db.getAllTrades();
        const filtered = trades.filter(t => (t.symbol || t.stock_id || t.stockId) !== symbol);
        await db.clearAllTrades();
        if (filtered.length > 0) await db.saveTrades(filtered);
        init();
    }

    function formatNumber(num, decimals = 2) {
        const n = parseFloat(num);
        if (isNaN(n)) return '--';
        return new Intl.NumberFormat('zh-TW', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
    }
    function getPriceColor(p, r) {
        if (!p || !r) return 'text-white';
        return p > r ? 'text-red-500' : (p < r ? 'text-green-500' : 'text-white');
    }
    window.addEventListener('twstock:ready', () => init());
    window.api = api; window.db = db; window.CorporateActions = CorporateActions;
    if (localStorage.getItem('twstock_secret')) init();
});