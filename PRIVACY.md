# Privacy Policy — Link Grab

## Data Collection

Link Grab does not collect, transmit, or store any personal data. No information ever leaves your browser.

## How It Works

When you select text and use the extension, it:
1. Reads the selected text on the current page to find links
2. Opens those links in new tabs, copies them to clipboard, or shows a preview — based on your choice
3. All processing happens locally in your browser

## Storage

All settings (preferences, collapsed states) are stored locally on your device using Chrome's storage API. This data includes:
- Your chosen open mode (current window, tab group, or new window)
- Toggle states (remove duplicates, focus first tab, preview mode)
- Max tabs limit
- UI preferences (collapsed sections)

No data is transmitted to any server.

## Content Scripts

The extension injects scripts into web pages for the following purposes:
- **Selection monitoring** — counts links in your selected text to display in the context menu
- **Link extraction** — reads the HTML of your selection to find hyperlinks
- **Preview panel** — displays a confirmation overlay before opening links
- **Clipboard access** — copies links to your clipboard when requested

These scripts only process data locally and do not transmit any information.

## Permissions

| Permission | Reason |
|------------|--------|
| `contextMenus` | Add "Links in selection" to the right-click menu |
| `tabs` | Open new tabs and create tab groups |
| `tabGroups` | Name and manage tab groups |
| `storage` | Save your preferences locally |
| `scripting` | Inject content scripts to read selections and show preview |
| `host_permissions: <all_urls>` | Required to monitor selections and extract links on any webpage |

## Third-Party Services

Link Grab does not use any third-party services, analytics, or tracking.

## Data Retention

Settings are stored indefinitely until you:
- Uninstall the extension
- Clear extension data manually via Chrome settings

## Changes to This Policy

Any changes to this privacy policy will be reflected in this document with an updated date.

## Contact

For questions or concerns about this privacy policy, please open an issue at:
https://github.com/edgoran/link-grab/issues

Last updated: 09/05/2026