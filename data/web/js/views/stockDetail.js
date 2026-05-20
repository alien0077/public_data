/**
 * Stock Detail Workstation Module
 * Handles the 12-tab analysis view for a specific stock
 */
import { api } from '../api.js';
import { charts } from '../charts.js';
import { db } from '../db.js';

export const StockDetail = {
    currentSymbol: null,
    currentTab: 'K線',
    tabs: ['走勢', 'K線', '健檢', '盤面', '營收', '獲利', '股利', '大股東', '明細'], // 隱藏未開發的: '新聞', '基本', '圖表'

    async show(symbol) {
        this.currentSymbol = symbol;
        const overlay = document.getElementById('stock-detail');
        if (!overlay) return;

        overlay.classList.remove('hidden');
        
        // 抓取說謊偵測數據並渲染警告標籤
        let liarData = null;
        try {
            liarData = await api.fetchLiarData();
        } catch(e) {
            console.warn("fetchLiarData failed, using fallback:", e);
        }
        this.renderLiarWarning(liarData);

        this.renderTabs();
        this.switchTab(this.currentTab);
        
        // Update header info (might need to fetch quote if not available)
        const detailSymbolEl = document.getElementById('detail-symbol');
        if (detailSymbolEl) detailSymbolEl.textContent = symbol;

        this.updateFavoriteUI();
        
        // Bind favorite toggle (only once, avoid duplicate bindings)
        const toggleBtn = document.getElementById('toggle-favorite-btn');
        if (toggleBtn) {
            // Remove old listeners by cloning
            const newBtn = toggleBtn.cloneNode(true);
            toggleBtn.parentNode.replaceChild(newBtn, toggleBtn);
            
            newBtn.addEventListener('click', () => {
                if (window.Favorites) {
                    const result = window.Favorites.toggleFavorite(this.currentSymbol);
                    this.updateFavoriteUI();
                    // Optional: show small toast or alert
                    console.log(`Favorite toggled: ${result.action} in ${result.category}`);
                }
            });
        }
    },

    updateFavoriteUI() {
        const toggleBtn = document.getElementById('toggle-favorite-btn');
        if (!toggleBtn) return;
        
        if (window.Favorites && window.Favorites.isFavorite(this.currentSymbol)) {
            toggleBtn.classList.add('text-red-500');
            toggleBtn.classList.remove('text-gray-300');
        } else {
            toggleBtn.classList.remove('text-red-500');
            toggleBtn.classList.add('text-gray-300');
        }
    },

    renderLiarWarning(data) {
        let warningContainer = document.getElementById('liar-warning-container');
        if (!warningContainer) {
            warningContainer = document.createElement('div');
            warningContainer.id = 'liar-warning-container';
            const header = document.querySelector('#stock-detail header');
            header.after(warningContainer);
        }

        const liar = data?.data?.find(item => item.stockId === this.currentSymbol);
        if (liar) {
            warningContainer.innerHTML = `
                <div class="m-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center shadow-sm">
                    <div class="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center mr-4 flex-none">
                        <span class="text-white text-lg font-bold">!</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between items-center mb-1">
                            <h4 class="text-red-500 font-bold text-sm">🚨 外資誠實度嚴重警告！</h4>
                            <span class="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded font-bold">說謊指數: ${liar.lyingScore}</span>
                        </div>
                        <p class="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                            ${liar.brokerName}喊多本股至 <span class="font-bold text-red-500">${liar.targetPrice}</span> 元，但近日分點私下狂${liar.netVolume < 0 ? '倒貨' : '吸籌'} <span class="font-bold text-blue-500">${Math.abs(liar.netVolume)}</span> 張！
                        </p>
                    </div>
                </div>
            `;
        } else {
            warningContainer.innerHTML = '';
        }
    },

    renderTabs() {
        const header = document.querySelector('#stock-detail header');
        const warning = document.getElementById('liar-warning-container');
        let tabContainer = document.getElementById('detail-tabs');
        
        if (!tabContainer) {
            tabContainer = document.createElement('div');
            tabContainer.id = 'detail-tabs';
            tabContainer.className = 'flex overflow-x-auto border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f1115] no-scrollbar';
            
            // 如果有警告標籤，放在警告標籤後面，否則放在 header 後面
            if (warning) {
                warning.after(tabContainer);
            } else {
                header.after(tabContainer);
            }
        }

        tabContainer.innerHTML = this.tabs.map(tab => `
            <button class="flex-none px-6 py-3 text-sm font-medium transition-colors ${this.currentTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}"
                    onclick="window.StockDetail.switchTab('${tab}')">
                ${tab}
            </button>
        `).join('');
    },

    async switchTab(tab) {
        this.currentTab = tab;
        this.renderTabs();
        
        const contentContainer = document.querySelector('#stock-detail .flex-1');
        contentContainer.innerHTML = '<div class="flex items-center justify-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>';

        try {
            switch (tab) {
                case 'K線':
                    await this.renderKLineTab(contentContainer);
                    break;
                case '健檢':
                    await this.renderHealthTab(contentContainer);
                    break;
                case '盤面':
                    await this.renderMarketTab(contentContainer);
                    break;
                case '營收':
                    await this.renderFinancialTab(contentContainer, 'monthly', '營收分析');
                    break;
                case '獲利':
                    await this.renderFinancialTab(contentContainer, 'quarterly', '獲利能力');
                    break;
                case '股利':
                    await this.renderFinancialTab(contentContainer, 'dividends', '股利政策');
                    break;
                case '大股東':
                    await this.renderShareholderTab(contentContainer);
                    break;
                case '明細':
                    await this.renderTradesTab(contentContainer);
                    break;
                default:
                    contentContainer.innerHTML = `<div class="flex items-center justify-center h-full text-gray-500">${tab} 模組開發中...</div>`;
            }
        } catch (err) {
            contentContainer.innerHTML = `<div class="flex items-center justify-center h-full text-red-500">載入失敗: ${err.message}</div>`;
        }
    },

    async renderKLineTab(container) {
        container.innerHTML = `
            <div class="flex-1 flex flex-col h-full">
                <div id="detail-chart-container" class="w-full flex-1"></div>
            </div>
        `;
        
        charts.init('detail-chart-container');
        const [chartData, structureData, trades] = await Promise.all([
            api.fetchChart(this.currentSymbol).catch(e => { console.warn("fetchChart failed:", e); return null; }),
            api.fetchStructure(this.currentSymbol).catch(e => { console.warn("fetchStructure failed:", e); return null; }),
            db.getAllTrades().catch(e => { console.warn("getAllTrades failed:", e); return []; })
        ]);
        
        if (!chartData) {
            const containerDom = document.getElementById('detail-chart-container');
            if (containerDom) {
                containerDom.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full space-y-2 py-12 text-center">
                        <svg class="w-12 h-12 text-gray-300 dark:text-gray-700 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <div class="text-gray-500 dark:text-gray-400 font-bold">暫無 K 線歷史數據</div>
                        <div class="text-xs text-gray-450 dark:text-gray-550 max-w-xs">請檢查網路連線或 API Key 是否正確。地端離線模式下可能無此個股之歷史 K 線檔案。</div>
                    </div>
                `;
            }
            return;
        }
        
        charts.renderKLine(this.currentSymbol, chartData, trades, structureData);
    },

    async renderFinancialTab(container, type, title) {
        const data = await api.fetchFinancials(this.currentSymbol, type);
        if (!data) {
            container.innerHTML = `<div class="p-8 text-center text-gray-500">暫無${title}數據</div>`;
            return;
        }

        container.innerHTML = `
            <div class="p-4 space-y-6">
                <h3 class="text-lg font-bold">${title} - ${this.currentSymbol}</h3>
                <div class="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                    <table class="w-full text-sm text-left">
                        <thead class="bg-gray-50 dark:bg-gray-800 text-gray-500">
                            <tr>
                                <th class="px-4 py-3">期間</th>
                                <th class="px-4 py-3 text-right">數值</th>
                                <th class="px-4 py-3 text-right">YoY</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                            ${(data.data || []).map(item => `
                                <tr>
                                    <td class="px-4 py-3 font-mono">${item.date || item.period}</td>
                                    <td class="px-4 py-3 text-right font-mono">${this.formatValue(item.value)}</td>
                                    <td class="px-4 py-3 text-right font-mono ${parseFloat(item.yoy) >= 0 ? 'text-red-500' : 'text-green-500'}">
                                        ${item.yoy ? (parseFloat(item.yoy) > 0 ? '+' : '') + item.yoy + '%' : '--'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    async renderShareholderTab(container) {
        const data = await api.fetchShareholders(this.currentSymbol);
        if (!data) {
            container.innerHTML = `<div class="p-8 text-center text-gray-500">暫無大股東數據</div>`;
            return;
        }

        container.innerHTML = `
            <div class="p-4 space-y-6">
                <h3 class="text-lg font-bold">股權分佈 - ${this.currentSymbol}</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${(data.recent || []).map(item => `
                        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div class="text-xs text-gray-500 mb-1">${item.date}</div>
                            <div class="flex justify-between items-end">
                                <div>
                                    <div class="text-lg font-bold">${item.percentage}%</div>
                                    <div class="text-[10px] text-gray-400">大股東持股比例</div>
                                </div>
                                <div class="text-right">
                                    <div class="text-sm ${parseFloat(item.diff) >= 0 ? 'text-red-500' : 'text-green-500'}">
                                        ${parseFloat(item.diff) > 0 ? '▲' : '▼'} ${Math.abs(item.diff)}%
                                    </div>
                                    <div class="text-[10px] text-gray-400">週變動</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    async renderTradesTab(container) {
        const trades = await db.getAllTrades();
        const relevantTrades = trades.filter(t => (t.symbol || t.stock_id) === this.currentSymbol)
                                    .sort((a, b) => new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp));

        container.innerHTML = `
            <div class="p-4">
                <h3 class="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">歷史交易明細</h3>
                <div class="space-y-2">
                    ${relevantTrades.map(t => {
                        const date = new Date(t.date || t.timestamp).toLocaleDateString();
                        const type = (t.side || t.type || '').toLowerCase();
                        const isBuy = type.includes('買') || type.includes('buy');
                        return `
                            <div class="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl flex justify-between items-center border border-gray-100 dark:border-gray-800">
                                <div>
                                    <div class="text-xs text-gray-500">${date}</div>
                                    <div class="font-bold ${isBuy ? 'text-red-500' : 'text-green-500'}">${isBuy ? '買入' : '賣出'}</div>
                                </div>
                                <div class="text-right">
                                    <div class="font-mono font-bold">${this.formatValue(t.quantity || t.shares, 0)} 股</div>
                                    <div class="text-xs text-gray-400">@ ${this.formatValue(t.price)}</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    async renderHealthTab(container) {
        const data = await api.fetchHealthData(this.currentSymbol);
        if (!data) {
            container.innerHTML = `<div class="p-8 text-center text-gray-500">暫無健檢數據</div>`;
            return;
        }

        const scoreColor = data.score >= 100 ? 'text-green-500 border-green-500' : 'text-yellow-500 border-yellow-500';
        
        container.innerHTML = `
            <div class="p-4 space-y-6">
                <!-- Score Card -->
                <div class="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div class="w-32 h-32 rounded-full border-8 ${scoreColor} flex flex-col items-center justify-center bg-white dark:bg-[#0f1115]">
                        <span class="text-4xl font-bold">${data.score}</span>
                        <span class="text-xs text-gray-500">健康分</span>
                    </div>
                    <div class="flex-1 ml-6 space-y-3">
                        <div class="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg w-fit">
                            <span class="text-green-500">💚</span>
                            <span class="text-sm text-gray-500 dark:text-gray-400">健康度:</span>
                            <span class="text-sm font-bold text-green-500">${data.health_status}</span>
                        </div>
                        <div class="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg w-fit">
                            <span class="text-yellow-500">⚠️</span>
                            <span class="text-sm text-gray-500 dark:text-gray-400">風險度:</span>
                            <span class="text-sm font-bold text-yellow-500">${data.risk_level}</span>
                        </div>
                        <div class="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg w-fit">
                            <span class="text-orange-500">⚡</span>
                            <span class="text-sm text-gray-500 dark:text-gray-400">操作建議:</span>
                            <span class="text-sm font-bold text-orange-500">${data.advice}</span>
                        </div>
                    </div>
                </div>

                <!-- Profit Progress -->
                <div class="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                    <div class="text-xs text-gray-500 mb-2">獲利進度盤 (目標 +25% / 停損 -10%)</div>
                    <div class="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 mb-1 relative">
                        <div class="bg-green-500 h-2 rounded-full absolute left-[30%] w-[40%]"></div>
                        <div class="absolute w-3 h-3 bg-white border-2 border-green-500 rounded-full top-[-2px] left-[70%]"></div>
                    </div>
                    <div class="flex justify-between text-[10px] text-gray-400">
                        <span>SL -10%</span>
                        <span>TP 25%</span>
                    </div>
                </div>

                <!-- AI Summary -->
                <div class="bg-purple-50 dark:bg-purple-900/10 rounded-2xl p-6 border border-purple-100 dark:border-purple-800/30">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-bold text-purple-700 dark:text-purple-400 flex items-center">
                            <span class="mr-2">✨</span> AI 持股健檢
                        </h3>
                        <button class="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1 rounded-full">啟動 AI 解讀</button>
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">${data.ai_summary}</p>
                </div>
            </div>
        `;
    },

    async renderMarketTab(container) {
        const data = await api.fetchIntradayMarket(this.currentSymbol);
        if (!data) {
            container.innerHTML = `<div class="p-8 text-center text-gray-500">暫無盤面數據</div>`;
            return;
        }

        const metrics = data.metrics;
        container.innerHTML = `
            <div class="p-4 space-y-6">
                <!-- Realtime Metrics -->
                <div>
                    <h3 class="text-orange-500 font-bold flex items-center mb-4">
                        <span class="mr-2">⏱️</span> 即時盤面指標
                    </h3>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div class="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                            <span class="text-xs text-green-500 mb-1">↓ 外盤比</span>
                            <span class="text-lg font-bold text-green-500">${metrics.outer_ratio}%</span>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                            <span class="text-xs text-orange-400 mb-1">📈 振幅</span>
                            <span class="text-lg font-bold text-orange-400">${metrics.amplitude}%</span>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                            <span class="text-xs text-blue-400 mb-1">📋 成交筆數</span>
                            <span class="text-lg font-bold text-blue-400">${(metrics.trades_count / 10000).toFixed(1)}萬</span>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                            <span class="text-xs text-cyan-500 mb-1">📦 最新量</span>
                            <span class="text-lg font-bold text-cyan-500">${metrics.latest_volume}張</span>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                            <span class="text-xs text-purple-400 mb-1">💵 成交額</span>
                            <span class="text-lg font-bold text-purple-400">${metrics.turnover}億</span>
                        </div>
                    </div>
                </div>

                <!-- Price Volume Profile -->
                <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-orange-500 font-bold flex items-center">
                            <span class="mr-2">📊</span> 分價量表
                        </h3>
                    </div>
                    <div class="flex justify-between text-xs mb-2">
                        <span class="text-red-500">● 外盤 (買) ${metrics.outer_ratio}%</span>
                        <span class="text-green-500">${(100 - metrics.outer_ratio).toFixed(1)}% (賣) 內盤 ●</span>
                    </div>
                    <div class="w-full h-1 bg-gray-200 dark:bg-gray-800 flex mb-4">
                        <div class="h-full bg-red-500" style="width: ${metrics.outer_ratio}%"></div>
                        <div class="h-full bg-green-500" style="width: ${100 - metrics.outer_ratio}%"></div>
                    </div>
                    <div class="space-y-1">
                        <div class="flex justify-between text-xs text-gray-400 mb-2">
                            <span>價格</span>
                            <span>成交量(張)</span>
                        </div>
                        ${data.price_volume.map(pv => {
                            const maxVol = Math.max(...data.price_volume.map(v => v.volume));
                            const wOuter = (pv.outer_vol / maxVol) * 70; // 70% max width
                            const wInner = (pv.inner_vol / maxVol) * 70;
                            return `
                                <div class="flex justify-between items-center text-sm">
                                    <span class="text-red-500 w-12 font-mono">${pv.price}</span>
                                    <div class="flex-1 flex px-2 h-4">
                                        <div class="bg-red-500/80 h-full" style="width: ${wOuter}%"></div>
                                        <div class="bg-green-500/80 h-full" style="width: ${wInner}%"></div>
                                    </div>
                                    <span class="text-gray-500 dark:text-gray-300 w-12 text-right font-mono">${pv.volume}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    formatValue(val, decimals = 2) {
        if (val === undefined || val === null) return '--';
        return new Intl.NumberFormat('zh-TW', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(val);
    }
};

// Global access for onclick handlers
window.StockDetail = StockDetail;
