"use client";
import { createContext, useContext, useState, useEffect } from "react";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState("home"); // home, test, history, warfarin
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load session storage on mount
  useEffect(() => {
    const sessionHistory = sessionStorage.getItem("ptinr_history");
    if (sessionHistory) setHistory(JSON.parse(sessionHistory));
    
    // Simulate initial loading animation
    setTimeout(() => setLoading(false), 2000);
  }, []);

  const addTestToHistory = (testResult) => {
    const newHistory = [testResult, ...history];
    setHistory(newHistory);
    sessionStorage.setItem("ptinr_history", JSON.stringify(newHistory));
  };

  return (
    <AppContext.Provider value={{ activeTab, setActiveTab, history, addTestToHistory, loading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);