/**
 * Trend Hunter View Module
 * Handles rendering of all Trend Hunter sub-pages
 */

export const TrendHunter = {
    subPageConfigs: {
        '量化精選': {
            title: '量化模型精選',
            description: '基於多因子評分系統，篩選出市場中具備最強動能與基本面支撐的個股。',
            sideTitle: '模型說明',
            sideContent: '我們的量化模型結合了「趨勢動能」、「價值偏離」與「資金集中度」三大維度，每日收盤後自動更新。'
        },
        'ETF戰情': {
            title: 'ETF 市場戰情室',
            description: '追蹤全台 ETF 資金流向、折溢價與產業曝險分佈。',
            sideTitle: '市場感測',
            sideContent: '目前高股息 ETF 資金持續流入，但需注意部分電子權值型 ETF 的成分股重疊風險。'
        },
        '精選策略': {
            title: 'AI 策略實驗室',
            description: '展示各種經典與現代交易策略在當前市場的運行表現。',
            sideTitle: '策略統計',
            sideContent: '突破策略在近期震盪盤勢中表現較佳，而均線回歸策略則面臨較大的回撤。'
        },
        '今日最熱': {
            title: '今日熱點掃描',
            description: '即時監測市場中成交量異動、漲幅居前與社群討論度最高的個股。',
            sideTitle: '熱力指標',
            sideContent: '今日 AI 伺服器供應鏈出現集體量噴，資金有從航運板塊轉移至電子零組件的跡象。'
        },
        '資金輪動': {
            title: '產業資金輪動圖',
            description: '視覺化呈現資金在不同產業間的轉移路徑，捕捉下一個領漲族群。',
            sideTitle: '象限解讀',
            sideContent: '處於右上象限的產業代表「量價齊揚」，通常是短線資金的主戰場。'
        },
        '熱力圖': {
            title: '全市場熱力圖',
            description: '按市值權重與漲跌幅展現全市場個股表現，一目了然市場強弱。',
            sideTitle: '權重觀察',
            sideContent: '半導體權值股今日撐盤力道強，雖然中小個股跌多漲少，但大盤指數相對穩健。'
        },
        '我的收藏': {
            title: '趨勢收藏夾',
            description: '您收藏的策略、產業或特定個股的追蹤組合。',
            sideTitle: '提醒設定',
            sideContent: '您可以針對收藏的對象設定關鍵價格提醒，當趨勢觸發時系統將第一時間通知您。'
        }
    },

    init(subPage) {
        console.log('TrendHunter initializing subPage:', subPage);
        const container = document.getElementById('view-trendHunter');
        if (!container) {
            console.error('view-trendHunter container not found');
            return;
        }

        // Ensure container is visible and has correct class for layout
        container.classList.remove('hidden');
        
        // Render the main responsive layout
        this.renderLayout(container, subPage);
    },

    renderLayout(container, subPage) {
        const config = this.subPageConfigs[subPage] || {
            title: subPage,
            description: '模組開發中...',
            sideTitle: '資訊說明',
            sideContent: '此模組的詳細數據正在對接中，請稍候。'
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
                    <!-- Market Info / Strategy Description -->
                    <div class="bg-white dark:bg-[#161b22] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <h3 class="font-bold text-lg mb-4 flex items-center">
                            <span class="mr-2">💡</span> ${config.sideTitle}
                        </h3>
                        <div class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            ${config.sideContent}
                        </div>
                    </div>

                    <!-- Market Sentiment Card -->
                    <div class="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-lg shadow-blue-900/20">
                        <h3 class="font-bold mb-2 flex items-center text-white">
                            <span class="mr-2">🎯</span> 市場感測
                        </h3>
                        <p class="text-xs text-blue-100 mb-4 opacity-80">Market Sentiment Index</p>
                        <div class="flex items-center justify-between">
                            <div class="text-3xl font-bold">偏多</div>
                            <div class="text-right">
                                <div class="text-xl font-mono">65%</div>
                                <div class="text-[10px] text-blue-200">Greed & Fear Index</div>
                            </div>
                        </div>
                        <div class="mt-4 h-1.5 bg-blue-900/30 rounded-full overflow-hidden">
                            <div class="h-full bg-white w-[65%] rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                        </div>
                    </div>

                    <!-- Useful Links / Tools -->
                    <div class="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">相關工具</h4>
                        <div class="grid grid-cols-2 gap-3">
                            <button class="p-2 text-xs bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors">
                                策略回測
                            </button>
                            <button class="p-2 text-xs bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors">
                                匯出報表
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    getMainContentPlaceholder(subPage) {
        if (subPage === '資金輪動' || subPage === '熱力圖') {
            return `
                <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                    <span class="text-sm font-bold">視覺化分析視圖</span>
                    <div class="flex space-x-2">
                        <div class="w-3 h-3 rounded-full bg-red-500"></div>
                        <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div class="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                </div>
                <div id="trend-chart-container" class="flex-1 flex items-center justify-center p-8">
                    <div class="text-center">
                        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                        <p class="text-gray-500">正在準備 ECharts 視覺化組件...</p>
                    </div>
                </div>
            `;
        }

        // Default: Table placeholder
        return `
            <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 class="font-bold text-gray-900 dark:text-white">數據清單</h3>
                <div class="flex space-x-2">
                    <input type="text" placeholder="搜尋..." class="text-xs bg-gray-100 dark:bg-gray-800 border-none rounded-md px-3 py-1 outline-none focus:ring-1 ring-blue-500">
                </div>
            </div>
            <div class="flex-1 overflow-x-auto">
                <table class="w-full text-left">
                    <thead class="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 dark:text-gray-500 text-xs uppercase">
                        <tr>
                            <th class="px-6 py-4">項目</th>
                            <th class="px-6 py-4 text-right">數值</th>
                            <th class="px-6 py-4 text-right">變化</th>
                            <th class="px-6 py-4 text-right">評級</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-800 font-mono text-sm text-gray-400">
                        ${Array(10).fill(0).map((_, i) => `
                            <tr>
                                <td class="px-6 py-4">
                                    <div class="w-24 h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <div class="w-16 h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse ml-auto"></div>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <div class="w-12 h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse ml-auto"></div>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <div class="w-8 h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse ml-auto"></div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    initSubPageLogic(subPage) {
        // Placeholder for future data fetching and initialization
        console.log(`SubPage ${subPage} logic initialized`);
        
        // If it's a chart subpage, we could trigger ECharts here in the next step
        if (subPage === '資金輪動' || subPage === '熱力圖') {
            // Placeholder logic to demonstrate transition
            setTimeout(() => {
                const container = document.getElementById('trend-chart-container');
                if (container) {
                    container.innerHTML = `<div class="text-gray-400">ECharts 組件準備就緒，等待數據載入...</div>`;
                }
            }, 1000);
        }
    }
};
