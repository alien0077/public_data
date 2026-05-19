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
    tabs: ['走勢', 'K線', '健檢', '新聞', '盤面', '基本', '營收', '獲利', '股利', '大股東', '圖表', '明細'],

    async show(symbol) {
        this.currentSymbol = symbol;
        const overlay = document.getElementById('stock-detail');
        if (!overlay) return;

        overlay.classList.remove('hidden');
        
        // 抓取說謊偵測數據並渲染警告標籤
        const liarData = await api.fetchLiarData();
        this.renderLiarWarning(liarData);

        this.renderTabs();
        this.switchTab(this.currentTab);
        
        // Update header info (might need to fetch quote if not available)
        const detailSymbolEl = document.getElementById('detail-symbol');
        if (detailSymbolEl) detailSymbolEl.textContent = symbol;
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
            api.fetchChart(this.currentSymbol),
            api.fetchStructure(this.currentSymbol),
            db.getAllTrades()
        ]);
        
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
