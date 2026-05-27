"use client";

import { createContext, useContext } from "react";

const MobileSidebarContext = createContext<{ close: () => void }>({ close: () => {} });

export function useMobileSidebar() {
  return useContext(MobileSidebarContext);
}

export { MobileSidebarContext };
