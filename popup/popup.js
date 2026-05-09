const removeDuplicatesCheckbox = document.getElementById("remove-duplicates");
const focusFirstTabCheckbox = document.getElementById("focus-first-tab");
const maxTabsInput = document.getElementById("max-tabs");
const showPreviewCheckbox = document.getElementById("show-preview");
const segmentedControl = document.getElementById("open-mode");
const segments = segmentedControl.querySelectorAll(".segment");
const groupNameSection = document.getElementById("group-name-section");
const groupNameInput = document.getElementById("group-name");

// Load saved settings
async function loadSettings() {
    const data = await chrome.storage.local.get([
        "removeDuplicates",
        "focusFirstTab",
        "maxTabs",
        "showPreview",
        "openMode",
        "groupName"
    ]);

    removeDuplicatesCheckbox.checked = data.removeDuplicates !== false;
    focusFirstTabCheckbox.checked = data.focusFirstTab !== false;
    maxTabsInput.value = data.maxTabs || 20;
    showPreviewCheckbox.checked = data.showPreview !== false;
    groupNameInput.value = data.groupName || "";

    const openMode = data.openMode || "normal";
    segments.forEach(seg => {
        const isActive = seg.dataset.value === openMode;
        seg.classList.toggle("active", isActive);
        seg.setAttribute("aria-checked", isActive);
    });

    groupNameSection.classList.toggle("collapsed", openMode !== "group");
}

// Save settings
async function saveSettings() {
    const activeSegment = segmentedControl.querySelector(".segment.active");
    const openMode = activeSegment ? activeSegment.dataset.value : "normal";

    let maxTabs = parseInt(maxTabsInput.value);
    if (isNaN(maxTabs) || maxTabs < 1) maxTabs = 1;
    if (maxTabs > 100) maxTabs = 100;
    maxTabsInput.value = maxTabs;

    await chrome.storage.local.set({
        removeDuplicates: removeDuplicatesCheckbox.checked,
        focusFirstTab: focusFirstTabCheckbox.checked,
        maxTabs,
        showPreview: showPreviewCheckbox.checked,
        openMode,
        groupName: groupNameInput.value
    });
}

// Collapsible sections
document.querySelectorAll(".section-toggle").forEach(toggle => {
    toggle.addEventListener("click", () => {
        const targetId = toggle.dataset.target;
        const content = document.getElementById(targetId);
        const isExpanded = toggle.getAttribute("aria-expanded") === "true";

        toggle.setAttribute("aria-expanded", !isExpanded);
        content.classList.toggle("collapsed", isExpanded);

        // Remember state
        chrome.storage.local.set({ [`collapsed_${targetId}`]: isExpanded });
    });
});

// Disable all transitions on load
document.body.classList.add("no-transitions");

// Restore collapsed state
async function restoreCollapsedState() {
    const toggles = document.querySelectorAll(".section-toggle");

    for (const toggle of toggles) {
        const targetId = toggle.dataset.target;
        const data = await chrome.storage.local.get([`collapsed_${targetId}`]);
        const isCollapsed = data[`collapsed_${targetId}`] || false;

        if (isCollapsed) {
            toggle.setAttribute("aria-expanded", "false");
            document.getElementById(targetId).classList.add("collapsed");
        }
    }
}

restoreCollapsedState();

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
        segments.forEach(s => {
            s.classList.remove("active");
            s.setAttribute("aria-checked", "false");
        });
        segment.classList.add("active");
        segment.setAttribute("aria-checked", "true");

        groupNameSection.classList.toggle("collapsed", segment.dataset.value !== "group");

        saveSettings();
    });
});

// Keyboard navigation for segmented control (arrow keys)
segmentedControl.addEventListener("keydown", (e) => {
    const segmentArray = Array.from(segments);
    const currentIndex = segmentArray.findIndex(s => s.classList.contains("active"));

    let newIndex = currentIndex;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        newIndex = (currentIndex + 1) % segmentArray.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        newIndex = (currentIndex - 1 + segmentArray.length) % segmentArray.length;
    } else {
        return;
    }

    segmentArray[currentIndex].classList.remove("active");
    segmentArray[currentIndex].setAttribute("aria-checked", "false");
    segmentArray[currentIndex].setAttribute("tabindex", "-1");

    segmentArray[newIndex].classList.add("active");
    segmentArray[newIndex].setAttribute("aria-checked", "true");
    segmentArray[newIndex].setAttribute("tabindex", "0");
    segmentArray[newIndex].focus();

    saveSettings();
});

// Save on any change
removeDuplicatesCheckbox.addEventListener("change", saveSettings);
focusFirstTabCheckbox.addEventListener("change", saveSettings);
maxTabsInput.addEventListener("change", saveSettings);
showPreviewCheckbox.addEventListener("change", saveSettings);
groupNameInput.addEventListener("input", saveSettings);

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
async function displayShortcuts() {
    const commands = await chrome.commands.getAll();

    const openCommand = commands.find(cmd => cmd.name === "open-links");
    const copyCommand = commands.find(cmd => cmd.name === "copy-links");

    const openDisplay = document.getElementById("open-shortcut-display");
    const copyDisplay = document.getElementById("copy-shortcut-display");

    if (openCommand && openCommand.shortcut) {
        openDisplay.innerHTML = `<span class="shortcut-key">${openCommand.shortcut}</span>`;
    } else {
        openDisplay.textContent = "Not set";
    }

    if (copyCommand && copyCommand.shortcut) {
        copyDisplay.innerHTML = `<span class="shortcut-key">${copyCommand.shortcut}</span>`;
    } else {
        copyDisplay.textContent = "Not set";
    }
}

// Change shortcut button
document.getElementById("change-shortcut").addEventListener("click", () => {
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});

// Initial load
loadSettings().then(() => {
    // Re-enable transitions after everything is set
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.body.classList.remove("no-transitions");
        });
    });
});
updateExtensionIcon();
displayShortcuts();