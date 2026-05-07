"use client";
import { AppProvider, useAppContext } from "./context/AppContext";
import ResponsiveNav from "./components/ResponsiveNav";
import AnimateLoader from "./components/AnimateLoader";
import HomeHero from "./components/HomeHero";
import PTINRWizard from "./components/PTINRWizard";
import HistoryTab from "./components/HistoryTab";
import WarfarinSoon from "./components/WarfarinSoon";

// This component acts as the router to switch views
function DashboardView() {
  const { activeTab } = useAppContext();

  return (
    <div className="min-h-screen bg-white">
      <AnimateLoader />
      <ResponsiveNav />
      
      {/* Main Content Area - adds margin to account for desktop sidebar and mobile bottom bar */}
      <main className="md:ml-64 pb-24 md:pb-0 pt-10 px-6 min-h-screen">
        {activeTab === "home" && <HomeHero />}
        {activeTab === "test" && <PTINRWizard />}
        {activeTab === "history" && <HistoryTab />}
        {activeTab === "warfarin" && <WarfarinSoon />}
      </main>
    </div>
  );
}

// Wrap the app in the Context Provider
export default function Page() {
  return (
    <AppProvider>
      <DashboardView />
    </AppProvider>
  );
}