const svgUrl = chrome.runtime.getURL('icons/fresh_tomato.svg');

function injectSVG() {
    const containers = document.querySelectorAll('.boxart-container');
    if (!containers) return;
    console.log('Found containers:', containers.length);

    for (const container of containers) {
        if (container.closest('.mobile-games-row')) return; // Skip if the container is part of a mobile games row

        if (!container.querySelector('.rotten-tomato-svg')) {
            const parentLink = container.closest('a');
            const title = parentLink ? parentLink.getAttribute('aria-label') : '';
            console.log('Title:', title);
            getRatingFromRottenTomatoes(title).then(rating => {
                console.log('Rotten Tomatoes Rating:', rating);
                let numericRating = 'N/A';
                if (rating && typeof rating === 'string' && rating.endsWith('%')) {
                    numericRating = parseInt(rating, 10);
                }
                const wrapper = createRatingView(numericRating);
                container.style.position = 'relative';
                container.appendChild(wrapper);
            }).catch(err => {
                console.error('Failed to fetch Rotten Tomatoes rating:', err);
            });
        }
        break;
    };
}

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
    ratingSpan.textContent = rating !== 'N/A' ? `${rating}%` : 'N/A';
    ratingSpan.style.fontSize = '15px';
    ratingSpan.style.fontWeight = 'bold';
    ratingSpan.style.color = '#222';
    ratingSpan.style.fontFamily = 'sans-serif';

    wrapper.appendChild(img);
    wrapper.appendChild(ratingSpan);

    return wrapper;
}

function getRatingFromRottenTomatoes(title) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(
            { type: 'fetch-rt-rating', title },
            (response) => {
                resolve(response && response.rating ? response.rating : null);
            }
        );
    });
}

injectSVG();

// Run again if new thumbnails are loaded (e.g., scrolling)
const observer = new MutationObserver(injectSVG);
observer.observe(document.body, { childList: true, subtree: true });