import React, { createContext, useContext, useEffect, useState } from 'react';

interface CallRecord {
  query: string;
  type: number;
}

type CallHistory = CallRecord[];

interface CallHistoryContextValue {
  history: CallHistory;
  addCall: (query: string, type: number) => void;
  clearHistory: () => void;
}

const CallHistoryContext = createContext<CallHistoryContextValue | undefined>(
  undefined,
);

const CALL_HISTORY_KEY = 'callHistory';
const MAX_HISTORY_LENGTH = 5;

export const CallHistoryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [history, setHistory] = useState<CallHistory>([]);

  useEffect(() => {
    const stored = localStorage.getItem(CALL_HISTORY_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Migration/Sanitization: ensure it's an array of objects with 'query'
        if (
          Array.isArray(parsed) &&
          parsed.every(
            (item) =>
              typeof item === 'object' && item !== null && 'query' in item,
          )
        ) {
          setHistory(parsed);
        } else {
          console.warn('Formato de historial antiguo detectado, limpiando...');
          localStorage.removeItem(CALL_HISTORY_KEY);
        }
      } catch (e) {
        console.error('Error al parsear historial:', e);
      }
    }
  }, []);

  const addCall = (query: string, type: number) => {
    setHistory((prev) => {
      // Remove existing search with the same query (case insensitive)
      // Added safety check for item.query
      const filtered = prev.filter(
        (item) =>
          item &&
          item.query &&
          item.query.toLowerCase() !== query.toLowerCase(),
      );

      const updated = [{ query, type }, ...filtered].slice(
        0,
        MAX_HISTORY_LENGTH,
      );
      localStorage.setItem(CALL_HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
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
    throw new Error('useCallHistory debe usarse dentro de CallHistoryProvider');
  }
  return context;
};
