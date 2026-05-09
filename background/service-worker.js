// Create context menu item on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "links-in-selection",
        title: "Open links in selection",
        contexts: ["selection"]
    });
});

// Update context menu title when we get a link count
function updateContextMenuTitle(count) {
    if (count > 0) {
        chrome.contextMenus.update("links-in-selection", {
            title: `Open links in selection (${count})`
        });
    } else {
        chrome.contextMenus.update("links-in-selection", {
            title: "Open links in selection"
        });
    }
}

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

// Show preview overlay in the tab
async function showPreview(tabId, urls) {
    try {
        await chrome.scripting.executeScript({
            target: { tabId },
            files: ["content/preview.js"]
        });
    } catch (e) {
        console.warn("Could not inject preview:", e.message);
        return false;
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, { type: "SHOW_PREVIEW", urls }, (response) => {
            if (chrome.runtime.lastError) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

// Show badge with count
function showBadge(count, isError = false) {
    chrome.action.setBadgeBackgroundColor({
        color: isError ? "#d93025" : "#1a73e8"
    });
    chrome.action.setBadgeText({ text: count.toString() });

    setTimeout(() => {
        chrome.action.setBadgeText({ text: "" });
    }, 3000);
}

// Load settings helper
async function loadSettings() {
    const data = await chrome.storage.local.get([
        "removeDuplicates",
        "focusFirstTab",
        "maxTabs",
        "showPreview",
        "openMode"
    ]);

    return {
        removeDuplicates: data.removeDuplicates !== false,
        focusFirstTab: data.focusFirstTab || true,
        maxTabs: data.maxTabs || 20,
        showPreview: data.showPreview || true,
        openMode: data.openMode || "normal"
    };
}

// Open URLs based on user settings
async function openUrls(urls, settings) {
    const removeDuplicates = settings.removeDuplicates || true;
    const focusFirstTab = settings.focusFirstTab || true;
    const maxTabs = settings.maxTabs || 20;
    const openMode = settings.openMode || "normal";

    if (removeDuplicates) {
        urls = [...new Set(urls)];
    }

    if (urls.length === 0) {
        showBadge(0, true);
        return;
    }

    // Enforce max tabs limit
    if (urls.length > maxTabs) {
        urls = urls.slice(0, maxTabs);
    }

    const newTabIds = [];

    if (openMode === "window") {
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
        for (let i = 0; i < urls.length; i++) {
            const newTab = await chrome.tabs.create({
                url: urls[i],
                active: (i === 0 && focusFirstTab)
            });
            newTabIds.push(newTab.id);
        }
    }

    if (openMode === "group" && newTabIds.length > 0) {
        const groupId = await chrome.tabs.group({ tabIds: newTabIds });
        chrome.tabGroups.update(groupId, {
            title: "Links",
            collapsed: false
        });
    }

    showBadge(newTabIds.length);
}

// Process found URLs (preview or open directly)
async function processUrls(urls, tabId, fallbackText) {
    if (!urls || urls.length === 0) {
        if (fallbackText) {
            urls = extractUrlsFromText(fallbackText);
        }
    }

    if (!urls || urls.length === 0) {
        showBadge(0, true);
        return;
    }

    const settings = await loadSettings();

    if (settings.showPreview) {
        // Apply deduplication and max tabs before showing preview
        let previewUrls = [...urls];

        if (settings.removeDuplicates) {
            previewUrls = [...new Set(previewUrls)];
        }

        if (previewUrls.length > settings.maxTabs) {
            previewUrls = previewUrls.slice(0, settings.maxTabs);
        }

        // Show preview overlay — the overlay will send OPEN_CONFIRMED_LINKS when confirmed
        await showPreview(tabId, previewUrls);
    } else {
        // Open directly
        await openUrls(urls, settings);
    }
}

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== "open-links-in-selection") return;

    let urls = await getLinksFromSelection(tab.id);
    const fallbackText = info.selectionText || "";

    await processUrls(urls, tab.id, fallbackText);
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    if (command === "open-links") {
        let urls = await getLinksFromSelection(tab.id);
        await processUrls(urls, tab.id, null);
        return;
    }

    if (command === "copy-links") {
        let urls = await getLinksFromSelection(tab.id);

        if (!urls || urls.length === 0) {
            showBadge(0, true);
            return;
        }

        const settings = await loadSettings();
        if (settings.removeDuplicates) {
            urls = [...new Set(urls)];
        }

        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (text) => {
                    navigator.clipboard.writeText(text);
                },
                args: [urls.join("\n")]
            });
            showBadge(urls.length);

            // Show toast notification
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (count) => {
                    const existing = document.getElementById("link-grab-toast");
                    if (existing) existing.remove();

                    const toast = document.createElement("div");
                    toast.id = "link-grab-toast";
                    toast.textContent = `${count} link${count === 1 ? "" : "s"} copied to clipboard`;
                    toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            background: #323232;
            color: #fff;
            padding: 12px 24px;
            border-radius: 8px;
            font-family: "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            z-index: 2147483647;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: loToastIn 0.2s ease;
          `;

                    const style = document.createElement("style");
                    style.textContent = `
            @keyframes loToastIn {
              from { opacity: 0; transform: translateX(-50%) translateY(8px); }
              to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
          `;
                    toast.appendChild(style);
                    document.body.appendChild(toast);

                    setTimeout(() => {
                        toast.style.opacity = "0";
                        toast.style.transition = "opacity 0.2s ease";
                        setTimeout(() => toast.remove(), 200);
                    }, 2000);
                },
                args: [urls.length]
            });
        } catch (e) {
            console.warn("Could not copy to clipboard:", e.message);
            showBadge(0, true);
        }
        return;
    }
});

// Handle confirmed links from preview overlay
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "SELECTION_LINK_COUNT") {
        updateContextMenuTitle(message.count);
        sendResponse({ success: true });
        return true;
    }

    if (message.type === "OPEN_CONFIRMED_LINKS") {
        loadSettings().then(settings => {
            // Don't re-deduplicate or re-slice — user already confirmed these
            openUrls(message.urls, {
                removeDuplicates: false,
                focusFirstTab: settings.focusFirstTab,
                maxTabs: 999,
                openMode: settings.openMode
            });
        });
        sendResponse({ success: true });
        return true;
    }
});