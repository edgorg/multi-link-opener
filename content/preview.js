(function () {
    // Remove existing preview if any
    const existing = document.getElementById("link-opener-preview");
    if (existing) existing.remove();

    // Remove any previous listener
    if (window.__linkOpenerPreviewListener) {
        chrome.runtime.onMessage.removeListener(window.__linkOpenerPreviewListener);
    }

    function truncateUrl(url) {
        try {
            const parsed = new URL(url);
            const display = parsed.hostname + parsed.pathname;
            return display.length > 60 ? display.substring(0, 57) + "..." : display;
        } catch {
            return url.length > 60 ? url.substring(0, 57) + "..." : url;
        }
    }

    function showPreview(urls) {
        // Remove existing preview if somehow still there
        const existing = document.getElementById("link-opener-preview");
        if (existing) existing.remove();

        const overlay = document.createElement("div");
        overlay.id = "link-opener-preview";
        overlay.innerHTML = `
      <div class="lo-backdrop"></div>
      <div class="lo-panel">
        <div class="lo-header">
          <span class="lo-title">Open ${urls.length} link${urls.length === 1 ? "" : "s"}?</span>
          <button class="lo-close" title="Cancel">✕</button>
        </div>
        <div class="lo-list">
          ${urls.map((url, i) => `
            <label class="lo-item">
              <input type="checkbox" checked data-index="${i}" data-url="${url}">
              <span class="lo-url" title="${url}">${truncateUrl(url)}</span>
            </label>
          `).join("")}
        </div>
        <div class="lo-footer">
          <div class="lo-select-controls">
            <button class="lo-select-all">Select all</button>
            <button class="lo-select-none">Select none</button>
          </div>
          <div class="lo-actions">
            <button class="lo-cancel">Cancel</button>
            <button class="lo-confirm">Open selected</button>
          </div>
        </div>
      </div>
    `;

        const style = document.createElement("style");
        style.textContent = `
      #link-opener-preview {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 2147483647;
        font-family: "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
      }
      #link-opener-preview .lo-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.4);
      }
      #link-opener-preview .lo-panel {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
        width: 480px;
        max-width: 90vw;
        max-height: 70vh;
        display: flex;
        flex-direction: column;
        animation: lo-fadeIn 0.15s ease;
      }
      @keyframes lo-fadeIn {
        from { opacity: 0; transform: translate(-50%, -50%) scale(0.96); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }
      #link-opener-preview .lo-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid #dadce0;
      }
      #link-opener-preview .lo-title {
        font-size: 14px;
        font-weight: 500;
        color: #202124;
      }
      #link-opener-preview .lo-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #5f6368;
        padding: 4px 8px;
        border-radius: 50%;
        line-height: 1;
      }
      #link-opener-preview .lo-close:hover {
        background: #f1f3f4;
      }
      #link-opener-preview .lo-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px 12px;
      }
      #link-opener-preview .lo-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.1s ease;
      }
      #link-opener-preview .lo-item:hover {
        background: #f8f9fa;
      }
      #link-opener-preview .lo-item input[type="checkbox"] {
        accent-color: #1a73e8;
        width: 14px;
        height: 14px;
        flex-shrink: 0;
      }
      #link-opener-preview .lo-url {
        color: #1a73e8;
        font-size: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      #link-opener-preview .lo-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 20px;
        border-top: 1px solid #dadce0;
      }
      #link-opener-preview .lo-select-controls {
        display: flex;
        gap: 8px;
      }
      #link-opener-preview .lo-select-all,
      #link-opener-preview .lo-select-none {
        background: none;
        border: none;
        color: #5f6368;
        font-size: 11px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
      }
      #link-opener-preview .lo-select-all:hover,
      #link-opener-preview .lo-select-none:hover {
        background: #f1f3f4;
        color: #202124;
      }
      #link-opener-preview .lo-actions {
        display: flex;
        gap: 8px;
      }
      #link-opener-preview .lo-cancel {
        background: none;
        border: 1px solid #dadce0;
        color: #5f6368;
        font-size: 12px;
        font-weight: 500;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.1s ease;
      }
      #link-opener-preview .lo-cancel:hover {
        background: #f1f3f4;
      }
      #link-opener-preview .lo-confirm {
        background: #1a73e8;
        border: none;
        color: #fff;
        font-size: 12px;
        font-weight: 500;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.1s ease;
      }
      #link-opener-preview .lo-confirm:hover {
        background: #1557b0;
      }
      #link-opener-preview .lo-confirm:disabled {
        background: #dadce0;
        color: #5f6368;
        cursor: default;
      }
      @media (prefers-color-scheme: dark) {
        #link-opener-preview .lo-panel {
          background: #292a2d;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        }
        #link-opener-preview .lo-header {
          border-bottom-color: #3c4043;
        }
        #link-opener-preview .lo-title {
          color: #e8eaed;
        }
        #link-opener-preview .lo-close {
          color: #9aa0a6;
        }
        #link-opener-preview .lo-close:hover {
          background: #35363a;
        }
        #link-opener-preview .lo-item:hover {
          background: #35363a;
        }
        #link-opener-preview .lo-item input[type="checkbox"] {
          accent-color: #8ab4f8;
        }
        #link-opener-preview .lo-url {
          color: #8ab4f8;
        }
        #link-opener-preview .lo-footer {
          border-top-color: #3c4043;
        }
        #link-opener-preview .lo-select-all,
        #link-opener-preview .lo-select-none {
          color: #9aa0a6;
        }
        #link-opener-preview .lo-select-all:hover,
        #link-opener-preview .lo-select-none:hover {
          background: #35363a;
          color: #e8eaed;
        }
        #link-opener-preview .lo-cancel {
          border-color: #3c4043;
          color: #9aa0a6;
        }
        #link-opener-preview .lo-cancel:hover {
          background: #35363a;
        }
        #link-opener-preview .lo-confirm {
          background: #8ab4f8;
          color: #202124;
        }
        #link-opener-preview .lo-confirm:hover {
          background: #aecbfa;
        }
        #link-opener-preview .lo-confirm:disabled {
          background: #3c4043;
          color: #5f6368;
        }
      }
    `;

        overlay.appendChild(style);
        document.body.appendChild(overlay);

        // Event handlers
        const confirmBtn = overlay.querySelector(".lo-confirm");
        const cancelBtn = overlay.querySelector(".lo-cancel");
        const closeBtn = overlay.querySelector(".lo-close");
        const selectAllBtn = overlay.querySelector(".lo-select-all");
        const selectNoneBtn = overlay.querySelector(".lo-select-none");
        const checkboxes = overlay.querySelectorAll('input[type="checkbox"]');

        function updateConfirmButton() {
            const checked = overlay.querySelectorAll('input[type="checkbox"]:checked');
            confirmBtn.textContent = `Open ${checked.length} link${checked.length === 1 ? "" : "s"}`;
            confirmBtn.disabled = checked.length === 0;
        }

        function close() {
            overlay.remove();
        }

        function confirm() {
            const checked = overlay.querySelectorAll('input[type="checkbox"]:checked');
            const selectedUrls = Array.from(checked).map(cb => cb.dataset.url);
            close();

            chrome.runtime.sendMessage({
                type: "OPEN_CONFIRMED_LINKS",
                urls: selectedUrls
            });
        }

        checkboxes.forEach(cb => {
            cb.addEventListener("change", updateConfirmButton);
        });

        selectAllBtn.addEventListener("click", () => {
            checkboxes.forEach(cb => { cb.checked = true; });
            updateConfirmButton();
        });

        selectNoneBtn.addEventListener("click", () => {
            checkboxes.forEach(cb => { cb.checked = false; });
            updateConfirmButton();
        });

        confirmBtn.addEventListener("click", confirm);
        cancelBtn.addEventListener("click", close);
        closeBtn.addEventListener("click", close);

        overlay.querySelector(".lo-backdrop").addEventListener("click", close);

        const escHandler = (e) => {
            if (e.key === "Escape") {
                close();
                document.removeEventListener("keydown", escHandler);
                document.removeEventListener("keydown", enterHandler);
            }
        };

        const enterHandler = (e) => {
            if (e.key === "Enter" && !confirmBtn.disabled) {
                confirm();
                document.removeEventListener("keydown", escHandler);
                document.removeEventListener("keydown", enterHandler);
            }
        };

        document.addEventListener("keydown", escHandler);
        document.addEventListener("keydown", enterHandler);

        updateConfirmButton();
    }

    // Set up listener
    window.__linkOpenerPreviewListener = (message, sender, sendResponse) => {
        if (message.type === "SHOW_PREVIEW") {
            showPreview(message.urls);
            sendResponse({ success: true });
        }
    };

    chrome.runtime.onMessage.addListener(window.__linkOpenerPreviewListener);
})();