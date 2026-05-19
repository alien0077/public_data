/**
 * Asset & Risk View Module
 * Handles rendering of all Asset & Risk sub-pages
 */

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
            sideContent: '此模組的詳細數據正在對接中。'
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
                    <div class="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
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
                        <select class="text-[10px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 outline-none text-gray-700 dark:text-gray-300">
                            <option>最近一年</option>
                            <option>全部歷史</option>
                        </select>
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
        // Future ECharts initialization will go here
    }
};
