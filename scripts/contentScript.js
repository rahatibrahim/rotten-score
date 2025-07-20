const svgUrl = chrome.runtime.getURL('icons/fresh_tomato.svg');

/**
 * Injects Rotten Tomatoes rating SVG into Netflix thumbnails.
 * It checks for existing containers, fetches ratings, and appends the SVG.
 * @returns {void}
 */
function injectSVG() {
    const containers = document.querySelectorAll('.boxart-container');
    if (!containers) return;
    console.log('Found containers:', containers.length);

    for (const container of containers) {
        if (!(container instanceof HTMLElement)) continue;
        if (container.closest('.mobile-games-row')) return; // Skip mobile games row

        if (!container.querySelector('.rotten-tomato-svg')) {
            const parentLink = container.closest('a');
            const title = parentLink ? parentLink.getAttribute('aria-label') : '';
            if (!title) continue;

            getRatingFromRottenTomatoes(title).then(rating => {
                const wrapper = createRatingView(rating);
                container.style.position = 'relative';
                container.appendChild(wrapper);
            }).catch(err => {
                console.error('Failed to fetch Rotten Tomatoes rating:', err);
            });
        }
        break;
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
    ratingSpan.textContent = rating !== null ? `${rating}%` : 'N/A';
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
                console.log('Rating found in storage:', ratings[title].value);
                resolve(ratings[title].value);
            } else {
                // If not found, fetch from API
                chrome.runtime.sendMessage(
                    { type: 'fetch-rt-rating', title },
                    (response) => {
                        console.log('Fetched rating from API:', response.rating);
                        resolve(response && response.rating ? response.rating : null);
                    }
                );
            }
        });
    });
}

injectSVG();

// Observe changes in the document to inject the SVG when new thumbnails are added
const observer = new MutationObserver(injectSVG);
observer.observe(document.body, { childList: true, subtree: true });
