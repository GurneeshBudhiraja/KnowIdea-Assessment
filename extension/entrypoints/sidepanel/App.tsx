import { HomePage } from "@/pages";
import { Dispatch, SetStateAction, useState } from "react";

export enum ApplicationPage {
  HOME = "home",
}

export function renderPage(
  currentPage: ApplicationPage,
  setCurrentPage: Dispatch<SetStateAction<ApplicationPage>>
) {
  switch (currentPage) {
    case ApplicationPage.HOME:
      return <HomePage setCurrentPage={setCurrentPage} />;
  }
}

function App() {
  const [currentPage, setCurrentPage] = useState<ApplicationPage>(
    ApplicationPage.HOME
  );

  return (
    <div className="h-full w-full bg-theme-gradient">
      {renderPage(currentPage, setCurrentPage)}
    </div>
  );
}

export default App;
