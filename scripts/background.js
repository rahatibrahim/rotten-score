importScripts('config.js');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'fetch-rt-rating' && request.title) {
        const apiUrl = `https://www.omdbapi.com/?t=${encodeURIComponent(request.title)}&apikey=${OMDB_API_KEY}`;
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                let rating = null;
                if (data && data.Ratings) {
                    const rt = data.Ratings.find(r => r.Source === "Rotten Tomatoes");
                    rating = rt ? rt.Value : null;
                }
                sendResponse({ rating });
            })
            .catch(() => sendResponse({ rating: null }));
        return true; // Indicates async response
    }
});