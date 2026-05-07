"use client";

import { type ReactNode, useLayoutEffect, useRef } from "react";

type BodyScalerProps = {
  children: ReactNode;
};

const DESIGN_WIDTH = 1423;
const DESIGN_HEIGHT = 800;

export function BodyScaler({ children }: BodyScalerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) {
      return;
    }

    const handleResize = () => {
      const scale = Math.min(
        window.innerWidth / DESIGN_WIDTH,
        window.innerHeight / DESIGN_HEIGHT,
        1,
      );
      wrapper.style.transform = `scale(${scale})`;
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      wrapper.style.transform = "";
    };
  }, []);

  return (
    <div
      id="app-scale-root"
      ref={wrapperRef}
      className="relative"
      style={{
        transformOrigin: "top left",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
