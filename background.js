// background.js
chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes('web.whatsapp.com')) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  } else {
    console.log('This extension only works on web.whatsapp.com.');
  }
});
