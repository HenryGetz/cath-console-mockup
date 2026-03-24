"use client"

import { useEffect } from "react"

export function BodyScaler() {
  useEffect(() => {
    const handleResize = () => {
      const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 800)
      document.body.style.transform = `scale(${scale})`
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return null
}
