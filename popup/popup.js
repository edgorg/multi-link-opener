const removeDuplicatesCheckbox = document.getElementById("remove-duplicates");
const openInGroupCheckbox = document.getElementById("open-in-group");
const focusFirstTabCheckbox = document.getElementById("focus-first-tab");

// Load saved settings
async function loadSettings() {
    const data = await chrome.storage.local.get([
        "removeDuplicates",
        "openInGroup",
        "focusFirstTab"
    ]);

    removeDuplicatesCheckbox.checked = data.removeDuplicates !== false; // Default true
    openInGroupCheckbox.checked = data.openInGroup || false;
    focusFirstTabCheckbox.checked = data.focusFirstTab || false;
}

// Save settings
async function saveSettings() {
    await chrome.storage.local.set({
        removeDuplicates: removeDuplicatesCheckbox.checked,
        openInGroup: openInGroupCheckbox.checked,
        focusFirstTab: focusFirstTabCheckbox.checked
    });
}

// Make settings items toggle their checkbox when clicked anywhere on the row
document.querySelectorAll(".settings-item").forEach(item => {
    item.addEventListener("click", (e) => {
        if (e.target.type === "checkbox") return;

        const checkboxId = item.dataset.for;
        const checkbox = document.getElementById(checkboxId);
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event("change"));
    });
});

// Save on any change
removeDuplicatesCheckbox.addEventListener("change", saveSettings);
openInGroupCheckbox.addEventListener("change", saveSettings);
focusFirstTabCheckbox.addEventListener("change", saveSettings);

// Update extension icon based on current theme
function updateExtensionIcon() {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const suffix = isDark ? "dark" : "light";
    chrome.action.setIcon({
        path: {
            "16": chrome.runtime.getURL(`icons/icon16-${suffix}.png`),
            "48": chrome.runtime.getURL(`icons/icon48-${suffix}.png`),
            "128": chrome.runtime.getURL(`icons/icon128-${suffix}.png`)
        }
    });
}

// Initial load
loadSettings();
updateExtensionIcon();