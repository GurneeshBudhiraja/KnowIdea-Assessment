import { GMAIL_TEXTAREA_CLASS_NAME } from "@/constants";

// 300ms delay time for the gmail input
const DELAY_TIME = 300

export default defineContentScript({
  matches: ["https://mail.google.com/*"],
  main() {
    console.log("Content script loaded");

    // message listener for the background script
    browser.runtime.onMessage.addListener((message: any) => {
      console.log("Received message from background script", message);
      if (message.type === 'START_LISTENING') {
        console.log("Received START_LISTENING message");
        startListeningToTextarea();
      }
    });

    function startListeningToTextarea() {
      const gmailParentElement = document.getElementsByClassName(GMAIL_TEXTAREA_CLASS_NAME);
      if (gmailParentElement.length > 0) {
        const gmailTextArea = gmailParentElement[0] as HTMLElement;
        if (gmailTextArea) {
          console.log("found the gmail textarea");
          let inputTimeout: NodeJS.Timeout;
          gmailTextArea.addEventListener("input", (event) => {
            clearTimeout(inputTimeout);
            const target = event.target as HTMLElement;
            inputTimeout = setTimeout(() => {
              console.log("Text content updated:", target.textContent || target.innerText);
            }, DELAY_TIME);
          });
        }
      }
    }
  },
});
