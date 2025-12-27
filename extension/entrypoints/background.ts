import { GMAIL_COMPOSE_URL } from "@/constants";
import { MessageType } from "./content.ts";


let isSidepanelOpen = false;
let activeTabId: number | null = null;

export default defineBackground(() => {
  console.log("Background script loaded");

  // opens the sidepanel
  browser.action.onClicked.addListener((tab: any) => {
    if (tab.id) {
      browser.sidePanel.open({ windowId: tab.windowId });
      isSidepanelOpen = true;
      activeTabId = tab.id;
    }
  });

  // listen for messages from content script
  browser.runtime.onMessage.addListener(async (message: any, sender: any) => {
    console.log("Background received message:", message);

    if (message.type === MessageType.WAKE_UP_DETECTED) {
      console.log("opening sidepanel");
      if (sender.tab?.windowId) {
        try {
          await browser.sidePanel.open({ windowId: sender.tab.windowId });
          isSidepanelOpen = true;
          activeTabId = sender.tab.id;
        } catch (error) {
          console.log("🔴 Error opening sidepanel", (error as Error).message);
        }
      }
    }
  });

  // port connection added to check when the sidepanel is closed
  browser.runtime.onConnect.addListener((port: any) => {
    if (port.name === "sidepanel") {
      isSidepanelOpen = true;

      port.onDisconnect.addListener(async () => {
        isSidepanelOpen = false;

        // sends message to the content script that the sidepanel has been closed to remove the wake up text from the email body
        if (activeTabId) {
          try {
            await browser.tabs.sendMessage(activeTabId, { type: MessageType.SIDEPANEL_CLOSED });
          } catch (error) {
            console.log("🔴 Error sending sidepanel closed message", (error as Error).message);
          }
        }
      });
    }
  });

  // listens for tab updates and send message to the content script when on compose URL
  browser.tabs.onUpdated.addListener(async (tabId: number, changeInfo: any, tab: any) => {
    console.log(`${tab.url ?? "New tab"} opened`);
    if (changeInfo.status === 'complete' && tab.url?.startsWith(GMAIL_COMPOSE_URL)) {
      try {
        await browser.tabs.sendMessage(tabId, { type: MessageType.START_LISTENING });
        activeTabId = tabId;
        return;
      } catch (error) {
        console.log("🔴 Error sending message to content script", { message: (error as Error).message });
      }
    }
  });
});
