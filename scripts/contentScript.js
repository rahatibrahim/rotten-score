const svgUrl = chrome.runtime.getURL('icons/fresh_tomato.svg');
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
    console.log(`injectRottenTomatoesRating called ${callCount++} times`);
    let containers = [];

    if (containersToProcess) {
        // Direct containers provided (from carousel)
        containers = containersToProcess;
        console.log('Processing specific containers from carousel:', containers.length);
    } else if (mutationList) {
        mutationList.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Search for the boxart-container within the added node
                    const innerContainers = node.querySelectorAll('.boxart-container');
                    if (innerContainers && innerContainers.length > 0) {
                        containers.push(...innerContainers);
                    }
                }
            });
        });
    } else {
        // Initial load - get all containers
        containers = document.querySelectorAll('.boxart-container');
    }

    if (!containers || containers.length === 0) return;
    console.log('Found containers:', containers.length);

    // Rest of your existing code remains the same...
    for (const container of containers) {
        if (!(container instanceof HTMLElement)) continue;
        if (container.closest('.mobile-games-row')) continue;

        if (!container.hasAttribute('data-rt-injected')) {
            const parentLink = container.closest('a');
            const title = parentLink ? parentLink.getAttribute('aria-label') : '';
            if (!title) continue;

            container.setAttribute('data-rt-injected', 'true');

            getRatingFromRottenTomatoes(title).then(rating => {
                const wrapper = createRatingView(rating);
                container.style.position = 'relative';
                container.appendChild(wrapper);
            }).catch(err => {
                console.error('Failed to fetch Rotten Tomatoes rating:', err);
                container.removeAttribute('data-rt-injected');
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
 * Sets up both Netflix observers and carousel listeners efficiently
 */
function setupNetflixWatchers() {
    injectRottenTomatoesRating();

    const targetNodes = document.querySelectorAll('.lolomo');
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
 */
function handleCarouselClick(event) {
    const handleButton = event.target.closest('.handle');

    if (!handleButton || (!handleButton.classList.contains('handleNext') && !handleButton.classList.contains('handlePrev'))) {
        return;
    }

    console.log('Carousel navigation button clicked');

    // Find the specific carousel row
    const carouselRow = handleButton.closest('.lolomoRow');
    if (!carouselRow) return;

    // Prevent multiple observers on the same row
    if (activeCarouselObservers.has(carouselRow)) return;

    // Setup temporary observer for this specific row
    setupCarouselObserver(carouselRow);
}

/**
 * Sets up a temporary observer for carousel content
 */
function setupCarouselObserver(carouselRow) {
    let foundNewContent = false;

    const tempObserver = new MutationObserver((mutationList) => {
        if (foundNewContent) return;

        // Look for new unprocessed containers
        const newContainers = [];
        mutationList.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const innerContainers = node.querySelectorAll('.boxart-container:not([data-rt-injected])');
                    if (innerContainers.length > 0) {
                        newContainers.push(...innerContainers);
                    }
                }
            });
        });

        if (newContainers.length > 0) {
            foundNewContent = true;
            console.log(`Processing ${newContainers.length} new carousel containers`);

            // Process new containers directly
            injectRottenTomatoesRating(null, newContainers);

            cleanup();
        }
    });

    const cleanup = () => {
        tempObserver.disconnect();
        activeCarouselObservers.delete(carouselRow);
        if (timeoutId) clearTimeout(timeoutId);
    };

    // Track this observer
    activeCarouselObservers.set(carouselRow, tempObserver);

    // Start observing with subtree for this specific row
    tempObserver.observe(carouselRow, { childList: true, subtree: true });

    const timeoutId = setTimeout(() => {
        console.log('Carousel observer timeout - cleaning up');
        cleanup();
    }, 2000);
}

/**
 * Waits for the Netflix content to be available
 */
function waitForContent(callback) {
    const interval = setInterval(() => {
        const lolomoElements = document.querySelectorAll('.lolomo');
        if (lolomoElements.length > 0) {
            clearInterval(interval);
            callback();
        }
    }, 300);
}

waitForContent(setupNetflixWatchers);
