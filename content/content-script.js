// Prevent double-injection
if (!window.__linkOpenerInjected) {
    window.__linkOpenerInjected = true;

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === "GET_SELECTED_LINKS") {
            const selection = window.getSelection();

            if (!selection || selection.rangeCount === 0) {
                sendResponse({ urls: [] });
                return;
            }

            const urls = [];

            // Get all ranges in the selection
            for (let i = 0; i < selection.rangeCount; i++) {
                const range = selection.getRangeAt(i);
                const container = document.createElement("div");
                container.appendChild(range.cloneContents());

                // Extract href from all <a> tags in the selection
                const links = container.querySelectorAll("a[href]");
                links.forEach(link => {
                    const href = link.href;
                    if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
                        urls.push(href);
                    }
                });

                // Also extract raw URLs from the text content
                const textContent = container.textContent || "";
                const urlPattern = /https?:\/\/[^\s<>"')\]]+/gi;
                const textUrls = textContent.match(urlPattern) || [];
                textUrls.forEach(url => {
                    const cleaned = url.replace(/[.,;:!?)}\]]+$/, "");
                    urls.push(cleaned);
                });
            }

            sendResponse({ urls });
            return;
        }
    });
}
