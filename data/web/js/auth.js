/**
 * TWStock Pro Auth System
 */

const API_BASE = 'https://alienstocks.alien0077.workers.dev'; // 指向你的 Cloudflare Worker URL

document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login-btn');
    const secretInput = document.getElementById('secret-key');
    const authOverlay = document.getElementById('auth-overlay');
    const mainApp = document.getElementById('main-app');
    const authError = document.getElementById('auth-error');
    const authLoading = document.getElementById('auth-loading');

    // 檢查 sessionStorage 是否已有金鑰
    const savedKey = sessionStorage.getItem('twstock_secret');
    if (savedKey) {
        verifyAndLogin(savedKey);
    }

    loginBtn.addEventListener('click', () => {
        const key = secretInput.value.trim();
        if (!key) return;
        verifyAndLogin(key);
    });

    secretInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loginBtn.click();
        }
    });

    async function verifyAndLogin(key) {
        setLoading(true);
        authError.classList.add('hidden');

        try {
            // 向 Worker 發送測試請求驗證 Secret Key
            const response = await fetch(`${API_BASE}/api/auth_check`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${key}`
                }
            });

            if (response.ok) {
                // 驗證成功
                sessionStorage.setItem('twstock_secret', key);
                showApp();
            } else {
                // 🚀 如果在本地環境且金鑰為 local_dev_bypass，則允許登入
                const isLocal = window.location.hostname === 'localhost' || 
                                window.location.hostname === '127.0.0.1' || 
                                window.location.protocol === 'file:';
                if (isLocal && key === 'local_dev_bypass') {
                    sessionStorage.setItem('twstock_secret', key);
                    showApp();
                } else {
                    // 驗證失敗
                    authError.classList.remove('hidden');
                    sessionStorage.removeItem('twstock_secret');
                }
            }
        } catch (error) {
            // 🚀 如果在本地環境連線失敗，仍允許登入為本地模式
            const isLocal = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1' || 
                            window.location.protocol === 'file:';
            if (isLocal) {
                sessionStorage.setItem('twstock_secret', key || 'local_dev_bypass');
                showApp();
            } else {
                authError.textContent = '連線失敗，請檢查網路';
                authError.classList.remove('hidden');
            }
        } finally {
            setLoading(false);
        }
    }

    function setLoading(isLoading) {
        if (isLoading) {
            loginBtn.disabled = true;
            loginBtn.classList.add('opacity-50');
            authLoading.classList.remove('hidden');
        } else {
            loginBtn.disabled = false;
            loginBtn.classList.remove('opacity-50');
            authLoading.classList.add('hidden');
        }
    }

    function showApp() {
        authOverlay.classList.add('opacity-0');
        setTimeout(() => {
            authOverlay.classList.add('hidden');
            mainApp.classList.remove('hidden');
            setTimeout(() => {
                mainApp.classList.remove('opacity-0');
                // 觸發應用初始化事件
                window.dispatchEvent(new CustomEvent('twstock:ready'));
            }, 50);
        }, 500);
    }
});
