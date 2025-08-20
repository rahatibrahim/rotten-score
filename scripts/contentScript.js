const { DEBUG } = await import('./config.js');

const SVG_URL = chrome.runtime.getURL('icons/fresh_tomato.svg');
const THUMBNAIL_CONTAINER_SELECTOR = '.boxart-container';
const NETFLIX_LOLOMO_SELECTOR = '.lolomo';
const NETFLIX_ROW_SELECTOR = '.lolomoRow';
const MOBILE_GAMES_ROW_SELECTOR = '.mobile-games-row';
const CAROUSEL_HANDLE_SELECTOR = '.handle';
const CAROUSEL_NEXT_CLASS = 'handleNext';
const CAROUSEL_PREV_CLASS = 'handlePrev';
const RATING_WRAPPER_CLASS = 'rotten-tomato-svg';
const DATA_INJECTED_ATTRIBUTE = 'data-rt-injected';
const RATING_NOT_FOUND = -1;
let callCount = 0;

const activeCarouselObservers = new WeakMap();

/**
 * Injects Rotten Tomatoes rating into Netflix thumbnails.
 * It checks for existing containers, fetches ratings, and appends the SVG.
 * @param {MutationRecord[]|null} mutationList - Mutation list from observer
 * @param {HTMLElement[]|null} containersToProcess - Specific containers to process (for carousel)
 * @returns {void}
 */
function injectRottenTomatoesRating(mutationList = null, containersToProcess = null) {
    if (DEBUG) {
        console.log(`🚀 injectRottenTomatoesRating called ${callCount++} times`);
    }
    let containers = [];

    if (containersToProcess) {
        // Direct containers provided (from carousel)
        containers = containersToProcess;
    } else if (mutationList) {
        mutationList.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // boxart-container is the thumbnail container
                    const innerContainers = node.querySelectorAll(THUMBNAIL_CONTAINER_SELECTOR);
                    if (innerContainers && innerContainers.length > 0) {
                        containers.push(...innerContainers);
                    }
                }
            });
        });
    } else {
        // Initial load - get all containers
        containers = document.querySelectorAll(THUMBNAIL_CONTAINER_SELECTOR);
    }

    if (!containers || containers.length === 0) return;

    if (DEBUG) {
        console.log(`📝 Found ${containers.length} containers to process.`);
    }

    for (const container of containers) {
        if (!(container instanceof HTMLElement)) continue;
        if (container.closest(MOBILE_GAMES_ROW_SELECTOR)) continue;

        if (!container.hasAttribute(DATA_INJECTED_ATTRIBUTE)) {
            const parentLink = container.closest('a');
            const title = parentLink ? parentLink.getAttribute('aria-label') : '';
            
            if (!title) continue;

            container.setAttribute(DATA_INJECTED_ATTRIBUTE, 'true');
            
            getRatingFromRottenTomatoes(title).then(rating => {
                const wrapper = createRatingView(rating);
                container.style.position = 'relative';
                container.appendChild(wrapper);
            }).catch(err => {
                console.error('Failed to fetch Rotten Tomatoes rating:', err);
                container.removeAttribute(DATA_INJECTED_ATTRIBUTE);
            });
        }
    }
}

/**
 * Creates a view for the Rotten Tomatoes rating.
 * Which will be appended to the thumbnail container.
 * @param {number|null} rating - The Rotten Tomatoes rating.
 * @returns {HTMLElement} The wrapper element containing the rating view.
 */
function createRatingView(rating) {
    const wrapper = document.createElement('div');
    wrapper.className = RATING_WRAPPER_CLASS;
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
    img.src = SVG_URL;
    img.style.width = '20px';
    img.style.height = '20px';
    img.style.display = 'inline-block';
    img.style.marginRight = '4px';

    const ratingSpan = document.createElement('span');
    // TODO: Investigate why rating is compared with RATING_NOT_FOUND instead of null or undefined
    ratingSpan.textContent = rating !== RATING_NOT_FOUND ? `${rating}%` : 'N/A';
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
                        const rating = response && response.rating ? response.rating : null;
                        resolve(rating);
                    }
                );
            }
        });
    });
}

/**
 * Sets up both Netflix observers and carousel listeners efficiently
 * @returns {void}
 */
function setupNetflixWatchers() {
    injectRottenTomatoesRating();

    const targetNodes = document.querySelectorAll(NETFLIX_LOLOMO_SELECTOR);
    targetNodes.forEach(targetNode => {
        const observer = new MutationObserver((mutationList) => {
            injectRottenTomatoesRating(mutationList);
        });
        observer.observe(targetNode, { childList: true, subtree: false });
    });

    // Setup carousel click handler with optimized event delegation
    document.addEventListener('click', handleCarouselClick, true);
}

/**
 * Optimized carousel click handler
 * @returns {void}
 */
function handleCarouselClick(event) {
    const handleButton = event.target.closest(CAROUSEL_HANDLE_SELECTOR);

    if (!handleButton || (!handleButton.classList.contains(CAROUSEL_NEXT_CLASS) && !handleButton.classList.contains(CAROUSEL_PREV_CLASS))) {
        return;
    }

    // Find the specific carousel row
    const carouselRow = handleButton.closest(NETFLIX_ROW_SELECTOR);
    if (!carouselRow) return;

    // Prevent multiple observers on the same row
    if (activeCarouselObservers.has(carouselRow)) return;

    setupCarouselObserver(carouselRow);
}

/**
 * Sets up a temporary observer for carousel content
 * @returns {void}
 */
function setupCarouselObserver(carouselRow) {
    let foundNewContent = false;
    let debounceTimeout;
    let timeoutId;

    const tempObserver = new MutationObserver((mutationList) => {
        if (foundNewContent) return;

        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }

        // Debounce to wait for all repositioning to complete
        debounceTimeout = setTimeout(() => {
            // Check all containers in this row for unprocessed ones
            const allContainers = carouselRow.querySelectorAll(`${THUMBNAIL_CONTAINER_SELECTOR}:not([${DATA_INJECTED_ATTRIBUTE}])`);
            
            if (allContainers.length > 0) {
                foundNewContent = true;
                injectRottenTomatoesRating(null, Array.from(allContainers));
            }
            
            cleanup();
        }, 300);
    });

    const cleanup = () => {
        tempObserver.disconnect();
        activeCarouselObservers.delete(carouselRow);
        if (timeoutId) clearTimeout(timeoutId);
        if (debounceTimeout) clearTimeout(debounceTimeout);
    };

    // Track this observer
    activeCarouselObservers.set(carouselRow, tempObserver);

    // Start observing with subtree for this specific row
    tempObserver.observe(carouselRow, { childList: true, subtree: true });

    timeoutId = setTimeout(() => {
        cleanup();
    }, 2000);
}

/**
 * Waits for the Netflix content to be available
 * @returns {void}
 */
function waitForContent(callback) {
    const interval = setInterval(() => {
        const lolomoElements = document.querySelectorAll(NETFLIX_LOLOMO_SELECTOR);
        if (lolomoElements.length > 0) {
            clearInterval(interval);
            callback();
        }
    }, 300);
}

waitForContent(setupNetflixWatchers);
