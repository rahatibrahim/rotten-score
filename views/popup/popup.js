// Show current API call count
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

/**
 * Validates the provided OMDB API key.
 * @param {string} apiKey - The API key to validate.
 * @returns {Promise<boolean>} - A promise that resolves to true if the API key is valid, false otherwise.
 */
async function validateApiKey(apiKey) {
    try {
        const url = `https://www.omdbapi.com/?i=tt3896198&apikey=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        // Check if the response indicates an invalid API key
        if (data.Response === "False" && data.Error === "Invalid API key!") {
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error validating API key:', error);
        return false;
    }
}

// Update your save key event listener
document.getElementById('save-key').addEventListener('click', async function () {
    const apiKey = document.getElementById('omdb-key').value.trim();

    if (!apiKey) {
        showNotification('Enter an API key.', 'error');
        return;
    }

    // Show loading state
    showNotification('Validating...', 'loading');

    const isValid = await validateApiKey(apiKey);
    if (isValid) {
        // Save the valid API key
        chrome.storage.sync.set({ omdbApiKey: apiKey }, function () {
            showNotification('Key saved successfully!', 'success');
            document.getElementById('omdb-key').value = '';
        });
    } else {
        showNotification('Invalid API key!', 'error');
    }
});

/**
 * Shows a notification message.
 * @param {string} message - The notification message to display.
 * @param {string} type - The type of notification (e.g., "success", "error", "loading").
 */
function showNotification(message, type) {
    const notificationMessage = document.getElementById('notification-message');

    notificationMessage.textContent = message;

    // Set text color based on type
    notificationMessage.className = `notification-message ${type}`;

    // Auto-hide after 3 seconds (except for loading state)
    if (type !== 'loading') {
        setTimeout(() => {
            notificationMessage.textContent = 'Dashboard';
            notificationMessage.className = 'notification-message';
        }, 3000);
    }
}