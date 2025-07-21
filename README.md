
# Rotten Score Chrome Extension

Rotten Score is a Chrome extension that enhances your Netflix browsing experience by displaying Rotten Tomatoes ratings directly on movie and show thumbnails. Instantly see how movies and shows are rated without leaving Netflix!

## Features

- **Rotten Tomatoes Ratings:** Automatically fetches and displays Rotten Tomatoes scores on Netflix thumbnails.
- **Visual Indicators:** Shows a fresh or rotten tomato icon alongside the rating.
- **API Call Tracking:** Keeps track of how many API calls are made each day, viewable in the extension popup.
- **Efficient Caching:** Stores ratings locally to minimize API requests and improve performance.

## Installation

1. **Clone or Download the Repository**
   ```sh
   git clone https://github.com/rahatibrahim/rotten-score.git
   ```

2. **Load the Extension in Chrome**
   - Open `chrome://extensions/` in your browser.
   - Enable "Developer mode" (top right).
   - Click "Load unpacked" and select the project directory.

3. **Set Up OMDb API Key**
   - The extension uses the [OMDb API](https://www.omdbapi.com/) to fetch ratings.
   - Copy [`scripts/config.example.js`](scripts/config.example.js) to `scripts/config.js`.
   - Add your OMDb API key in the new `config.js` file.

## Usage

- Browse Netflix as usual.
- Rotten Tomatoes ratings will appear on movie and show thumbnails.
- Click the extension icon to view the number of API calls made today.

## File Structure

```
.
├── icons/                # Extension icons and SVGs
├── scripts/              # Content, background, and popup scripts
│   ├── background.js
│   ├── config.js
│   ├── contentScript.js
│   └── popup.js
├── popup.html            # Popup UI
├── manifest.json         # Chrome extension manifest
├── package.json          # Project metadata
├── .gitignore
└── README.md
```

## Development

- **Content Script:** [`scripts/contentScript.js`](scripts/contentScript.js) injects ratings into Netflix.
- **Background Script:** [`scripts/background.js`](scripts/background.js) handles API requests and storage.
- **Popup:** [`popup.html`](popup.html) and [`scripts/popup.js`](scripts/popup.js) show API call stats.

## Permissions

- `storage`: To cache ratings and track API usage.

## Credits

- [OMDb API](https://www.omdbapi.com/) for movie data.
- Rotten Tomatoes for ratings.

## License

This project is for educational and personal use only. Not affiliated with Netflix or Rotten Tomatoes.

---
