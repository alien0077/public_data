/**
 * TWStockTracker Theme Engine (V2)
 * Handles light/dark mode transitions and persistence.
 */
const ThemeEngine = {
    init() {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        this.set(theme);
    },

    set(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
        
        // Dispatch custom event for other components to react (e.g., charts)
        window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme } }));
    },

    toggle() {
        const isDark = document.documentElement.classList.contains('dark');
        this.set(isDark ? 'light' : 'dark');
    },

    current() {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
};

// Initialize theme as soon as possible to prevent flicker
ThemeEngine.init();

window.ThemeEngine = ThemeEngine;
