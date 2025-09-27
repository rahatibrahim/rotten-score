/**
 * Storage Service - Handles all Chrome extension storage operations
 * Using traditional function declarations for Chrome extension compatibility
 */

// Create a global StorageService object
window.StorageService = {
    
    // API Key operations (sync storage)
    getApiKey: function() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['omdbApiKey'], (result) => {
                resolve(result.omdbApiKey || null);
            });
        });
    },

    setApiKey: function(apiKey) {
        return new Promise((resolve) => {
            chrome.storage.sync.set({ omdbApiKey: apiKey }, () => {
                resolve();
            });
        });
    },

    removeApiKey: function() {
        return new Promise((resolve) => {
            chrome.storage.sync.remove(['omdbApiKey'], () => {
                resolve();
            });
        });
    },

    // API Call Count operations (local storage)
    getApiCallCount: function() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['apiCallCount'], (result) => {
                resolve(result.apiCallCount || 0);
            });
        });
    },

    setApiCallCount: function(count) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ apiCallCount: count }, () => {
                resolve();
            });
        });
    },

    // Rating cache operations (local storage)
    getCachedRating: function(title) {
        return new Promise((resolve) => {
            chrome.storage.local.get(['ratings'], (result) => {
                const ratings = result.ratings || {};
                resolve(ratings[title] || null);
            });
        });
    },

    setCachedRating: function(title, rating) {
        return new Promise((resolve) => {
            chrome.storage.local.get(['ratings'], (result) => {
                const ratings = result.ratings || {};
                ratings[title] = {
                    value: rating,
                    savedAt: Date.now()
                };
                chrome.storage.local.set({ ratings }, () => {
                    resolve();
                });
            });
        });
    },

    // Daily API call tracking
    getDailyApiData: function() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['apiCallCount', 'lastApiCallDate'], (result) => {
                resolve({
                    count: result.apiCallCount || 0,
                    lastDate: result.lastApiCallDate || ''
                });
            });
        });
    },

    setDailyApiData: function(count, date) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ 
                apiCallCount: count, 
                lastApiCallDate: date 
            }, () => {
                resolve();
            });
        });
    }
};