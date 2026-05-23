'use client';

import { createContext, useContext, useState } from 'react';

const BadgeContext = createContext({ count: 0, setCount: () => {} });

export function BadgeProvider({ children }) {
  const [count, setCount] = useState(0);
  return (
    <BadgeContext.Provider value={{ count, setCount }}>
      {children}
    </BadgeContext.Provider>
  );
}

export function useBadge() {
  return useContext(BadgeContext);
}
