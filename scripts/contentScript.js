const svgUrl = chrome.runtime.getURL('icons/fresh_tomato.svg');
let callCount = 0;

/**
 * Injects Rotten Tomatoes rating into Netflix thumbnails.
 * It checks for existing containers, fetches ratings, and appends the SVG.
 * @returns {void}
 */
function injectRottenTomatoesRating() {
    console.log(`injectRottenTomatoesRating called ${callCount++} times`);
    const containers = document.querySelectorAll('.boxart-container');
    if (!containers) return;
    console.log('Found containers:', containers.length);

    for (const container of containers) {
        if (!(container instanceof HTMLElement)) continue;
        if (container.closest('.mobile-games-row')) continue; // Skip mobile games row

        if (!container.hasAttribute('data-rt-injected')) {
            const parentLink = container.closest('a');
            const title = parentLink ? parentLink.getAttribute('aria-label') : '';
            if (!title) continue;

            getRatingFromRottenTomatoes(title).then(rating => {
                const wrapper = createRatingView(rating);
                container.style.position = 'relative';
                container.appendChild(wrapper);
                container.setAttribute('data-rt-injected', 'true'); // Mark as processed
            }).catch(err => {
                console.error('Failed to fetch Rotten Tomatoes rating:', err);
            });
        }
    };
}

/**
 * Creates a view for the Rotten Tomatoes rating.
 * Which will be appended to the thumbnail container.
 * @param {number|null} rating - The Rotten Tomatoes rating.
 * @returns {HTMLElement} The wrapper element containing the rating view.
 */
function createRatingView(rating) {
    const wrapper = document.createElement('div');
    wrapper.className = 'rotten-tomato-svg';
    wrapper.style.position = 'absolute';
    wrapper.style.bottom = '5px';
    wrapper.style.right = '5px';
    wrapper.style.left = 'auto';
    wrapper.style.zIndex = '10';
    wrapper.style.padding = '2px 6px 2px 2px';
    wrapper.style.margin = '0';
    wrapper.style.lineHeight = '0';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.background = 'rgba(255, 221, 51, 0.95)';
    wrapper.style.borderRadius = '6px';
    wrapper.style.boxShadow = '0 1px 4px rgba(0,0,0,0.12)';

    const img = document.createElement('img');
    img.src = svgUrl;
    img.style.width = '20px';
    img.style.height = '20px';
    img.style.display = 'inline-block';
    img.style.marginRight = '4px';

    const ratingSpan = document.createElement('span');
    ratingSpan.textContent = rating !== -1 ? `${rating}%` : 'N/A';
    ratingSpan.style.fontSize = '15px';
    ratingSpan.style.fontWeight = 'bold';
    ratingSpan.style.color = '#222';
    ratingSpan.style.fontFamily = 'sans-serif';

    wrapper.appendChild(img);
    wrapper.appendChild(ratingSpan);

    return wrapper;
}

/**
 * Fetches the Rotten Tomatoes rating for a given title.
 * @param {string} title - The title of the movie or show.
 * @returns {Promise<number|null>} The Rotten Tomatoes rating or null if not found.
 */
function getRatingFromRottenTomatoes(title) {
    return new Promise((resolve) => {
        // First, try to get the rating from chrome local storage
        chrome.storage.local.get(['ratings'], (result) => {
            const ratings = result.ratings || {};
            if (ratings[title] && typeof ratings[title].value === 'number') {
                resolve(ratings[title].value);
            } else {
                // If not found, fetch from API
                chrome.runtime.sendMessage(
                    { type: 'fetch-rt-rating', title },
                    (response) => {
                        resolve(response && response.rating ? response.rating : null);
                    }
                );
            }
        });
    });
}

/**
 * Waits for the content to load and then executes the callback.
 * It checks for the presence of target nodes and invokes the callback when found.
 * @param {Function} callback - The callback to execute when content is loaded.
 */
function waitForContent(callback) {
    const interval = setInterval(() => {
        const targetNodes = document.querySelectorAll('.lolomo');
        if (targetNodes.length > 0) {
            clearInterval(interval);
            callback(targetNodes);
        }
    }, 300);
}

waitForContent((targetNodes) => {
    injectRottenTomatoesRating();
    targetNodes.forEach(targetNode => {
        const observer = new MutationObserver(injectRottenTomatoesRating);
        observer.observe(targetNode, { childList: true, subtree: false });
    });
});
