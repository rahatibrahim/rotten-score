document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['apiCallCount', 'apiCallDate'], (result) => {
    document.getElementById('count').textContent = result.apiCallCount || 0;
    document.getElementById('date').textContent = result.apiCallDate ? `Date: ${result.apiCallDate}` : '';
  });
});