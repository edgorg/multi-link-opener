# Link Opener - Open Links in Selection

A Chrome extension that opens all links found in selected text via the context menu or keyboard shortcut.

![Chrome Extension](https://img.shields.io/badge/Platform-Chrome-4285F4?logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-34A853)
![License](https://img.shields.io/badge/License-MIT-blue)

## Features

- **Open all links in selection** — right-click selected text to open every link at once
- **Captures hyperlinks** — finds links even when the visible text differs from the URL
- **Raw URL detection** — also catches plain-text URLs in the selection
- **Keyboard shortcut** — default `Ctrl+Shift+L` (configurable)
- **Remove duplicates** — optionally filter out repeated links
- **Tab grouping** — open links in a tab group for easy organisation
- **New window mode** — open links in a separate browser window
- **Focus control** — choose whether to switch to the first new tab
- **Dark/light theme** — automatically matches your system theme
- **Persistent settings** — preferences saved across browser restarts

## Installation

### From source (Developer mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/link-opener.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable **Developer mode** (toggle in the top-right corner)

4. Click **"Load unpacked"**

5. Select the `link-opener` folder

6. Pin the extension by clicking the puzzle piece icon (🧩) in the toolbar

### From Chrome Web Store

_Coming soon_

## Usage

### Context Menu

1. Select text containing links on any webpage
2. Right-click the selection
3. Click **"Open links in selection"**
4. All links open in new tabs

### Keyboard Shortcut

1. Select text containing links
2. Press `Ctrl+Shift+L` (default)
3. All links open in new tabs

To change the shortcut, open the extension popup and click **"Change"**, or navigate to `chrome://extensions/shortcuts`.

## Settings

Click the extension icon to open the settings popup:

### Options

| Setting | Description | Default |
|---------|-------------|---------|
| Remove duplicates | Only open unique links | On |
| Focus first tab | Switch to the first opened link | Off |

### Open Links In

| Mode | Behaviour |
|------|-----------|
| Current | Opens tabs in the current browser window |
| Group | Opens tabs in a tab group in the current window |
| New window | Opens tabs in a new browser window |

## How It Works

When you trigger the extension, it:

1. Injects a content script into the active tab
2. The content script reads the DOM selection (not just plain text)
3. Extracts `href` attributes from any `<a>` tags in the selection
4. Also extracts raw URLs from the text content
5. Combines and deduplicates (if enabled)
6. Opens each URL in a new tab

### Architecture

```
┌──────────────┐     Context menu /      ┌──────────────────┐
│   Content    │     keyboard shortcut    │  Service Worker  │
│   Script     │ ◄──────────────────────► │                  │
│              │     "GET_SELECTED_LINKS"  │  - URL extraction│
│ - Read DOM   │                          │  - Tab creation  │
│ - Extract    │                          │  - Tab grouping  │
│   hrefs      │                          │  - Settings      │
└──────────────┘                          └──────────────────┘
                                                 │
                                                 ▼
                                          ┌──────────────┐
                                          │chrome.storage│
                                          │  (settings)  │
                                          └──────────────┘
```

### File Structure

```
link-opener/
├── manifest.json              # Extension configuration & keyboard shortcut
├── background/
│   └── service-worker.js      # Context menu, shortcut handling, tab management
├── content/
│   └── content-script.js      # DOM selection reading, link extraction
├── popup/
│   ├── popup.html             # Settings UI
│   ├── popup.css              # Styling (light/dark theme)
│   └── popup.js               # Settings logic
├── test/
│   ├── test-page.html         # Manual test page with edge cases
│   └── extract-urls.test.js   # Unit tests for URL extraction
└── icons/
    ├── icon16-light.png
    ├── icon16-dark.png
    ├── icon48-light.png
    ├── icon48-dark.png
    ├── icon128-light.png
    └── icon128-dark.png
```

## Link Detection

| Link Type | Example | Captured? |
|-----------|---------|-----------|
| Raw URL in text | `Check out https://example.com` | ✅ |
| Hyperlinked text | `<a href="https://example.com">Click here</a>` | ✅ |
| Hyperlinked URL | `<a href="https://example.com">https://example.com</a>` | ✅ |
| URL with trailing punctuation | `Visit https://example.com.` | ✅ (cleaned) |
| URL in parentheses | `(https://example.com)` | ✅ (cleaned) |
| Relative links | `<a href="/page">Link</a>` | ❌ |
| JavaScript links | `<a href="javascript:void(0)">Link</a>` | ❌ |
| FTP/other protocols | `ftp://example.com` | ❌ |

## Testing

### Manual Tests

Open `test/test-page.html` in your browser to run through edge cases manually. The page contains test blocks covering:

- Raw URLs
- Hyperlinked text
- Mixed link types
- Duplicate links
- Trailing punctuation
- Parentheses
- Multiple links
- No links (empty selection)

### Unit Tests

Run the URL extraction tests:

```bash
node test/extract-urls.test.js
```

## Permissions

| Permission | Reason |
|------------|--------|
| `contextMenus` | Add "Open links in selection" to right-click menu |
| `tabs` | Open new tabs and create tab groups |
| `tabGroups` | Name and manage tab groups |
| `storage` | Save user preferences |
| `scripting` | Inject content script to read selection DOM |
| `host_permissions: <all_urls>` | Required to inject content script on any page |

## Accessibility

- Full keyboard navigation support
- Focus indicators for keyboard users
- ARIA labels on interactive elements
- Respects `prefers-reduced-motion`
- WCAG AA colour contrast compliance

## Known Limitations

- Cannot extract links from pages that block content script injection (e.g., `chrome://` pages, Chrome Web Store)
- Relative URLs (e.g., `/path/to/page`) are not captured — only absolute `http://` and `https://` links
- The keyboard shortcut requires text to be selected before pressing

## Browser Compatibility

- Google Chrome 110+
- Chromium-based browsers (Edge, Brave, etc.) — untested but should work

## MIT License

Copyright (c) 2026 Edward Goran
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Contributing

Contributions are welcome! Please open an issue to discuss any changes before submitting a pull request.
