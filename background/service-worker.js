// Create context menu item on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "open-links-in-selection",
        title: "Open links in selection",
        contexts: ["selection"]
    });
});

// Extract URLs from plain text (fallback)
function extractUrlsFromText(text) {
    const urlPattern = /https?:\/\/[^\s<>"')\]]+/gi;
    const matches = text.match(urlPattern) || [];

    return matches.map(url => {
        return url.replace(/[.,;:!?)}\]]+$/, "");
    });
}

// Inject content script and get links from selection
async function getLinksFromSelection(tabId) {
    try {
        await chrome.scripting.executeScript({
            target: { tabId },
            files: ["content/content-script.js"]
        });
    } catch (e) {
        console.warn("Could not inject content script:", e.message);
        return null;
    }

    return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, { type: "GET_SELECTED_LINKS" }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn("Message error:", chrome.runtime.lastError.message);
                resolve(null);
            } else {
                resolve(response ? response.urls : null);
            }
        });
    });
}

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== "open-links-in-selection") return;

    console.log("Context menu clicked");
    console.log("Selection text:", info.selectionText);

    // Try to get links from content script (includes hyperlinks)
    let urls = await getLinksFromSelection(tab.id);
    console.log("URLs from content script:", urls);

    // Fallback to plain text extraction if content script failed
    if (!urls || urls.length === 0) {
        const selectedText = info.selectionText || "";
        urls = extractUrlsFromText(selectedText);
        console.log("URLs from plain text fallback:", urls);
    }

    if (urls.length === 0) {
        console.log("No URLs found");
        return;
    }

    // Load settings
    const data = await chrome.storage.local.get([
        "removeDuplicates",
        "openInGroup",
        "focusFirstTab"
    ]);

    const removeDuplicates = data.removeDuplicates !== false;
    const openInGroup = data.openInGroup || false;
    const focusFirstTab = data.focusFirstTab || false;

    // Remove duplicates if enabled
    if (removeDuplicates) {
        urls = [...new Set(urls)];
    }

    console.log("Opening URLs:", urls);

    // Open tabs
    const newTabIds = [];

    for (let i = 0; i < urls.length; i++) {
        const newTab = await chrome.tabs.create({
            url: urls[i],
            active: (i === 0 && focusFirstTab)
        });
        newTabIds.push(newTab.id);
    }

    // Group tabs if enabled
    if (openInGroup && newTabIds.length > 0) {
        const groupId = await chrome.tabs.group({ tabIds: newTabIds });
        chrome.tabGroups.update(groupId, {
            title: "Links",
            collapsed: false
        });
    }
});