document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['apiCallCount'], (result) => {
        let count = document.getElementById('count');
        if (count) {
            count.textContent = result.apiCallCount || 0;
        } else {
            console.error('Element with id "count" not found in popup.html');
        }
    });
});