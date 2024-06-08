chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installation successful.");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "saveData") {
    try {
      chrome.storage.local.set({ data: message.data }, () => {
        sendResponse({ status: "success" });
      });
    } catch (error) {
      console.error("Failed to save data:", error);
      sendResponse({ status: "failure" });
    }
    return true; // Indicates an asynchronous sendResponse call
  } else if (message.action === "loadData") {
    chrome.storage.local.get("data", (result) => {
      sendResponse({ data: result.data });
    });
    return true; // Indicates an asynchronous sendResponse call
  }
});
