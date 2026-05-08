const removeDuplicatesCheckbox = document.getElementById("remove-duplicates");
const focusFirstTabCheckbox = document.getElementById("focus-first-tab");
const segmentedControl = document.getElementById("open-mode");
const segments = segmentedControl.querySelectorAll(".segment");

// Load saved settings
async function loadSettings() {
    const data = await chrome.storage.local.get([
        "removeDuplicates",
        "focusFirstTab",
        "openMode"
    ]);

    removeDuplicatesCheckbox.checked = data.removeDuplicates !== false;
    focusFirstTabCheckbox.checked = data.focusFirstTab || false;

    const openMode = data.openMode || "normal";
    segments.forEach(seg => {
        seg.classList.toggle("active", seg.dataset.value === openMode);
    });
}

// Save settings
async function saveSettings() {
    const activeSegment = segmentedControl.querySelector(".segment.active");
    const openMode = activeSegment ? activeSegment.dataset.value : "normal";

    await chrome.storage.local.set({
        removeDuplicates: removeDuplicatesCheckbox.checked,
        focusFirstTab: focusFirstTabCheckbox.checked,
        openMode
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

// Segmented control handler
segments.forEach(segment => {
    segment.addEventListener("click", () => {
        segments.forEach(s => s.classList.remove("active"));
        segment.classList.add("active");
        saveSettings();
    });
});

// Save on any change
removeDuplicatesCheckbox.addEventListener("change", saveSettings);
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

// Display current keyboard shortcut
async function displayShortcut() {
    const commands = await chrome.commands.getAll();
    const openLinksCommand = commands.find(cmd => cmd.name === "open-links");
    const shortcutDisplay = document.getElementById("shortcut-display");

    if (openLinksCommand && openLinksCommand.shortcut) {
        shortcutDisplay.innerHTML = `<span class="shortcut-key">${openLinksCommand.shortcut}</span>`;
    } else {
        shortcutDisplay.textContent = "Not set";
    }
}

// Change shortcut button
document.getElementById("change-shortcut").addEventListener("click", () => {
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});

// Initial load
loadSettings();
updateExtensionIcon();
displayShortcut();