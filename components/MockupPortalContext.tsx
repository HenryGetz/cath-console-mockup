"use client"

import { createContext, useContext, type RefObject } from "react"

interface MockupPortalContextValue {
  containerRef: RefObject<HTMLDivElement | null> | null
}

export const MockupPortalContext = createContext<MockupPortalContextValue>({
  containerRef: null,
})

export function useMockupPortal() {
  return useContext(MockupPortalContext)
}
