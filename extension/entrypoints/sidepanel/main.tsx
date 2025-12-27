import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "../main.css";

declare const browser: {
  runtime: {
    connect: (options: { name: string }) => {
      onDisconnect: {
        addListener: (callback: () => void) => void;
      };
    };
  };
};

// establishes connection with background script to detect when sidepanel closes
const port = browser.runtime.connect({ name: "sidepanel" });
port.onDisconnect.addListener(() => {
  console.log("port disconnected");
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.Fragment>
    <App />
  </React.Fragment>
);
