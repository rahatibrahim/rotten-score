const DEFAULT_NOTIFICATION_TEXT = 'Dashboard';
const VALIDATION_MOVIE_ID = 'tt3896198';
const NOTIFICATION_TIME_OUT = 3000;

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

    // Check if API key is already stored
    chrome.storage.sync.get(['omdbApiKey'], (result) => {
        if (result.omdbApiKey) {
            showApiKeyStored();
        }
    });

    // Add event listener for remove key button
    document.getElementById('remove-key').addEventListener('click', removeApiKey);
});

/**
 * Validates the provided OMDB API key.
 * @param {string} apiKey - The API key to validate.
 * @returns {Promise<boolean>} - A promise that resolves to true if the API key is valid, false otherwise.
 */
async function validateApiKey(apiKey) {
    try {
        const url = `https://www.omdbapi.com/?i=${VALIDATION_MOVIE_ID}&apikey=${apiKey}`;
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
            showApiKeyStored();
        });
    } else {
        showNotification('Invalid API key!', 'error');
    }
});

/**
 * Shows the API key stored state with remove button
 */
function showApiKeyStored() {
    document.getElementById('api-key-label').textContent = 'API key is stored';
    document.getElementById('api-key-input').style.display = 'none';
    document.getElementById('api-key-stored').style.display = 'block';
}

/**
 * Removes the stored API key and shows the input form again
 */
function removeApiKey() {
    chrome.storage.sync.remove(['omdbApiKey'], function () {
        showNotification('API key removed!', 'success');
        showApiKeyInput();
    });
}

/**
 * Shows the API key input form
 */
function showApiKeyInput() {
    document.getElementById('api-key-label').textContent = 'Enter OMDB API Key';
    document.getElementById('api-key-input').style.display = 'flex';
    document.getElementById('api-key-stored').style.display = 'none';
    document.getElementById('omdb-key').value = '';
}

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
            notificationMessage.textContent = DEFAULT_NOTIFICATION_TEXT;
            notificationMessage.className = 'notification-message';
        }, NOTIFICATION_TIME_OUT);
    }
}