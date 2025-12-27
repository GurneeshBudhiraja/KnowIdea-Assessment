import { EXTENSION_LOCAL_STORAGE_KEYS, GMAIL_COMPOSE_URL } from "@/constants";
import { ApplicationPage } from "@/entrypoints/sidepanel/App";
import {
  Loader2,
  LogIn,
  LogOut,
  Mail,
  Settings,
  AlertTriangle,
  X,
  Link,
  Unlink,
} from "lucide-react";
import React, { Dispatch, SetStateAction, useState, useEffect } from "react";
import ChatInterface from "./ChatInterface.tsx";

declare const browser: any;

export enum AppConnectorType {
  WORKDAY = "workday",
  QUICKBOOKS = "quickbooks",
}

export interface AppConnector {
  name: AppConnectorType;
  isConnected: boolean;
}

function HomePage({
  setCurrentPage,
}: {
  setCurrentPage: Dispatch<SetStateAction<ApplicationPage>>;
}) {
  // loading state for the page
  const [isLoading, setIsLoading] = useState(true);
  // track the user's login status
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  // track the user's logging in process
  const [isUserLoggingIn, setIsUserLoggingIn] = useState(false);
  // track if user is on the correct Gmail URL
  const [isOnGmailCompose, setIsOnGmailCompose] = useState(false);
  // if email is opened or not
  const [emailOpened, setEmailOpened] = useState(false);
  // the app connectors
  const [appConnnectors, setAppConnnectors] = useState<AppConnector[]>([]);
  // settings modal visibility
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // loading state for individual connectors
  const [loadingConnector, setLoadingConnector] =
    useState<AppConnectorType | null>(null);

  /**
   * checks current tab url and listens for the tab changes
   * */
  useEffect(() => {
    // check current tab url
    const checkCurrentTab = async () => {
      try {
        const tabs = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tabs[0]?.url) {
          const currentUrl = tabs[0].url;
          const isOnCorrectUrl = currentUrl.startsWith(GMAIL_COMPOSE_URL);
          setIsOnGmailCompose(isOnCorrectUrl);

          if (isOnCorrectUrl) {
            setEmailOpened(true);
          }
        }
      } catch (error) {
        console.log("Error checking tab URL: ", (error as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    checkCurrentTab();

    // tab updates
    const handleTabUpdate = (tabId: number, changeInfo: any, tab: any) => {
      if (changeInfo.url && tab.url?.startsWith(GMAIL_COMPOSE_URL)) {
        setIsOnGmailCompose(true);
        setEmailOpened(true);
      } else if (changeInfo.url) {
        setIsOnGmailCompose(false);
        setEmailOpened(false);
      }
    };

    browser.tabs.onUpdated.addListener(handleTabUpdate);

    return () => {
      browser.tabs.onUpdated.removeListener(handleTabUpdate);
    };
  }, []);

  // checks the user's login status and the app connectors state
  useEffect(() => {
    try {
      if (window) {
        const isUserLoggedIn = window.localStorage.getItem(
          EXTENSION_LOCAL_STORAGE_KEYS.IS_USER_LOGGED_IN
        );
        if (isUserLoggedIn === null) {
          setIsUserLoggedIn(false);
        } else {
          setIsUserLoggedIn(true);
          const appConnectors = window.localStorage.getItem(
            EXTENSION_LOCAL_STORAGE_KEYS.APP_CONNECTORS
          );
          if (appConnectors) {
            setAppConnnectors(JSON.parse(appConnectors));
          } else {
            setAppConnnectors([]);
          }
        }
      }
    } catch (error) {
      console.log("Error in HomePage.tsx: ", (error as Error).message);
    }
  }, []);

  const handleLogout = () => {
    window.localStorage.removeItem(
      EXTENSION_LOCAL_STORAGE_KEYS.IS_USER_LOGGED_IN
    );
    setIsUserLoggedIn(false);
  };

  /**
   * mimics the login process by adding a delay of 2 seconds
   */
  const handleLogin = async () => {
    setIsUserLoggingIn(true);
    window.localStorage.setItem(
      EXTENSION_LOCAL_STORAGE_KEYS.IS_USER_LOGGED_IN,
      "true"
    );
    // TODO: uncomment in production
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsUserLoggedIn(true);
    setIsUserLoggingIn(false);
  };

  /**
   * Redirects the user to the Gmail compose URL
   */
  const handleRedirectToGmail = async () => {
    try {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const currentTab = tabs[0];

      if (!currentTab?.url) {
        // creates a new gmail tab and redirects to it when there is no URL in the current tab
        await browser.tabs.create({ url: GMAIL_COMPOSE_URL });
        return;
      }

      const isOnGmail = currentTab.url.startsWith("https://mail.google.com/");

      if (isOnGmail) {
        // updates the url in the current tab itself when the user is on gmail
        await browser.tabs.update(currentTab.id, { url: GMAIL_COMPOSE_URL });
        return;
      }

      // creates a new gmail tab and redirects to it when the user is not on gmail and is on a different website
      await browser.tabs.create({ url: GMAIL_COMPOSE_URL });
    } catch (error) {
      console.log("Error redirecting to Gmail: ", (error as Error).message);
    }
  };

  // handles opening the settings modal
  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
  };

  // handles closing the settings modal
  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
  };

  // handles connecting/disconnecting an app
  const handleToggleConnector = async (connectorType: AppConnectorType) => {
    setLoadingConnector(connectorType);

    // Simulate API call with 2 second delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const existingConnector = appConnnectors.find(
      (c) => c.name === connectorType
    );

    let updatedConnectors: AppConnector[];

    if (existingConnector) {
      // toggle the connection status
      if (existingConnector.isConnected) {
        updatedConnectors = appConnnectors.filter(
          (c) => c.name !== connectorType
        );
      } else {
        updatedConnectors = appConnnectors.map((c) =>
          c.name === connectorType ? { ...c, isConnected: true } : c
        );
      }
    } else {
      updatedConnectors = [
        ...appConnnectors,
        { name: connectorType, isConnected: true },
      ];
    }

    window.localStorage.setItem(
      EXTENSION_LOCAL_STORAGE_KEYS.APP_CONNECTORS,
      JSON.stringify(updatedConnectors)
    );

    // update local states
    setAppConnnectors(updatedConnectors);
    setLoadingConnector(null);
  };

  // checks if a connector is connected
  const isConnectorConnected = (connectorType: AppConnectorType): boolean => {
    const connector = appConnnectors.find((c) => c.name === connectorType);
    return connector?.isConnected ?? false;
  };

  // settings modal component
  function SettingsModal() {
    if (!isSettingsOpen) return null;

    const connectors = [
      {
        type: AppConnectorType.WORKDAY,
        name: "Workday",
        description: "Connect your Workday account",
      },
      {
        type: AppConnectorType.QUICKBOOKS,
        name: "QuickBooks",
        description: "Connect your QuickBooks account",
      },
    ];

    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleCloseSettings}
        />

        {/* modal header */}
        <div className="relative bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-700">
            <h2 className="text-base font-medium text-zinc-100">
              App Connections
            </h2>
            <button
              onClick={handleCloseSettings}
              className="text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* app connectors list */}
          <div className="p-5 space-y-3">
            {connectors.map((connector) => {
              const isConnected = isConnectorConnected(connector.type);
              const isLoading = loadingConnector === connector.type;

              return (
                <div
                  key={connector.type}
                  className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-zinc-100 text-sm">
                      {connector.name}
                    </h3>
                    <p className="text-xs text-zinc-400 font-theme-ibm-mono">
                      {connector.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleConnector(connector.type)}
                    disabled={isLoading}
                    className={`ml-4 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
                      isLoading
                        ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                        : isConnected
                        ? "bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30"
                        : "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-600/30"
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isConnected ? (
                      <Unlink size={14} />
                    ) : (
                      <Link size={14} />
                    )}
                    <span className="font-medium text-xs font-theme-ibm-mono">
                      {isLoading
                        ? "..."
                        : isConnected
                        ? "Disconnect"
                        : "Connect"}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* footer */}
          <div className="px-5 py-4 border-t border-zinc-700 bg-zinc-800/30">
            <p className="text-sm text-zinc-500 text-center font-theme-ibm-mono">
              Connect your apps to enable AI-powered responses
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-4 relative">
      {/* settings modal */}
      <SettingsModal />

      {isUserLoggedIn && appConnnectors.length === 0 && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-500/90 text-yellow-950 px-4 py-2 flex items-center gap-2 text-sm font-medium">
          <AlertTriangle size={16} />
          <span>No apps connected.</span>
          <button
            onClick={handleOpenSettings}
            className="underline hover:no-underline font-semibold"
          >
            Go to Settings
          </button>
        </div>
      )}
      {isUserLoggedIn && (
        <header
          className={`flex items-center justify-between absolute ${
            appConnnectors.length === 0 ? "top-10" : "top-0"
          } right-0 p-4 w-full`}
        >
          <button onClick={handleOpenSettings}>
            <Settings size={18} />
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 p-2 rounded-md hover:opacity-80 font-theme-ibm-mono flex items-center gap-2"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </header>
      )}
      {isLoading && (
        <div className="h-full w-full flex items-center justify-center">
          <Loader2 className="animate-spin" size={32} strokeWidth={1.5} />
        </div>
      )}

      {!isLoading && !isUserLoggedIn ? (
        <div className="h-full w-full overflow-hidden relative">
          <header className="absolute top-0 left-0 ">
            <img src="/logo.png" alt="KnowIdea Logo" className="w-auto h-10" />
          </header>
          <div className="h-full w-full flex flex-col items-center justify-center gap-4">
            <p className="text-center max-w-md text-xl font-semibold">
              Please sign in with your KnowIdea account to continue.
            </p>
            <button
              onClick={handleLogin}
              disabled={isUserLoggingIn}
              className={`flex items-center gap-2 px-8 py-4 rounded-full font-theme-ibm-mono text-zinc-900 bg-white transition 
              ${
                isUserLoggingIn
                  ? "cursor-not-allowed opacity-80"
                  : "hover:opacity-90"
              }
              shadow-lg font-semibold text-zinc-900`}
            >
              {isUserLoggingIn ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              <span>
                {isUserLoggingIn ? "Signing in..." : "Sign in with KnowIdea"}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="h-full w-full flex flex-col">
          {!isOnGmailCompose ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <Mail className="w-20 aspect-square text-zinc-400" size={40} />
              <p className="text-center max-w-md text-lg font-medium">
                Compose a new email to get started
              </p>
              <button
                onClick={handleRedirectToGmail}
                className="flex items-center gap-2 px-8 py-4 rounded-full font-theme-ibm-mono text-zinc-900 bg-white transition hover:opacity-90 shadow-lg font-semibold"
              >
                <Mail className="w-4 h-4" />
                <span className="font-medium text-sm">Open Gmail</span>
              </button>
            </div>
          ) : emailOpened ? (
            <ChatInterface
              appConnectors={appConnnectors}
              onToggleConnector={handleToggleConnector}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

export default HomePage;
