(function () {
    if (window.__linkGrabSelectionMonitor) return;
    window.__linkGrabSelectionMonitor = true;

    let debounceTimer = null;

    function countLinksInSelection() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
            chrome.runtime.sendMessage({ type: "SELECTION_LINK_COUNT", count: 0 });
            return;
        }

        const urls = new Set();

        for (let i = 0; i < selection.rangeCount; i++) {
            const range = selection.getRangeAt(i);
            const container = document.createElement("div");
            container.appendChild(range.cloneContents());

            // Extract hrefs from anchor tags
            const links = container.querySelectorAll("a[href]");
            links.forEach(link => {
                let href = link.href;
                href = href.replace(/\/+$/, "");
                if (href.startsWith("http://") || href.startsWith("https://")) {
                    urls.add(href);
                }
            });

            // Extract raw URLs from text
            const textContent = container.textContent || "";
            const urlPattern = /https?:\/\/[^\s<>"')\]]+/gi;
            const textUrls = textContent.match(urlPattern) || [];
            textUrls.forEach(url => {
                urls.add(url.replace(/[.,;:!?)}\]]+$/, ""));
            });
        }

        chrome.runtime.sendMessage({ type: "SELECTION_LINK_COUNT", count: urls.size });
    }

    document.addEventListener("selectionchange", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(countLinksInSelection, 300);
    });
})();
