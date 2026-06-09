import { api } from '../api.js';
import { db } from '../db.js';

export const Settings = {
    async init() {
        const container = document.getElementById('view-settings');
        if (!container) return;
        this.render(container);
        this.bindEvents();
    },

    render(container) {
        container.innerHTML = `
            <div class="flex flex-col flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 space-y-6">
                <!-- 資料管理 -->
                <div class="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                    <div class="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                        <h3 class="font-bold text-gray-900 dark:text-white flex items-center">
                            <span class="mr-2">📂</span> 資料管理
                        </h3>
                    </div>
                    <div class="p-5 space-y-4">
                        <div>
                            <p class="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">📈 交易相關</p>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <button id="settings-import-trades" class="flex items-center justify-center space-x-2 p-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl border border-blue-500/20 transition-all">
                                    <span>📥</span>
                                    <span class="text-sm font-bold">匯入交易備份(JSON)</span>
                                </button>
                                <button id="settings-export-trades" class="flex items-center justify-center space-x-2 p-3 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-xl border border-green-500/20 transition-all">
                                    <span>📤</span>
                                    <span class="text-sm font-bold">導出交易備份(JSON)</span>
                                </button>
                                <button id="settings-clear-trades" class="flex items-center justify-center space-x-2 p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/20 transition-all">
                                    <span>🗑️</span>
                                    <span class="text-sm font-bold">清空所有交易紀錄</span>
                                </button>
                            </div>
                        </div>
                        <div>
                            <p class="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">⭐ 收藏相關</p>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <button id="settings-import-fav" class="flex items-center justify-center space-x-2 p-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 rounded-xl border border-purple-500/20 transition-all">
                                    <span>📥</span>
                                    <span class="text-sm font-bold">匯入收藏名單(JSON)</span>
                                </button>
                                <button id="settings-export-fav" class="flex items-center justify-center space-x-2 p-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 rounded-xl border border-indigo-500/20 transition-all">
                                    <span>📤</span>
                                    <span class="text-sm font-bold">導出收藏名單(JSON)</span>
                                </button>
                                <button id="settings-clear-fav" class="flex items-center justify-center space-x-2 p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/20 transition-all">
                                    <span>🗑️</span>
                                    <span class="text-sm font-bold">清空收藏名單</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 系統資訊 -->
                <div class="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                    <div class="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                        <h3 class="font-bold text-gray-900 dark:text-white flex items-center">
                            <span class="mr-2">ℹ️</span> 系統資訊
                        </h3>
                    </div>
                    <div class="p-5 space-y-3">
                        <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                            <span class="text-sm text-gray-500">作者</span>
                            <span class="text-sm font-bold text-gray-900 dark:text-white">Alien</span>
                        </div>
                        <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                            <span class="text-sm text-gray-500">App版本</span>
                            <span class="text-sm font-bold text-gray-900 dark:text-white">V2.1.0</span>
                        </div>
                        <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                            <span class="text-sm text-gray-500">更新日期</span>
                            <span class="text-sm font-bold text-gray-900 dark:text-white">${new Date().toISOString().split('T')[0]}</span>
                        </div>
                    </div>
                </div>

                <!-- 匯入格式參考 -->
                <div class="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                    <div class="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                        <h3 class="font-bold text-gray-900 dark:text-white flex items-center">
                            <span class="mr-2">📄</span> 匯入格式參考
                        </h3>
                    </div>
                    <div class="p-5 space-y-4">
                        <div class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <button onclick="this.nextElementSibling.classList.toggle('hidden');this.querySelector('.arrow').classList.toggle('rotate-90')"
                                class="w-full flex items-center justify-between p-4 text-sm font-bold text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <span>📈 交易紀錄 JSON 格式</span>
                                <span class="arrow text-gray-500 transition-transform">▸</span>
                            </button>
                            <div class="hidden p-4 border-t border-gray-200 dark:border-gray-700">
                                <p class="text-xs text-gray-500 mb-3">匯入時自動辨識以下三種格式（優先序從上到下）：</p>

                                <div class="mb-3">
                                    <p class="text-xs font-bold text-gray-400 mb-1">格式一：transactions 陣列（推薦）</p>
                                    <pre class="text-xs font-mono text-gray-300 bg-gray-900 rounded-lg p-3 overflow-x-auto"><span class="text-gray-500">{</span>
    <span class="text-blue-400">"transactions"</span>: [
        {
            <span class="text-blue-400">"symbol"</span>: <span class="text-green-400">"2330"</span>,
            <span class="text-blue-400">"name"</span>: <span class="text-green-400">"台積電"</span>,
            <span class="text-blue-400">"type"</span>: <span class="text-green-400">"買入"</span>,
            <span class="text-blue-400">"date"</span>: <span class="text-green-400">"2025-03-15"</span>,
            <span class="text-blue-400">"shares"</span>: <span class="text-yellow-400">1000</span>,
            <span class="text-blue-400">"price"</span>: <span class="text-yellow-400">150.5</span>,
            <span class="text-blue-400">"fee"</span>: <span class="text-yellow-400">90.3</span>,
            <span class="text-blue-400">"tax"</span>: <span class="text-yellow-400">0</span>
        }
    ]
<span class="text-gray-500">}</span></pre>
                                </div>

                                <div class="mb-3">
                                    <p class="text-xs font-bold text-gray-400 mb-1">格式二：純陣列</p>
                                    <pre class="text-xs font-mono text-gray-300 bg-gray-900 rounded-lg p-3 overflow-x-auto">[<span class="text-gray-500">...</span>]</pre>
                                </div>

                                <div class="mb-3">
                                    <p class="text-xs font-bold text-gray-400 mb-1">格式三：iOS 完整備份（含 normalizedTrades）</p>
                                    <pre class="text-xs font-mono text-gray-300 bg-gray-900 rounded-lg p-3 overflow-x-auto"><span class="text-gray-500">{</span>
    <span class="text-blue-400">"transactions"</span>: [<span class="text-gray-500">...</span>],
    <span class="text-blue-400">"normalizedTrades"</span>: [<span class="text-gray-500">...</span>]
<span class="text-gray-500">}</span></pre>
                                </div>

                                <div class="bg-blue-500/10 rounded-lg p-3">
                                    <p class="text-xs text-blue-400 font-bold mb-1">必要欄位</p>
                                    <p class="text-xs text-gray-400"><span class="text-blue-300">symbol</span> (股票代號) · <span class="text-blue-300">type</span> (買入/賣出/配息/配股) · <span class="text-blue-300">date</span> (交易日期) · <span class="text-blue-300">shares</span> (股數) · <span class="text-blue-300">price</span> (價格)</p>
                                    <p class="text-xs text-blue-400 font-bold mt-2">選填欄位</p>
                                    <p class="text-xs text-gray-400"><span class="text-blue-300">name</span> · <span class="text-blue-300">fee</span> (手續費) · <span class="text-blue-300">tax</span> (交易稅) · <span class="text-blue-300">notes</span> (備註)</p>
                                </div>
                            </div>
                        </div>

                        <div class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <button onclick="this.nextElementSibling.classList.toggle('hidden');this.querySelector('.arrow').classList.toggle('rotate-90')"
                                class="w-full flex items-center justify-between p-4 text-sm font-bold text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <span>⭐ 收藏名單 JSON 格式</span>
                                <span class="arrow text-gray-500 transition-transform">▸</span>
                            </button>
                            <div class="hidden p-4 border-t border-gray-200 dark:border-gray-700">
                                <div class="mb-3">
                                    <p class="text-xs font-bold text-gray-400 mb-1">收藏名單（Web / iOS 互通）</p>
                                    <pre class="text-xs font-mono text-gray-300 bg-gray-900 rounded-lg p-3 overflow-x-auto"><span class="text-gray-500">{</span>
    <span class="text-blue-400">"version"</span>: <span class="text-yellow-400">1</span>,
    <span class="text-blue-400">"categories"</span>: {
        <span class="text-green-400">"我的最愛"</span>: [<span class="text-green-400">"2330"</span>, <span class="text-green-400">"2317"</span>],
        <span class="text-green-400">"觀察中"</span>: [<span class="text-green-400">"2454"</span>]
    }
<span class="text-gray-500">}</span></pre>
                                </div>
                                <div class="bg-purple-500/10 rounded-lg p-3">
                                    <p class="text-xs text-purple-400 font-bold mb-1">說明</p>
                                    <p class="text-xs text-gray-400">categories 的 key 為分類名稱，value 為股票代號字串陣列。分類可自行命名，數量不限。</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="text-center text-xs text-gray-500 py-4 border-t border-gray-100 dark:border-gray-800">
                    © 2024-2026 Alien. All rights reserved.
                </div>
            </div>
        `;
    },

    bindEvents() {
        document.getElementById('settings-import-trades')?.addEventListener('click', () => {
            document.getElementById('trigger-import')?.click();
        });

        document.getElementById('settings-export-trades')?.addEventListener('click', () => {
            if (typeof window.exportTrades === 'function') {
                window.exportTrades();
            }
        });

        document.getElementById('settings-clear-trades')?.addEventListener('click', async () => {
            if (confirm('確定要清空所有交易紀錄嗎？此操作無法復原！')) {
                await db.clearAllTrades();
                alert('已清空所有交易紀錄');
                window.dispatchEvent(new CustomEvent('twstock:data-changed'));
            }
        });

        document.getElementById('settings-import-fav')?.addEventListener('click', () => {
            this.importFavorites();
        });
        document.getElementById('settings-export-fav')?.addEventListener('click', () => {
            this.exportFavorites();
        });
        document.getElementById('settings-clear-fav')?.addEventListener('click', () => {
            this.clearFavorites();
        });
    },

    exportFavorites() {
        const data = {
            categories: JSON.parse(localStorage.getItem('twstock_favorite_categories') || '["我的最愛","觀察中","定存股","潛力股","投機短線"]'),
            items: JSON.parse(localStorage.getItem('twstock_favorite_data') || '{}'),
            exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${new Date().toISOString().slice(0, 10)}_收藏.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    importFavorites() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                if (data.categories && data.items) {
                    localStorage.setItem('twstock_favorite_categories', JSON.stringify(data.categories));
                    localStorage.setItem('twstock_favorite_data', JSON.stringify(data.items));
                    alert('收藏名單匯入成功！');
                } else {
                    alert('無效的收藏名單格式。');
                }
            } catch { alert('解析 JSON 失敗。'); }
        });
        input.click();
    },

    clearFavorites() {
        if (confirm('確定要清空所有收藏名單嗎？此操作無法復原！')) {
            localStorage.removeItem('twstock_favorite_categories');
            localStorage.removeItem('twstock_favorite_data');
            alert('已清空收藏名單');
        }
    }
};

window.Settings = Settings;
