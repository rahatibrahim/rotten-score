let apiCallCount = 0;
let lastApiCallDate = '';
let cachedApiKey = null;

// Initialize the API call count and last call date from storage
chrome.storage.local.get(['apiCallCount', 'lastApiCallDate'], (result) => {
    apiCallCount = result.apiCallCount || 0;
    lastApiCallDate = result.lastApiCallDate || getTodayString();
});

chrome.storage.sync.get(['omdbApiKey'], (result) => {
    cachedApiKey = result.omdbApiKey || null;
});

chrome.runtime.onMessage.addListener(
    /**
     * Handles messages for fetching Rotten Tomatoes ratings.
     * @param {object} request
     * @param {object} sender
     * @param {function} sendResponse
     * @returns {boolean | undefined} Return true to indicate async response, otherwise undefined.
     */
    (request, sender, sendResponse) => {
        if (request.type === 'fetch-rt-rating' && request.title) {
            updateDailyApiCallCount();

            if (!cachedApiKey) {
                console.error('API key not found');
                sendResponse({ rating: null, error: 'API key not found' });
                return;
            }

            const apiUrl = `https://www.omdbapi.com/?t=${encodeURIComponent(request.title)}&apikey=${cachedApiKey}`;
            fetch(apiUrl)
                .then(response => response.json())
                .then(data => {
                    let rating = null;
                    if (data && data.Ratings) {
                        const rt = data.Ratings.find(r => r.Source === "Rotten Tomatoes");
                        rating = rt ? parseInt(rt.Value) : null;
                        saveRatingToStorage(request.title, rating);
                    }
                    sendResponse({ rating });
                })
                .catch(() => sendResponse({ rating: null }));

            return true;
        }
    }
);

/**
 * Gets today's date as a string in the format YYYY-MM-DD.
 * @returns {string} Today's date.
 */
function getTodayString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

/**
 * This function checks the number of API calls made today
 * and updates the count on chrome.storage
 */
function updateDailyApiCallCount() {
    const today = getTodayString();

    chrome.storage.local.get(['apiCallCount', 'lastApiCallDate'], (result) => {
        let count = result.apiCallCount || 0;
        let lastDate = result.lastApiCallDate || today;

        if (lastDate !== today) {
            count = 0;
            lastDate = today;
        } else {
            count++;
        }

        chrome.storage.local.set({ apiCallCount: count, lastApiCallDate: lastDate });
    });
}

/**
 * Saves a movie rating to Chrome's local storage.
 *
 * @param {string} title - The title of the movie.
 * @param {number | null} rating - The rating value to be saved.
 */
function saveRatingToStorage(title, rating) {
    chrome.storage.local.get(['ratings'], (result) => {
        const ratings = result.ratings || {};
        ratings[title] = {
            value: rating,
            savedAt: Date.now()
        };
        chrome.storage.local.set({ ratings });
    });
}

/**
 * Updates the extension badge based on API key status
 */
function updateExtensionBadge() {
    chrome.storage.sync.get(['omdbApiKey'], (result) => {
        if (!result.omdbApiKey) {
            // Show warning badge when no API key
            chrome.action.setBadgeText({ text: '!' });
            chrome.action.setBadgeBackgroundColor({ color: '#FFD600' });
            chrome.action.setTitle({ title: 'RottenScore - API key required' });
        } else {
            // Clear badge when API key exists
            chrome.action.setBadgeText({ text: '' });
            chrome.action.setTitle({ title: 'RottenScore - Active' });
        }
    });
}

// Check badge status on startup
chrome.runtime.onStartup.addListener(updateExtensionBadge);
chrome.runtime.onInstalled.addListener(updateExtensionBadge);

// Listen for storage changes to update badge
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.omdbApiKey) {
        cachedApiKey = changes.omdbApiKey.newValue || null;
        updateExtensionBadge();
    }
});

updateExtensionBadge();
