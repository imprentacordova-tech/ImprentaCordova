// background.js
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ 
        automationStatus: 'stopped',
        stats: { processed: 0, errors: 0 }
    });
});

// Listener for messages from popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "start_automation") {
        chrome.storage.local.set({ automationStatus: 'running' }, () => {
             // Inject content script if needed or just let the tabs update
             // Often better to query the active tab and send a message
             chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                 if(tabs[0]) {
                     chrome.tabs.sendMessage(tabs[0].id, {action: "start_process"});
                 }
             });
        });
    } else if (request.action === "stop_automation") {
        chrome.storage.local.set({ automationStatus: 'stopped' });
    }
});
