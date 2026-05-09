# Link Grab - Open Links in Selection

A Chrome extension that opens or copies all links found in selected text via the context menu or keyboard shortcut.

![Chrome Extension](https://img.shields.io/badge/Platform-Chrome-4285F4?logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-34A853)
![License](https://img.shields.io/badge/License-MIT-blue)

## Features

- **Open all links in selection** — right-click selected text to open every link at once
- **Copy links to clipboard** — copy all found links without opening them
- **Link preview** — optionally preview and select which links to open
- **Captures hyperlinks** — finds links even when the visible text differs from the URL
- **Raw URL detection** — also catches plain-text URLs in the selection
- **Dynamic link count** — context menu shows how many links are in your selection
- **Keyboard shortcuts** — `Ctrl+Shift+L` to open, `Ctrl+Shift+K` to copy (configurable)
- **Remove duplicates** — optionally filter out repeated links
- **Tab grouping** — open links in a tab group for easy organisation
- **New window mode** — open links in a separate browser window
- **Focus control** — choose whether to switch to the first new tab
- **Max tabs limit** — safety cap to prevent accidentally opening too many tabs
- **Dark/light theme** — automatically matches your system theme
- **Persistent settings** — preferences saved across browser restarts

## Screenshots

_Add screenshots here_

## Installation

### From source (Developer mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/edgoran/link-grab.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable **Developer mode** (toggle in the top-right corner)

4. Click **"Load unpacked"**

5. Select the `link-grab` folder

6. Pin the extension by clicking the puzzle piece icon (🧩) in the toolbar

### From Chrome Web Store

_Coming soon_

## Usage

### Context Menu

1. Select text containing links on any webpage
2. Right-click the selection
3. Click **"Links in selection (N)"** — where N is the number of links found
4. Links open in new tabs (or preview shown if enabled)

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+L` | Open all links in selection |
| `Ctrl+Shift+K` | Copy all links in selection to clipboard |

To change shortcuts, open the extension popup and click **"Change"**, or navigate to `chrome://extensions/shortcuts`.

### Link Preview

When "Preview before opening" is enabled in settings:

1. Select text and trigger via context menu or shortcut
2. A preview panel shows all found links with checkboxes
3. Select/deselect individual links
4. Click **"Open"** to open selected links
5. Click **"Copy"** to copy selected links to clipboard
6. Click **"Cancel"** or press Escape to dismiss

## Settings

Click the extension icon to open the settings popup:

### Open Links In

| Mode | Behaviour |
|------|-----------|
| Current | Opens tabs in the current browser window |
| Group | Opens tabs in a tab group in the current window |
| New window | Opens tabs in a new browser window |

### Options

| Setting | Description | Default |
|---------|-------------|---------|
| Remove duplicates | Only open unique links | On |
| Focus first tab | Switch to the first opened link | Off |
| Max tabs | Limit number of tabs opened at once | 20 |
| Preview before opening | Show links and confirm before opening | Off |

## How It Works

When you trigger the extension, it:

1. Injects a content script into the active tab
2. The content script reads the DOM selection (not just plain text)
3. Extracts `href` attributes from any `<a>` tags in the selection
4. Also extracts raw URLs from the text content
5. Combines and deduplicates (if enabled)
6. Opens each URL in a new tab, or shows preview panel

A selection monitor script runs on all pages to count links in real-time, updating the context menu with the current count.

### Architecture

```
┌──────────────────┐                    ┌──────────────────┐
│ Selection Monitor│                    │  Service Worker  │
│ (all pages)      │───link count──────▶│                  │
│                  │                    │  - Context menu  │
└──────────────────┘                    │  - Tab creation  │
                                        │  - Tab grouping  │
┌──────────────────┐                    │  - Settings      │
│ Content Script   │◀──GET_SELECTED────│  - Clipboard     │
│ (on demand)      │───urls───────────▶│                  │
│                  │                    └──────────────────┘
└──────────────────┘                           │
                                               ▼
┌──────────────────┐                    ┌──────────────┐
│ Preview Panel    │◀──SHOW_PREVIEW────│chrome.storage│
│ (on demand)      │───CONFIRMED──────▶│  (settings)  │
└──────────────────┘                    └──────────────┘
```

### File Structure

```
link-grab/
├── manifest.json              # Extension configuration & keyboard shortcuts
├── background/
│   └── service-worker.js      # Context menu, shortcut handling, tab management
├── content/
│   ├── content-script.js      # DOM selection reading, link extraction
│   ├── preview.js             # Preview overlay panel
│   └── selection-monitor.js   # Real-time link counting for context menu
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

Open `test/test-page.html` in your browser to run through edge cases manually.

## Permissions

| Permission | Reason |
|------------|--------|
| `contextMenus` | Add "Open links in selection" to right-click menu |
| `tabs` | Open new tabs and create tab groups |
| `tabGroups` | Name and manage tab groups |
| `storage` | Save user preferences |
| `scripting` | Inject content scripts to read selection and show preview |
| `host_permissions: <all_urls>` | Required to inject content scripts and monitor selections on any page |

## Accessibility

- Full keyboard navigation support
- ARIA roles and states on interactive elements
- Focus indicators for keyboard users
- Respects `prefers-reduced-motion`
- WCAG AA colour contrast compliance

## Known Limitations

- Cannot extract links from pages that block content script injection (e.g., `chrome://` pages, Chrome Web Store)
- Relative URLs (e.g., `/path/to/page`) are not captured — only absolute `http://` and `https://` links
- Context menu link count updates with a small delay (300ms debounce)

## Browser Compatibility

- Google Chrome 110+
- Chromium-based browsers (Edge, Brave, etc.) — untested but should work

## License

Copyright (c) 2026 Edward Goran Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Contributing

Contributions are welcome! Please open an issue to discuss any changes before submitting a pull request.