import { GMAIL_COMPOSE_URL } from "@/constants";

export default defineBackground(() => {
  console.log("Background script loaded");

  // opens the sidepanel
  browser.action.onClicked.addListener((tab) => {
    if (tab.id) {
      browser.sidePanel.open({ windowId: tab.windowId });
    }
  });

  // watch for tab updates and send message to content script when on compose URL
  browser.tabs.onUpdated.addListener(async (tabId: number, changeInfo: any, tab: any) => {
    console.log(`${tab.url ?? "New tab"} opened`);
    if (changeInfo.status === 'complete' && tab.url?.startsWith(GMAIL_COMPOSE_URL)) {
      try {
        console.log("Sent the message to the content script");
        await browser.tabs.sendMessage(tabId, { type: 'START_LISTENING' })
        return;
      } catch (error) {
        console.log("Error sending message to content script", { message: (error as Error).message });
      }

    }
  });
});
