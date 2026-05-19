/**
 * TWStock Pro Router
 * 管理主分頁與二級導航
 */

const ROUTES = {
    'portfolio': {
        title: '我的持股',
        subPages: []
    },
    'trendHunter': {
        title: '趨勢獵人',
        subPages: ['量化精選', 'ETF戰情', '精選策略', '今日最熱', '資金輪動', '熱力圖', '我的收藏']
    },
    'assetRisk': {
        title: '資產風險',
        subPages: ['配置', '風險', '現金流', '績效', '模擬']
    },
    'performance': {
        title: '歷年戰績',
        subPages: []
    },
    'addTrade': {
        title: '新增交易',
        subPages: []
    }
};

class Router {
    constructor() {
        this.currentPrimary = 'portfolio';
        this.currentSecondary = null;
    }

    init() {
        this.subNavContainer = document.getElementById('sub-nav-container');
        this.viewTitle = document.getElementById('view-title');
        
        // 初始載入第一頁
        this.switchPage('portfolio');
    }

    switchPage(primary, secondary = null) {
        if (!ROUTES[primary]) return;

        this.currentPrimary = primary;
        const config = ROUTES[primary];
        
        // 如果沒有指定子分頁，預設選取第一個
        if (!secondary && config.subPages.length > 0) {
            secondary = config.subPages[0];
        }
        this.currentSecondary = secondary;

        // 更新標題
        this.viewTitle.textContent = config.title;

        // 更新 Sidebar / Mobile Nav UI
        this.updateNavUI(primary);

        // 渲染二級導航
        this.renderSubNav(config.subPages, secondary);

        // 切換視圖容器
        this.toggleViews(primary, secondary);

        // 發送頁面切換事件 (供 app.js 其它模組監聽)
        window.dispatchEvent(new CustomEvent('router:changed', { 
            detail: { primary, secondary } 
        }));
    }

    updateNavUI(primary) {
        // 更新 PC Sidebar
        document.querySelectorAll('.nav-item').forEach(item => {
            const id = item.id.replace('nav-', '');
            // 處理 camelCase 轉 kebab-case 對比
            const normalizedId = id.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
            const normalizedPrimary = primary.replace(/[A-Z]/g, m => "-" + m.toLowerCase());

            if (normalizedId === normalizedPrimary) {
                item.classList.add('active', 'bg-blue-50', 'dark:bg-blue-600/10', 'text-blue-600', 'dark:text-blue-400');
                item.classList.remove('text-gray-600', 'dark:text-gray-400');
            } else {
                item.classList.remove('active', 'bg-blue-50', 'dark:bg-blue-600/10', 'text-blue-600', 'dark:text-blue-400');
                item.classList.add('text-gray-600', 'dark:text-gray-400');
            }
        });

        // 更新 Mobile Bottom Nav
        document.querySelectorAll('[id^="mobile-nav-"]').forEach(item => {
            const id = item.id.replace('mobile-nav-', '');
            if (id === primary) {
                item.classList.add('text-blue-600', 'dark:text-blue-400');
                item.classList.remove('text-gray-500');
            } else {
                item.classList.remove('text-blue-600', 'dark:text-blue-400');
                item.classList.add('text-gray-500');
            }
        });
    }

    renderSubNav(subPages, activeSub) {
        if (!this.subNavContainer) return;

        if (subPages.length === 0) {
            this.subNavContainer.classList.add('hidden');
            this.subNavContainer.innerHTML = '';
            return;
        }

        this.subNavContainer.classList.remove('hidden');
        
        // 根據螢幕寬度選擇渲染樣式 (Tailwind class 處理)
        let html = `
            <div class="flex items-center space-x-1 md:space-x-8 overflow-x-auto no-scrollbar py-2 px-4 md:px-6">
        `;

        subPages.forEach(page => {
            const isActive = page === activeSub;
            // PC: Underline style, Mobile: Segmented style
            html += `
                <button onclick="router.switchPage('${this.currentPrimary}', '${page}')" 
                    class="flex-shrink-0 px-4 py-1.5 md:py-3 text-sm font-medium transition-all duration-200 
                    ${isActive 
                        ? 'text-blue-600 dark:text-blue-400 md:border-b-2 md:border-blue-600 dark:md:border-blue-400 bg-blue-100/50 dark:bg-blue-600/20 md:bg-transparent dark:md:bg-transparent rounded-full md:rounded-none' 
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}"
                >
                    ${page}
                </button>
            `;
        });

        html += '</div>';
        this.subNavContainer.innerHTML = html;
    }

    toggleViews(primary, secondary) {
        const contentArea = document.getElementById('content-area');
        if (!contentArea) return;

        // 隱藏所有視圖
        Array.from(contentArea.children).forEach(child => {
            if (child.id && child.id.startsWith('view-')) {
                child.classList.add('hidden');
            }
        });

        // 顯示當前視圖 (如果沒有對應 ID，則顯示預設內容)
        const viewId = `view-${primary}`;
        let targetView = document.getElementById(viewId);
        
        if (!targetView) {
            // 建立一個開發中的佔位視圖
            targetView = document.createElement('div');
            targetView.id = viewId;
            targetView.className = 'flex flex-col items-center justify-center h-full text-gray-500';
            targetView.innerHTML = `
                <div class="text-4xl mb-4">🛠️</div>
                <div class="text-lg">${ROUTES[primary].title} 模組開發中...</div>
            `;
            contentArea.appendChild(targetView);
        }

        targetView.classList.remove('hidden');

        // 如果有子頁面，可以在這裡進一步分發子頁面的渲染
        if (secondary) {
            console.log(`Switching to sub-page: ${secondary} of ${primary}`);
            // 此處可根據 secondary 切換 targetView 內部的子容器
        }
    }
}

export const router = new Router();
// 暴露到 window 以便 onclick 調用 (簡單做法，或在 app.js 綁定)
window.router = router;
