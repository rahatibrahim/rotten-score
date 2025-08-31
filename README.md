
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
   - Get your api key from [OMDb API](https://www.omdbapi.com/apikey.aspx).
   - Add your OMDb API key from the popup menu.

## Usage

- Browse Netflix as usual.
- Rotten Tomatoes ratings will appear on movie and show thumbnails.
- Click the extension icon to view the number of API calls made today.

## Permissions

- `storage`: To cache ratings and track API usage.
- `tabs`: To query and reload Netflix tabs.

## Credits

- [OMDb API](https://www.omdbapi.com/) for movie data.
- Rotten Tomatoes for ratings.

## License

This project is for educational and personal use only. Not affiliated with Netflix or Rotten Tomatoes.

---
