/**
 * Asset & Risk View Module
 * Handles rendering of all Asset & Risk sub-pages
 */
import { db } from '../db.js';
import { api } from '../api.js';

export const AssetRisk = {
    subPageConfigs: {
        '配置': {
            title: '資產配置分析',
            description: '分析您的持股分佈，包括產業集中度與個股權重。',
            sideTitle: '配置建議',
            sideContent: '多元化配置能有效分散系統性風險。建議單一產業佔比不超過 30%，單一個股佔比不超過 15%。'
        },
        '風險': {
            title: '風險壓力測試',
            description: '評估投資組合在極端市場波動下的潛在回撤與波動率。',
            sideTitle: '指標說明',
            sideContent: '波動率反映了資產價格的變動程度；最大回撤 (MDD) 則顯示了從高點跌落的最深幅度。'
        },
        '現金流': {
            title: '預期現金流',
            description: '基於除權息資訊，預估未來一年的股利收入。',
            sideTitle: '配息提醒',
            sideContent: '殖利率不代表總報酬，應同時關注公司基本面與扣抵稅額相關規範。'
        },
        '績效': {
            title: '績效歸因分析',
            description: '對比大盤指數，分析超額報酬 (Alpha) 的來源。',
            sideTitle: '對標基準',
            sideContent: '通常以台股加權指數 (TAIEX) 或 0050 作為績效對比基準。'
        },
        '模擬': {
            title: '投資組合模擬',
            description: '模擬調整權重後，對整體組合風險與報酬的預期影響。',
            sideTitle: '模擬工具',
            sideContent: '您可以嘗試調高穩健型資產比例，觀察組合夏普值 (Sharpe Ratio) 的變化。'
        }
    },

    init(subPage) {
        console.log('AssetRisk initializing subPage:', subPage);
        const container = document.getElementById('view-assetRisk');
        if (!container) {
            console.error('view-assetRisk container not found');
            return;
        }

        // Ensure container is visible
        container.classList.remove('hidden');
        
        // Render the layout
        this.renderLayout(container, subPage);
        
        // Initialize specific logic
        this.initSubPageLogic(subPage);
    },

    renderLayout(container, subPage) {
        const config = this.subPageConfigs[subPage] || {
            title: subPage,
            description: '模組開發中...',
            sideTitle: '資訊說明',
            sideContent: '此模組 the 數據載入中...'
        };

        container.innerHTML = `
            <div class="flex flex-col space-y-4 mb-6">
                <div class="flex justify-between items-end">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">${config.title}</h2>
                        <p class="text-gray-500 mt-1">${config.description}</p>
                    </div>
                    <div class="text-xs text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                        Update: ${new Date().toLocaleDateString()}
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <!-- Main Content Area (2/3 width on PC) -->
                <div class="xl:col-span-2 space-y-6">
                    <div id="asset-risk-main-content" class="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                        ${this.getMainContentPlaceholder(subPage)}
                    </div>
                </div>

                <!-- Side Panel (1/3 width on PC) -->
                <div class="space-y-6">
                    <!-- Info Card -->
                    <div class="bg-white dark:bg-[#161b22] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <h3 class="font-bold text-lg mb-4 flex items-center text-gray-900 dark:text-white">
                            <span class="mr-2">📊</span> ${config.sideTitle}
                        </h3>
                        <div class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            ${config.sideContent}
                        </div>
                    </div>

                    <!-- Risk Metric Card -->
                    <div class="bg-gradient-to-br from-purple-600 to-blue-700 p-6 rounded-2xl text-white shadow-lg shadow-blue-900/20">
                        <h3 class="font-bold mb-2 flex items-center text-white">
                            <span class="mr-2">🛡️</span> 風險指標
                        </h3>
                        <p class="text-xs text-blue-100 mb-4 opacity-80">Portfolio Health Score</p>
                        <div class="flex items-center justify-between">
                            <div class="text-3xl font-bold">健康</div>
                            <div class="text-right">
                                <div class="text-xl font-mono">82</div>
                                <div class="text-[10px] text-blue-200">Diversity Score</div>
                            </div>
                        </div>
                        <div class="mt-4 h-1.5 bg-blue-900/30 rounded-full overflow-hidden">
                            <div class="h-full bg-white w-[82%] rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">分析工具</h4>
                        <div class="grid grid-cols-2 gap-3">
                            <button class="p-2 text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors">
                                風險診斷
                            </button>
                            <button class="p-2 text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors">
                                下載 PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    getMainContentPlaceholder(subPage) {
        const chartId = subPage === '配置' ? 'allocation-chart' : (subPage === '現金流' ? 'cashflow-chart' : 'asset-risk-chart');
        
        if (['配置', '現金流', '風險'].includes(subPage)) {
            return `
                <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                    <span class="text-sm font-bold text-gray-900 dark:text-white">視覺化分析</span>
                    <div class="flex space-x-2">
                        <div class="text-[10px] text-gray-400">數據動態處理中...</div>
                    </div>
                </div>
                <div id="${chartId}" class="flex-1 flex items-center justify-center p-8">
                    <div class="text-center">
                        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                        <p class="text-gray-500">正在準備數據與圖表組件...</p>
                    </div>
                </div>
            `;
        }

        // Default Table
        return `
            <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 class="font-bold text-gray-900 dark:text-white">明細數據</h3>
            </div>
            <div class="flex-1 overflow-x-auto">
                <table class="w-full text-left">
                    <thead class="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 dark:text-gray-500 text-xs uppercase">
                        <tr>
                            <th class="px-6 py-4">分析維度</th>
                            <th class="px-6 py-4 text-right">當前值</th>
                            <th class="px-6 py-4 text-right">基準值</th>
                            <th class="px-6 py-4 text-right">狀態</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-800 font-mono text-sm text-gray-400">
                        ${Array(8).fill(0).map((_, i) => `
                            <tr>
                                <td class="px-6 py-4">
                                    <div class="w-32 h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <div class="w-16 h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse ml-auto"></div>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <div class="w-16 h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse ml-auto"></div>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <div class="w-12 h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse ml-auto"></div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    initSubPageLogic(subPage) {
        console.log(`AssetRisk subPage ${subPage} logic triggered`);
        const mainContent = document.getElementById('asset-risk-main-content');
        if (!mainContent) {
            console.error('asset-risk-main-content not found');
            return;
        }

        if (subPage === '配置') {
            this.initAllocation(mainContent);
        } else if (subPage === '風險') {
            this.initRisk(mainContent);
        } else if (subPage === '現金流') {
            this.initCashflow(mainContent);
        } else if (subPage === '績效') {
            mainContent.innerHTML = `<div class="flex items-center justify-center h-full p-12 text-gray-500"><div class="text-center"><span class="text-4xl block mb-4">📈</span>此功能尚在開發中 (績效歸因分析)</div></div>`;
        } else if (subPage === '模擬') {
            mainContent.innerHTML = `<div class="flex items-center justify-center h-full p-12 text-gray-500"><div class="text-center"><span class="text-4xl block mb-4">🧪</span>此功能尚在開發中 (投資組合模擬)</div></div>`;
        }
    },

    calculateHoldings(trades) {
        const holdings = {};
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

            if (rawType === '買入' || rawType === '買進' || rawType === 'buy') {
                holdings[sym].shares += qty;
                holdings[sym].totalCost += qty * price;
            } else if (rawType === '賣出' || rawType === 'sell') {
                const avgCostBefore = holdings[sym].shares > 0 ? holdings[sym].totalCost / holdings[sym].shares : 0;
                holdings[sym].shares -= qty;
                holdings[sym].totalCost = holdings[sym].shares * avgCostBefore;
            }
        });
        
        const activeHoldings = {};
        for (const sym in holdings) {
            if (holdings[sym].shares > 0.001) {
                activeHoldings[sym] = holdings[sym];
            }
        }
        return activeHoldings;
    },

    formatNumber(val, decimals = 2) {
        if (val === undefined || val === null || isNaN(val)) return '--';
        return new Intl.NumberFormat('zh-TW', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(val);
    },

    async initAllocation(container) {
        try {
            const trades = await db.getAllTrades();
            if (!trades || trades.length === 0) {
                container.innerHTML = `
                    <div class="flex-1 flex items-center justify-center p-8 text-center text-gray-500">
                        <div>
                            <span class="text-4xl block mb-2">📂</span>
                            暫無交易紀錄，請先至交易分頁新增交易。
                        </div>
                    </div>`;
                return;
            }

            const holdings = this.calculateHoldings(trades);
            const symbols = Object.keys(holdings);
            if (symbols.length === 0) {
                container.innerHTML = `
                    <div class="flex-1 flex items-center justify-center p-8 text-center text-gray-500">
                        <div>
                            <span class="text-4xl block mb-2">📂</span>
                            當前無庫存持股。
                        </div>
                    </div>`;
                return;
            }

            const [quotes, stocksMeta] = await Promise.all([
                api.fetchQuotes(symbols).catch(err => {
                    console.warn("fetchQuotes failed in initAllocation, using fallback:", err);
                    return {};
                }),
                api.fetchLocalJson('meta/stocks.json').catch(() => ({ stocks: [] }))
            ]);

            const stockMap = {};
            if (stocksMeta && Array.isArray(stocksMeta.stocks)) {
                stocksMeta.stocks.forEach(s => {
                    stockMap[s.symbol] = s;
                });
            }

            let totalMarketValue = 0;
            const processedHoldings = symbols.map(sym => {
                const h = holdings[sym];
                const quote = quotes[sym] || {};
                const price = quote.price || (h.totalCost / h.shares);
                const marketValue = price * h.shares;
                totalMarketValue += marketValue;

                const meta = stockMap[sym] || {};
                const name = quote.name || meta.name || h.name || sym;
                const industry = meta.industry || meta.sector || '其他';

                return {
                    symbol: sym,
                    name,
                    shares: h.shares,
                    avgCost: h.totalCost / h.shares,
                    price,
                    marketValue,
                    industry
                };
            });

            processedHoldings.sort((a, b) => b.marketValue - a.marketValue);

            const stockWeights = [];
            const industryWeightsMap = {};

            processedHoldings.forEach(item => {
                const weight = totalMarketValue > 0 ? (item.marketValue / totalMarketValue * 100) : 0;
                item.weight = weight;
                
                stockWeights.push({
                    name: `${item.symbol} ${item.name}`,
                    value: item.marketValue,
                    weight: weight
                });

                if (!industryWeightsMap[item.industry]) {
                    industryWeightsMap[item.industry] = 0;
                }
                industryWeightsMap[item.industry] += item.marketValue;
            });

            const industryWeights = Object.keys(industryWeightsMap).map(ind => {
                const val = industryWeightsMap[ind];
                const weight = totalMarketValue > 0 ? (val / totalMarketValue * 100) : 0;
                return {
                    name: ind,
                    value: val,
                    weight: weight
                };
            }).sort((a, b) => b.value - a.value);

            container.innerHTML = `
                <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                    <span class="text-sm font-bold text-gray-900 dark:text-white font-sans">持股比例與產業分佈</span>
                    <div class="flex space-x-2">
                        <button id="btn-toggle-stock" class="px-3 py-1 text-xs font-bold rounded-lg bg-blue-500 text-white transition-colors">個股配置</button>
                        <button id="btn-toggle-industry" class="px-3 py-1 text-xs font-bold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors">產業配置</button>
                    </div>
                </div>
                
                <div id="allocation-chart-inner" class="w-full h-80"></div>
                
                <div class="border-t border-gray-100 dark:border-gray-800 flex-1 overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead class="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 dark:text-gray-500 text-xs uppercase">
                            <tr>
                                <th class="px-6 py-4">個股</th>
                                <th class="px-6 py-4">產業</th>
                                <th class="px-6 py-4 text-right">現價 / 均價</th>
                                <th class="px-6 py-4 text-right">股數</th>
                                <th class="px-6 py-4 text-right">市值</th>
                                <th class="px-6 py-4 text-right">比例</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-800 font-mono text-gray-700 dark:text-gray-300">
                            ${processedHoldings.map(item => `
                                <tr class="hover:bg-gray-800/30 transition-colors cursor-pointer" onclick="window.StockDetail.show('${item.symbol}')">
                                    <td class="px-6 py-4">
                                        <div class="font-bold text-gray-900 dark:text-white">${item.symbol}</div>
                                        <div class="text-[10px] text-gray-500">${item.name}</div>
                                    </td>
                                    <td class="px-6 py-4 text-xs text-gray-650 dark:text-gray-450">${item.industry}</td>
                                    <td class="px-6 py-4 text-right">
                                        <div class="font-bold text-gray-900 dark:text-white">${this.formatNumber(item.price)}</div>
                                        <div class="text-[10px] text-gray-400">@ ${this.formatNumber(item.avgCost)}</div>
                                    </td>
                                    <td class="px-6 py-4 text-right">${this.formatNumber(item.shares, 0)}</td>
                                    <td class="px-6 py-4 text-right text-blue-600 dark:text-blue-400 font-bold">${this.formatNumber(item.marketValue, 0)}</td>
                                    <td class="px-6 py-4 text-right">
                                        <div class="inline-block px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold">
                                            ${item.weight.toFixed(2)}%
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            setTimeout(() => {
                const chartDom = document.getElementById('allocation-chart-inner');
                if (!chartDom) return;
                const isDark = document.documentElement.classList.contains('dark');
                const myChart = echarts.init(chartDom, isDark ? 'dark' : null);

                const renderChart = (data, name) => {
                    const option = {
                        backgroundColor: 'transparent',
                        tooltip: {
                            trigger: 'item',
                            formatter: '{b}<br/>市值: {c} 元 ({d}%)'
                        },
                        legend: {
                            type: 'scroll',
                            orient: 'vertical',
                            right: 10,
                            top: 20,
                            bottom: 20,
                            textStyle: { color: isDark ? '#ccc' : '#333' }
                        },
                        series: [
                            {
                                name: name,
                                type: 'pie',
                                radius: ['35%', '65%'],
                                center: ['40%', '50%'],
                                avoidLabelOverlap: true,
                                itemStyle: {
                                    borderRadius: 8,
                                    borderColor: isDark ? '#161b22' : '#fff',
                                    borderWidth: 2
                                },
                                label: {
                                    show: false,
                                    position: 'center'
                                },
                                emphasis: {
                                    label: {
                                        show: true,
                                        fontSize: 16,
                                        fontWeight: 'bold',
                                        formatter: '{b}\n{d}%',
                                        color: isDark ? '#fff' : '#000'
                                    }
                                },
                                labelLine: {
                                    show: false
                                },
                                data: data
                            }
                        ]
                    };
                    myChart.setOption(option);
                    myChart.resize();
                };

                renderChart(stockWeights, '個股配置');

                const btnStock = document.getElementById('btn-toggle-stock');
                const btnIndustry = document.getElementById('btn-toggle-industry');

                if (btnStock && btnIndustry) {
                    btnStock.addEventListener('click', () => {
                        btnStock.className = "px-3 py-1 text-xs font-bold rounded-lg bg-blue-500 text-white transition-colors";
                        btnIndustry.className = "px-3 py-1 text-xs font-bold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors";
                        renderChart(stockWeights, '個股配置');
                    });

                    btnIndustry.addEventListener('click', () => {
                        btnIndustry.className = "px-3 py-1 text-xs font-bold rounded-lg bg-blue-500 text-white transition-colors";
                        btnStock.className = "px-3 py-1 text-xs font-bold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors";
                        renderChart(industryWeights, '產業配置');
                    });
                }

                window.addEventListener('resize', () => myChart.resize());
            }, 50);

        } catch (err) {
            console.error('Error rendering allocation view:', err);
            container.innerHTML = `<div class="p-8 text-center text-red-500">載入配置數據失敗: ${err.message}</div>`;
        }
    },

    async initRisk(container) {
        try {
            const trades = await db.getAllTrades();
            if (!trades || trades.length === 0) {
                container.innerHTML = `<div class="flex-1 flex items-center justify-center p-8 text-center text-gray-500">暫無交易紀錄，無法進行風險評估。</div>`;
                return;
            }

            const holdings = this.calculateHoldings(trades);
            const symbols = Object.keys(holdings);
            if (symbols.length === 0) {
                container.innerHTML = `<div class="flex-1 flex items-center justify-center p-8 text-center text-gray-500">當前無持股。</div>`;
                return;
            }

            let quotes = {};
            try {
                quotes = await api.fetchQuotes(symbols) || {};
            } catch(e) {
                console.warn("fetchQuotes failed in initRisk:", e);
            }
            let totalMarketValue = 0;
            
            const BETA_MAP = {
                '2330': 1.25, '2454': 1.35, '2317': 1.15, '2308': 1.20,
                '2881': 0.85, '2882': 0.88, '2382': 1.40, '2324': 1.10,
                '3231': 1.45, '2301': 0.95, '3008': 1.10, '0050': 1.00,
                '0056': 0.75, '00878': 0.72, '00919': 0.78, '00929': 0.82
            };

            const processed = symbols.map(sym => {
                const h = holdings[sym];
                const quote = quotes[sym] || {};
                const price = quote.price || (h.totalCost / h.shares);
                const marketValue = price * h.shares;
                totalMarketValue += marketValue;

                let beta = 1.0;
                if (BETA_MAP[sym]) {
                    beta = BETA_MAP[sym];
                } else if (sym.startsWith('00')) {
                    beta = 0.8;
                } else if (/^[A-Za-z]/.test(sym)) {
                    beta = 1.1;
                }

                return {
                    symbol: sym,
                    name: quote.name || h.name || sym,
                    marketValue,
                    beta
                };
            });

            let weightedBetaSum = 0;
            processed.forEach(item => {
                weightedBetaSum += item.beta * item.marketValue;
            });
            const portfolioBeta = totalMarketValue > 0 ? (weightedBetaSum / totalMarketValue) : 1.0;

            const scenarios = [
                { percent: -5, label: '大盤下跌 5% (溫和回檔)', loss: totalMarketValue * -0.05 * portfolioBeta },
                { percent: -10, label: '大盤下跌 10% (中期修正)', loss: totalMarketValue * -0.10 * portfolioBeta },
                { percent: -20, label: '大盤下跌 20% (系統性熊市)', loss: totalMarketValue * -0.20 * portfolioBeta }
            ];

            container.innerHTML = `
                <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                    <span class="text-sm font-bold text-gray-900 dark:text-white font-sans">系統性風險壓力測試 (加權 Beta: ${portfolioBeta.toFixed(2)})</span>
                    <span class="text-xs text-gray-400">當前持股總市值: ${this.formatNumber(totalMarketValue, 0)} 元</span>
                </div>
                
                <div id="risk-chart-inner" class="w-full h-80"></div>
                
                <div class="border-t border-gray-100 dark:border-gray-800 flex-1 overflow-x-auto">
                    <h4 class="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50/30 dark:bg-gray-900/30">大盤下跌 10% 時個股預估回撤</h4>
                    <table class="w-full text-left text-sm">
                        <thead class="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 dark:text-gray-500 text-xs">
                            <tr>
                                <th class="px-6 py-3">個股</th>
                                <th class="px-6 py-3 text-right">市值</th>
                                <th class="px-6 py-3 text-right">Beta</th>
                                <th class="px-6 py-3 text-right">預估跌幅</th>
                                <th class="px-6 py-3 text-right">預估損失</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-800 font-mono text-gray-700 dark:text-gray-300">
                            ${processed.map(item => {
                                const expectedDrop = 10 * item.beta;
                                const expectedLoss = item.marketValue * -(expectedDrop / 100);
                                return `
                                    <tr class="hover:bg-gray-800/30 transition-colors">
                                        <td class="px-6 py-3">
                                            <span class="font-bold text-gray-900 dark:text-white">${item.symbol}</span>
                                            <span class="text-xs text-gray-455 ml-1">${item.name}</span>
                                        </td>
                                        <td class="px-6 py-3 text-right">${this.formatNumber(item.marketValue, 0)}</td>
                                        <td class="px-6 py-3 text-right">${item.beta.toFixed(2)}</td>
                                        <td class="px-6 py-3 text-right text-green-600 dark:text-green-400 font-bold">-${expectedDrop.toFixed(1)}%</td>
                                        <td class="px-6 py-3 text-right text-green-600 dark:text-green-400 font-bold">${this.formatNumber(expectedLoss, 0)}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            setTimeout(() => {
                const chartDom = document.getElementById('risk-chart-inner');
                if (!chartDom) return;
                const isDark = document.documentElement.classList.contains('dark');
                const myChart = echarts.init(chartDom, isDark ? 'dark' : null);

                const option = {
                    backgroundColor: 'transparent',
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: { type: 'shadow' },
                        formatter: function(params) {
                            const p = params[0];
                            return `<b>${p.name}</b><br/>預估損失金額: <b>${Math.abs(p.value).toLocaleString('zh-TW', {maximumFractionDigits:0})} 元</b>`;
                        }
                    },
                    grid: { left: '8%', right: '8%', bottom: '15%', top: '15%', containLabel: true },
                    xAxis: {
                        type: 'category',
                        data: scenarios.map(s => s.label),
                        axisLabel: { textStyle: { color: isDark ? '#ccc' : '#333' } }
                    },
                    yAxis: {
                        type: 'value',
                        name: '預估損益 (元)',
                        nameTextStyle: { color: isDark ? '#ccc' : '#333' },
                        axisLabel: {
                            formatter: function(v) { return (v / 10000) + '萬'; },
                            textStyle: { color: isDark ? '#ccc' : '#333' }
                        },
                        splitLine: { lineStyle: { color: isDark ? '#2e353f' : '#e0e0e0' } }
                    },
                    series: [
                        {
                            name: '預估損失',
                            type: 'bar',
                            barWidth: '40%',
                            data: scenarios.map(s => s.loss),
                            itemStyle: {
                                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                    { offset: 0, color: '#ff4d4f' },
                                    { offset: 1, color: '#cf1322' }
                                ]),
                                borderRadius: [4, 4, 0, 0]
                            }
                        }
                    ]
                };
                myChart.setOption(option);
                myChart.resize();
                window.addEventListener('resize', () => myChart.resize());
            }, 50);

        } catch(err) {
            console.error('Error rendering risk stress test:', err);
            container.innerHTML = `<div class="p-8 text-center text-red-500">風險壓力測試加載失敗: ${err.message}</div>`;
        }
    },

    async initCashflow(container) {
        try {
            const trades = await db.getAllTrades();
            if (!trades || trades.length === 0) {
                container.innerHTML = `<div class="flex-1 flex items-center justify-center p-8 text-center text-gray-500">暫無交易紀錄，無法預估股利現金流。</div>`;
                return;
            }

            const holdings = this.calculateHoldings(trades);
            const symbols = Object.keys(holdings);
            if (symbols.length === 0) {
                container.innerHTML = `<div class="flex-1 flex items-center justify-center p-8 text-center text-gray-500">當前無持股。</div>`;
                return;
            }

            let quotes = {};
            try {
                quotes = await api.fetchQuotes(symbols) || {};
            } catch(e) {
                console.warn("fetchQuotes failed in initCashflow:", e);
            }
            
            const divDataResults = {};
            try {
                await Promise.all(symbols.map(async (sym) => {
                    try {
                        divDataResults[sym] = await api.fetchFinancials(sym, 'dividends');
                    } catch (e) {
                        console.warn(`Failed to fetch dividends for ${sym}`, e);
                        divDataResults[sym] = null;
                    }
                }));
            } catch (e) {
                console.error("Failed to Promise.all dividends", e);
            }

            const monthlyDividends = Array(12).fill(0);
            const detailList = [];

            for (const sym of symbols) {
                const h = holdings[sym];
                const quote = quotes[sym] || {};
                const price = quote.price || (h.totalCost / h.shares);
                
                const divData = divDataResults[sym];
                const isUS = /^[A-Za-z]/.test(sym);

                if (divData && Array.isArray(divData.data) && divData.data.length > 0) {
                    const sortedDivs = [...divData.data].sort((a, b) => new Date(b.date || b.exDate) - new Date(a.date || a.exDate));
                    const latestDateStr = sortedDivs[0].date || sortedDivs[0].exDate;
                    const latestDate = new Date(latestDateStr);
                    const oneYearAgo = new Date(latestDate.getTime() - 365 * 24 * 60 * 60 * 1000);

                    const oneYearDivs = sortedDivs.filter(d => new Date(d.date || d.exDate) >= oneYearAgo);
                    
                    if (oneYearDivs.length > 0) {
                        let totalDivPerShare = 0;
                        oneYearDivs.forEach(divEvent => {
                            const dDate = new Date(divEvent.date || divEvent.exDate);
                            const monthIndex = dDate.getMonth();
                            const divVal = parseFloat(divEvent.value || divEvent.amount || 0);
                            
                            monthlyDividends[monthIndex] += divVal * h.shares;
                            totalDivPerShare += divVal;
                        });

                        detailList.push({
                            symbol: sym,
                            name: quote.name || h.name || sym,
                            shares: h.shares,
                            divPerShare: totalDivPerShare,
                            totalPayout: totalDivPerShare * h.shares,
                            isEstimated: false
                        });
                        continue;
                    }
                }

                let estDivPerShare = 0;
                let payout = 0;
                
                if (isUS) {
                    estDivPerShare = price * 0.02;
                    payout = estDivPerShare * h.shares;
                    const quarterlyPayout = payout / 4;
                    monthlyDividends[2] += quarterlyPayout;
                    monthlyDividends[5] += quarterlyPayout;
                    monthlyDividends[8] += quarterlyPayout;
                    monthlyDividends[11] += quarterlyPayout;
                } else {
                    estDivPerShare = price * 0.045;
                    payout = estDivPerShare * h.shares;
                    monthlyDividends[6] += payout * 0.3;
                    monthlyDividends[7] += payout * 0.7;
                }

                detailList.push({
                    symbol: sym,
                    name: quote.name || h.name || sym,
                    shares: h.shares,
                    divPerShare: estDivPerShare,
                    totalPayout: payout,
                    isEstimated: true
                });
            }

            const totalAnnualPayout = monthlyDividends.reduce((a, b) => a + b, 0);

            container.innerHTML = `
                <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                    <span class="text-sm font-bold text-gray-900 dark:text-white font-sans">未來一年每月股利預估 (年總計: ${this.formatNumber(totalAnnualPayout, 0)} 元)</span>
                    <span class="text-xs text-gray-400">平均每月現金流: ${this.formatNumber(totalAnnualPayout / 12, 0)} 元</span>
                </div>
                
                <div id="cashflow-chart-inner" class="w-full h-80"></div>
                
                <div class="border-t border-gray-100 dark:border-gray-800 flex-1 overflow-x-auto">
                    <h4 class="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50/30 dark:bg-gray-900/30">持股股利明細預估</h4>
                    <table class="w-full text-left text-sm">
                        <thead class="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 dark:text-gray-500 text-xs">
                            <tr>
                                <th class="px-6 py-3">個股</th>
                                <th class="px-6 py-3 text-right">持有股數</th>
                                <th class="px-6 py-3 text-right">預估每股股利</th>
                                <th class="px-6 py-3 text-right">預估年股息</th>
                                <th class="px-6 py-3 text-center">數據來源</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-800 font-mono text-gray-700 dark:text-gray-300">
                            ${detailList.map(item => `
                                <tr class="hover:bg-gray-800/30 transition-colors">
                                    <td class="px-6 py-3">
                                        <span class="font-bold text-gray-900 dark:text-white">${item.symbol}</span>
                                        <span class="text-xs text-gray-455 ml-1">${item.name}</span>
                                    </td>
                                    <td class="px-6 py-3 text-right">${this.formatNumber(item.shares, 0)}</td>
                                    <td class="px-6 py-3 text-right">${this.formatNumber(item.divPerShare)}</td>
                                    <td class="px-6 py-3 text-right font-bold text-green-600 dark:text-green-400">${this.formatNumber(item.totalPayout, 0)}</td>
                                    <td class="px-6 py-3 text-center">
                                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${item.isEstimated ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}">
                                            ${item.isEstimated ? '預設估計' : '歷史數據'}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            setTimeout(() => {
                const chartDom = document.getElementById('cashflow-chart-inner');
                if (!chartDom) return;
                const isDark = document.documentElement.classList.contains('dark');
                const myChart = echarts.init(chartDom, isDark ? 'dark' : null);

                const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

                const option = {
                    backgroundColor: 'transparent',
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: { type: 'shadow' },
                        formatter: function(params) {
                            const p = params[0];
                            return `<b>${p.name}</b><br/>預估股息: <b>${Math.round(p.value).toLocaleString('zh-TW')} 元</b>`;
                        }
                    },
                    grid: { left: '8%', right: '8%', bottom: '15%', top: '15%', containLabel: true },
                    xAxis: {
                        type: 'category',
                        data: months,
                        axisLabel: { textStyle: { color: isDark ? '#ccc' : '#333' } }
                    },
                    yAxis: {
                        type: 'value',
                        name: '金額 (元)',
                        nameTextStyle: { color: isDark ? '#ccc' : '#333' },
                        axisLabel: { textStyle: { color: isDark ? '#ccc' : '#333' } },
                        splitLine: { lineStyle: { color: isDark ? '#2e353f' : '#e0e0e0' } }
                    },
                    series: [
                        {
                            name: '預估配息',
                            type: 'bar',
                            barWidth: '55%',
                            data: monthlyDividends,
                            itemStyle: {
                                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                    { offset: 0, color: '#34d399' },
                                    { offset: 1, color: '#059669' }
                                ]),
                                borderRadius: [4, 4, 0, 0]
                            }
                        }
                    ]
                };
                myChart.setOption(option);
                myChart.resize();
                window.addEventListener('resize', () => myChart.resize());
            }, 50);

        } catch(err) {
            console.error('Error rendering cashflow:', err);
            container.innerHTML = `<div class="p-8 text-center text-red-500">預估現金流加載失敗: ${err.message}</div>`;
        }
    }
};
