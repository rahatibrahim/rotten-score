importScripts('config.js');

let apiCallCount = 0;
let lastApiCallDate = '';

// Initialize the API call count and last call date from storage
chrome.storage.local.get(['apiCallCount', 'lastApiCallDate'], (result) => {
    apiCallCount = result.apiCallCount || 0;
    lastApiCallDate = result.lastApiCallDate || getTodayString();
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

            // @ts-ignore
            const apiUrl = `https://www.omdbapi.com/?t=${encodeURIComponent(request.title)}&apikey=${OMDB_API_KEY}`;
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
