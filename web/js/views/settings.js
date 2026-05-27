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
                    <div class="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        <button id="settings-import-favorites" class="flex items-center justify-center space-x-2 p-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 rounded-xl border border-purple-500/20 transition-all">
                            <span>⭐</span>
                            <span class="text-sm font-bold">匯入/導出收藏名單(JSON)</span>
                        </button>
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
                            <span class="text-sm font-bold text-gray-900 dark:text-white">V2.0.0</span>
                        </div>
                        <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                            <span class="text-sm text-gray-500">更新日期</span>
                            <span class="text-sm font-bold text-gray-900 dark:text-white">${new Date().toISOString().split('T')[0]}</span>
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

        document.getElementById('settings-import-favorites')?.addEventListener('click', () => {
            this.handleFavoritesIO();
        });
    },

    handleFavoritesIO() {
        const action = confirm('點擊「確定」匯出收藏名單，點擊「取消」匯入收藏名單。') ? 'export' : 'import';
        if (action === 'export') {
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
        } else {
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
        }
    }
};

window.Settings = Settings;
