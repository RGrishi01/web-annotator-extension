document.getElementById("pen-button").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "pen" });
  });
});

document.getElementById("highlight-button").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "highlight-btn" });
  });
});

document.getElementById("save-button").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "save" });
  });
});

let intervalId = null;

document.getElementById("undo-button").addEventListener("mousedown", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "undo-btn" });
  });
});

document.getElementById("highlight-button").addEventListener("click", () => {
  document.getElementById("color-selector").style.display = "flex";
});

document.querySelectorAll(".color-button").forEach((button) => {
  button.addEventListener("click", () => {
    const selectedColor = button.getAttribute("data-color");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "highlight-btn", color: selectedColor });
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const highlightButton = document.getElementById("highlight-button");
  const colorSelector = document.getElementById("color-selector");

  // Show color selector when highlight button is hovered
  highlightButton.addEventListener("mouseover", () => {
    colorSelector.style.display = "block";
  });

  // Hide color selector when mouse leaves the color selector
  colorSelector.addEventListener("mouseleave", () => {
    colorSelector.style.display = "none";
  });
});
