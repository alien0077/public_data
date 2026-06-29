/**
 * TWStockTracker Theme Engine (V2)
 * Handles light/dark mode transitions and persistence.
 */
const THEME_STORAGE_KEY = 'theme-preference';
const LEGACY_THEME_STORAGE_KEY = 'theme';
const THEME_MODES = new Set(['system', 'light', 'dark']);

const ThemeEngine = {
    mediaQuery: null,
    systemChangeHandler: null,
    mode: 'system',

    init() {
        this.mediaQuery = this.mediaQuery || window.matchMedia('(prefers-color-scheme: dark)');
        this.set(this.preference(), { persist: false });

        if (!this.systemChangeHandler) {
            this.systemChangeHandler = () => {
                if (this.preference() === 'system') {
                    this.set('system', { persist: false });
                }
            };
            this.mediaQuery.addEventListener('change', this.systemChangeHandler);
        }
    },

    normalize(mode) {
        return THEME_MODES.has(mode) ? mode : 'system';
    },

    preference() {
        const savedMode = localStorage.getItem(THEME_STORAGE_KEY);
        this.mode = this.normalize(savedMode);
        return this.mode;
    },

    resolve(mode = this.preference()) {
        const normalizedMode = this.normalize(mode);
        if (normalizedMode === 'system') {
            const query = this.mediaQuery || window.matchMedia('(prefers-color-scheme: dark)');
            return query.matches ? 'dark' : 'light';
        }
        return normalizedMode;
    },

    set(mode, options = {}) {
        const { persist = true } = options;
        const preference = this.normalize(mode);
        const theme = this.resolve(preference);

        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        this.mode = preference;

        if (persist) {
            localStorage.setItem(THEME_STORAGE_KEY, preference);
            if (preference === 'system') {
                localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
            } else {
                localStorage.setItem(LEGACY_THEME_STORAGE_KEY, preference);
            }
        }

        // Dispatch custom event for other components to react (e.g., charts)
        window.dispatchEvent(new CustomEvent('theme-changed', {
            detail: { theme, preference }
        }));
    },

    toggle() {
        const nextTheme = this.current() === 'dark' ? 'light' : 'dark';
        this.set(nextTheme);
    },

    current() {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
};

// Initialize theme as soon as possible to prevent flicker
ThemeEngine.init();

window.ThemeEngine = ThemeEngine;
