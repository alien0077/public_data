/**
 * IndexedDB Module for TWStockTracker Web
 */

const DB_NAME = 'TWStockTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'trades';

export const db = {
    /**
     * Open (or create) the database
     */
    openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    // We use 'id' as a unique key if available, or auto-increment
                    // In normalizedTrades, there's usually no unique ID across all entries, 
                    // so we might use a composite key or auto-increment.
                    db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                }
            };

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                reject('IndexedDB error: ' + event.target.errorCode);
            };
        });
    },

    /**
     * Save multiple trade records
     * @param {Array} trades 
     */
    async saveTrades(trades) {
        const database = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            // Clear old data if requested or needed? 
            // For now, let's just add/put.
            
            trades.forEach(trade => {
                store.put(trade);
            });

            transaction.oncomplete = () => {
                resolve();
            };

            transaction.onerror = (event) => {
                reject('Transaction error: ' + event.target.errorCode);
            };
        });
    },

    /**
     * Get all trades
     */
    async getAllTrades() {
        const database = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                reject('Get error: ' + event.target.errorCode);
            };
        });
    },

    /**
     * Clear all trades
     */
    async clearAllTrades() {
        const database = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = (event) => {
                reject('Clear error: ' + event.target.errorCode);
            };
        });
    }
};
