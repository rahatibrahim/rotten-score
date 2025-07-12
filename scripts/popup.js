document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['apiCallCount'], (result) => {
        document.getElementById('count').textContent = result.apiCallCount || 0;
    });
});