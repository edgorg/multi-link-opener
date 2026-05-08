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

    await new Promise(resolve => setTimeout(resolve, 100));

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

// Open URLs based on user settings
async function openUrls(urls, settings) {
    const { removeDuplicates, focusFirstTab, openMode } = settings;

    if (removeDuplicates) {
        urls = [...new Set(urls)];
    }

    if (urls.length === 0) {
        chrome.action.setBadgeBackgroundColor({ color: "#d93025" });
        chrome.action.setBadgeText({ text: "0" });
        setTimeout(() => {
            chrome.action.setBadgeText({ text: "" });
        }, 2000);
        return;
    }

    const newTabIds = [];

    if (openMode === "window") {
        // Open in new window
        const newWindow = await chrome.windows.create({
            url: urls[0],
            focused: focusFirstTab
        });

        newTabIds.push(newWindow.tabs[0].id);

        for (let i = 1; i < urls.length; i++) {
            const newTab = await chrome.tabs.create({
                url: urls[i],
                windowId: newWindow.id,
                active: false
            });
            newTabIds.push(newTab.id);
        }
    } else {
        // Open in current window (normal or group)
        for (let i = 0; i < urls.length; i++) {
            const newTab = await chrome.tabs.create({
                url: urls[i],
                active: (i === 0 && focusFirstTab)
            });
            newTabIds.push(newTab.id);
        }
    }

    // Group tabs if mode is "group"
    if (openMode === "group" && newTabIds.length > 0) {
        const groupId = await chrome.tabs.group({ tabIds: newTabIds });
        chrome.tabGroups.update(groupId, {
            title: "Links",
            collapsed: false
        });
    }

    // Show badge with count of opened links
    chrome.action.setBadgeBackgroundColor({ color: "#1a73e8" });
    chrome.action.setBadgeText({ text: urls.length.toString() });

    // Clear badge after 3 seconds
    setTimeout(() => {
        chrome.action.setBadgeText({ text: "" });
    }, 3000);
}

// Load settings helper
async function loadSettings() {
    const data = await chrome.storage.local.get([
        "removeDuplicates",
        "focusFirstTab",
        "openMode"
    ]);

    return {
        removeDuplicates: data.removeDuplicates !== false,
        focusFirstTab: data.focusFirstTab || false,
        openMode: data.openMode || "normal"
    };
}

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== "open-links-in-selection") return;

    let urls = await getLinksFromSelection(tab.id);

    if (!urls || urls.length === 0) {
        const selectedText = info.selectionText || "";
        urls = extractUrlsFromText(selectedText);
    }

    if (urls.length === 0) {
        chrome.action.setBadgeBackgroundColor({ color: "#d93025" });
        chrome.action.setBadgeText({ text: "0" });
        setTimeout(() => {
            chrome.action.setBadgeText({ text: "" });
        }, 2000);
        return;
    }

    const settings = await loadSettings();
    await openUrls(urls, settings);
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
    if (command !== "open-links") return;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    let urls = await getLinksFromSelection(tab.id);

    if (!urls || urls.length === 0) return;

    const settings = await loadSettings();
    await openUrls(urls, settings);
});