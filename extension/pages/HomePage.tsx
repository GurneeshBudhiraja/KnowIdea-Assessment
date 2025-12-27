import { EXTENSION_LOCAL_STORAGE_KEYS, GMAIL_COMPOSE_URL } from "@/constants";
import { ApplicationPage } from "@/entrypoints/sidepanel/App";
import { Loader2, LogIn, LogOut, Mail, Settings } from "lucide-react";
import React, { Dispatch, SetStateAction, useState, useEffect } from "react";

declare const browser: any;

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

  // checks the user's login status
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

  // handles opening the settings page
  const handleOpenSettings = () => {
    // TODO: implement the settings page to get the user's preferences on whether to get the answers in the side panel or in the email body itself
    console.log("Opening settings...");
  };

  return (
    <div className="h-full w-full p-4 relative">
      {isUserLoggedIn && (
        <header className="flex items-center justify-between absolute top-0 right-0 p-4 w-full">
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
            <img src="/logo.png" alt="Know Idea Logo" className="w-auto h-10" />
          </header>
          <div className="h-full w-full flex flex-col items-center justify-center gap-4">
            <p className="text-center max-w-md text-xl font-semibold">
              Please sign in with your Know Idea account to continue.
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
                {isUserLoggingIn ? "Signing in..." : "Sign in with Know Idea"}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center gap-4">
          {!isOnGmailCompose ? (
            <>
              <Mail className="w-16 h-16 text-zinc-400" />
              <p className="text-center max-w-md text-lg font-semibold">
                Please open Gmail to make the extension work.
              </p>
              <button
                onClick={handleRedirectToGmail}
                className="flex items-center gap-2 px-8 py-4 rounded-full font-theme-ibm-mono text-zinc-900 bg-white transition hover:opacity-90 shadow-lg font-semibold"
              >
                <Mail className="w-4 h-4" />
                <span>Open Gmail</span>
              </button>
            </>
          ) : emailOpened ? (
            <div className="text-center">
              <p className="text-xl font-semibold mb-2">New email opened</p>
              <p className="text-zinc-400">You're ready to compose!</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default HomePage;
