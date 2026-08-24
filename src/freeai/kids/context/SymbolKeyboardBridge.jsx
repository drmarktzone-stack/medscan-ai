import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

/** @type {React.Context<{ bind: Function; state: object|null }>} */
const SymbolKeyboardBridgeContext = createContext({ bind: () => {}, state: null });

export function SymbolKeyboardBridgeProvider({ children }) {
  const [state, setState] = useState(null);

  const bind = useCallback((next) => {
    setState(next);
    return () => setState(null);
  }, []);

  return (
    <SymbolKeyboardBridgeContext.Provider value={{ bind, state }}>
      {children}
    </SymbolKeyboardBridgeContext.Provider>
  );
}

/** @param {object|null} config */
export function useSymbolKeyboardBridge(config) {
  const { bind } = useContext(SymbolKeyboardBridgeContext);

  useEffect(() => {
    if (!config) {
      bind(null);
      return () => bind(null);
    }
    bind(config);
    return () => bind(null);
  }, [bind, config, config?.value, config?.lang, config?.autoSubmitSymbols]);
}

export function useSymbolKeyboardState() {
  return useContext(SymbolKeyboardBridgeContext).state;
}
