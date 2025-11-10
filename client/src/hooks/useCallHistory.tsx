import React, { createContext, useContext, useEffect, useState } from "react";

type CallHistory = string[];

interface CallHistoryContextValue {
  history: CallHistory;
  addCall: (call: string) => void;
  clearHistory: () => void;
}

const CallHistoryContext = createContext<CallHistoryContextValue | undefined>(
  undefined
);

const CALL_HISTORY_KEY = "callHistory";
const MAX_HISTORY_LENGTH = 5;

export const CallHistoryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [history, setHistory] = useState<CallHistory>([]);

  useEffect(() => {
    const stored = localStorage.getItem(CALL_HISTORY_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error("Error al parsear historial:", e);
      }
    }
  }, []);

  const addCall = (call: string) => {
    const updated = [call, ...history].slice(0, MAX_HISTORY_LENGTH);
    setHistory(updated);
    localStorage.setItem(CALL_HISTORY_KEY, JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(CALL_HISTORY_KEY);
  };

  return (
    <CallHistoryContext.Provider value={{ history, addCall, clearHistory }}>
      {children}
    </CallHistoryContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCallHistory = () => {
  const context = useContext(CallHistoryContext);
  if (!context) {
    throw new Error("useCallHistory debe usarse dentro de CallHistoryProvider");
  }
  return context;
};
