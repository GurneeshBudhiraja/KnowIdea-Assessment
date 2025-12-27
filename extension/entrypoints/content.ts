import { GMAIL_TEXTAREA_CLASS_NAME, WAKE_UP_TEXT } from "../constants.ts";

export enum MessageType {
  START_LISTENING = "START_LISTENING",
  WAKE_UP_DETECTED = "WAKE_UP_DETECTED",
  SIDEPANEL_CLOSED = "SIDEPANEL_CLOSED",
}

// WXT types
declare const defineContentScript: any;
declare const browser: any;

// 300ms delay time for the gmail input
const DELAY_TIME = 300;

// Reference to the textarea element for removing wake up text
let currentTextarea: HTMLElement | null = null;

export default defineContentScript({
  matches: ["https://mail.google.com/*"],

  async main() {
    console.log("Content script loaded");

    // checks for the wake up text in the email body
    let wakeUpDetected = false;

    // listens for the message from the background script
    browser.runtime.onMessage.addListener((message: any) => {
      console.log("Received message from background script", message);

      if (message.type === MessageType.START_LISTENING) {
        console.log("Received START_LISTENING message");
        startListeningToTextarea();
      }

      if (message.type === MessageType.SIDEPANEL_CLOSED) {
        console.log("Received SIDEPANEL_CLOSED message");
        removeWakeUpTextFromEmailBody();
        wakeUpDetected = false;
      }
    });

    function removeWakeUpTextFromEmailBody() {
      if (currentTextarea) {
        const textContent =
          currentTextarea.textContent || currentTextarea.innerText || "";
        if (textContent.trim().startsWith(WAKE_UP_TEXT)) {
          // remove the wake up text from the email body
          const newText = textContent.replace(WAKE_UP_TEXT, "").trimStart();
          currentTextarea.textContent = newText;
        }
      }
    }

    function startListeningToTextarea() {
      const gmailParentElement = document.getElementsByClassName(
        GMAIL_TEXTAREA_CLASS_NAME
      );
      if (gmailParentElement.length > 0) {
        const gmailTextArea = gmailParentElement[0] as HTMLElement;

        if (gmailTextArea) {
          console.log("Found the gmail textarea");

          // timeout for the user input
          let inputTimeout: NodeJS.Timeout;

          // checks if the text starts with wake up text and notifies background
          const checkForWakeUpText = () => {
            clearTimeout(inputTimeout);
            inputTimeout = setTimeout(async () => {
              const textarea =
                (gmailTextArea.querySelector(
                  '[contenteditable="true"]'
                ) as HTMLElement) || gmailTextArea;

              // Store reference for later use
              currentTextarea = textarea;

              const textContent =
                textarea?.textContent?.trim() ||
                textarea?.innerText?.trim() ||
                "";

              console.log("Text content updated:", textContent);

              if (textContent.startsWith(WAKE_UP_TEXT) && !wakeUpDetected) {
                console.log("Wake up text detected, notifying background");
                wakeUpDetected = true;
                try {
                  await browser.runtime.sendMessage({
                    type: MessageType.WAKE_UP_DETECTED,
                  });
                } catch (error) {
                  console.log(
                    "Error sending message to background:",
                    (error as Error).message
                  );
                  wakeUpDetected = false;
                }
              }
            }, DELAY_TIME);
          };

          gmailTextArea.addEventListener("input", checkForWakeUpText);
        }
      }
    }
  },
});
