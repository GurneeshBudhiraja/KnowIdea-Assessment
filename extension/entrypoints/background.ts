export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  // opens the sidepanel
  browser.action.onClicked.addListener((tab) => {
    if (tab.id) {
      browser.sidePanel.open({ windowId: tab.windowId });
    }
  });
});
