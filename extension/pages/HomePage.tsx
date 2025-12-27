import { EXTENSION_LOCAL_STORAGE_KEYS } from "@/constants";
import { ApplicationPage } from "@/entrypoints/sidepanel/App";
import { Loader2, LogIn, LogOut } from "lucide-react";
import React, { Dispatch, SetStateAction, useState, useEffect } from "react";

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

  useEffect(() => {
    try {
      if (window) {
        const isUserLoggedIn = window.localStorage.getItem(
          EXTENSION_LOCAL_STORAGE_KEYS.IS_USER_LOGGED_IN
        );
        console.log(isUserLoggedIn);
        if (isUserLoggedIn === null) {
          setIsUserLoggedIn(false);
        } else {
          setIsUserLoggedIn(true);
        }
      }
    } catch (error) {
      console.log("Error in HomePage.tsx: ", (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogout = () => {
    window.localStorage.removeItem(
      EXTENSION_LOCAL_STORAGE_KEYS.IS_USER_LOGGED_IN
    );
    console.log("Logging out");
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

  return (
    <div className="h-full w-full p-4">
      {isUserLoggedIn && (
        <header className="flex items-center justify-end">
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
        <>User Is Logged In</>
      )}
    </div>
  );
}

export default HomePage;
