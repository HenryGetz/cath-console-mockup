"use client";

import { type PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { formatHex, interpolate } from "culori";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Home,
  LogOut,
  Menu,
  Pause,
  Settings,
  User,
  X,
} from "lucide-react";

const TARGET_LIMIT_ML = 80;
const MAX_CONTRAST_AVAILABLE_ML = 95;
const AUTO_REFILL_AT_ML = 30;
const MAX_TRACK_PERCENT = 140;

const interpolationAnchors = [
  { ml: 0, percent: 0 },
  { ml: 10, percent: 12 },
  { ml: 43, percent: 51 },
  { ml: 65, percent: 81 },
  { ml: 80, percent: 100 },
  { ml: 97, percent: 114 },
] as const;

const barRamp = interpolate(["#78bd4f", "#b8d968", "#f0a03a"], "oklch");
const overageRamp = interpolate(["#f0a03a", "#ef4444"], "oklch");

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const formatMl = (value: number) =>
  Number.isInteger(value) ? `${value.toFixed(0)}` : value.toFixed(1);

type Point = { ml: number; percent: number };

const interpolatePiecewise = (
  value: number,
  points: Point[],
  source: keyof Point,
  target: keyof Point,
) => {
  if (points.length < 2) {
    return points[0]?.[target] ?? 0;
  }

  for (let index = 0; index < points.length - 1; index += 1) {
    const left = points[index];
    const right = points[index + 1];

    if (value >= left[source] && value <= right[source]) {
      const span = right[source] - left[source];

      if (span === 0) {
        return left[target];
      }

      const ratio = (value - left[source]) / span;
      return left[target] + ratio * (right[target] - left[target]);
    }
  }

  if (value < points[0][source]) {
    const first = points[0];
    const next = points[1];
    const slope =
      (next[target] - first[target]) / (next[source] - first[source]);
    return first[target] + (value - first[source]) * slope;
  }

  const tail = points[points.length - 1];
  const beforeTail = points[points.length - 2];
  const slope =
    (tail[target] - beforeTail[target]) / (tail[source] - beforeTail[source]);
  return tail[target] + (value - tail[source]) * slope;
};

const mlToPercent = (ml: number) =>
  interpolatePiecewise(
    ml,
    interpolationAnchors as unknown as Point[],
    "ml",
    "percent",
  );

const percentToMl = (percent: number) => {
  const sortedByPercent = [...interpolationAnchors].sort(
    (left, right) => left.percent - right.percent,
  );
  return interpolatePiecewise(
    percent,
    sortedByPercent as unknown as Point[],
    "percent",
    "ml",
  );
};

export default function ACISTPro() {
  const [flowRate, setFlowRate] = useState(11.0);
  const [volume, setVolume] = useState(21.0);
  const [xRaySync, setXRaySync] = useState(false);
  const [activeTab, setActiveTab] = useState("LV/Aorta");
  const [isDraggingContrast, setIsDraggingContrast] = useState(false);
  const [contrastToPatient, setContrastToPatient] = useState(43);
  const [contrastAvailable, setContrastAvailable] = useState(
    MAX_CONTRAST_AVAILABLE_ML,
  );

  const sliderDragRef = useRef<HTMLDivElement | null>(null);
  const dragRafRef = useRef<number | null>(null);
  const pendingPointerXRef = useRef<number | null>(null);

  const contrastPercentRaw = mlToPercent(contrastToPatient);
  const contrastPercent = Math.round(contrastPercentRaw);
  const baseFillPercent = clamp(contrastPercentRaw, 0, 100);
  const overagePercent = Math.max(contrastPercentRaw - 100, 0);
  const markerPositionPercent = clamp(contrastPercentRaw, 0, MAX_TRACK_PERCENT);

  const contrastAvailablePercent = clamp(
    (contrastAvailable / MAX_CONTRAST_AVAILABLE_ML) * 100,
    0,
    100,
  );

  const canRefill = contrastAvailable < MAX_CONTRAST_AVAILABLE_ML;

  const visuals = useMemo(() => {
    if (contrastPercentRaw <= 100) {
      const colorLead = formatHex(
        barRamp(clamp(contrastPercentRaw / 100, 0, 1)),
      );
      const colorTrail = formatHex(
        barRamp(clamp(contrastPercentRaw / 100 - 0.22, 0, 1)),
      );

      return {
        fillBackground: `linear-gradient(90deg, ${colorTrail} 0%, ${colorLead} 100%)`,
        percentColor: colorLead,
        overageColor: "#ef4444",
      };
    }

    const overageRatio = clamp(
      (contrastPercentRaw - 100) / (MAX_TRACK_PERCENT - 100),
      0,
      1,
    );
    const orange = formatHex(barRamp(1));
    const red = formatHex(overageRamp(overageRatio));

    return {
      fillBackground: `linear-gradient(90deg, ${orange} 0%, ${orange} 100%)`,
      percentColor: "#ef4444",
      overageColor: "#ef4444",
    };
  }, [contrastPercentRaw]);

  const adjustFlowRate = (delta: number) => {
    setFlowRate((previous) =>
      Math.max(0, Math.min(30, +(previous + delta).toFixed(1))),
    );
  };

  const adjustVolume = (delta: number) => {
    setVolume((previous) =>
      Math.max(0, Math.min(50, +(previous + delta).toFixed(1))),
    );
  };

  const disarmInjection = () => {
    setContrastToPatient(43);
  };

  const purgeContrast = () => {
    setContrastAvailable((previous) => Math.max(0, +(previous - 5).toFixed(1)));
  };

  const refillContrast = () => {
    setContrastAvailable(MAX_CONTRAST_AVAILABLE_ML);
  };

  const updateContrastFromPointer = (clientX: number) => {
    const dragSurface = sliderDragRef.current;

    if (!dragSurface) {
      return;
    }

    const rect = dragSurface.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    const percent = ratio * MAX_TRACK_PERCENT;
    const nextMl = clamp(percentToMl(percent), 0, 130);

    const roundedMl = +nextMl.toFixed(1);
    setContrastToPatient((previous) =>
      previous === roundedMl ? previous : roundedMl,
    );
  };

  const commitQueuedDragUpdate = () => {
    dragRafRef.current = null;

    if (pendingPointerXRef.current === null) {
      return;
    }

    updateContrastFromPointer(pendingPointerXRef.current);
  };

  const queueDragUpdate = (clientX: number) => {
    pendingPointerXRef.current = clientX;

    if (dragRafRef.current !== null) {
      return;
    }

    dragRafRef.current = window.requestAnimationFrame(commitQueuedDragUpdate);
  };

  const clearQueuedDragUpdate = () => {
    pendingPointerXRef.current = null;

    if (dragRafRef.current !== null) {
      window.cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearQueuedDragUpdate();
    };
  }, []);

  const handleSliderPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDraggingContrast(true);
    clearQueuedDragUpdate();
    updateContrastFromPointer(event.clientX);
  };

  const handleSliderPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      queueDragUpdate(event.clientX);
    }
  };

  const handleSliderPointerFinish = (event: PointerEvent<HTMLDivElement>) => {
    clearQueuedDragUpdate();
    updateContrastFromPointer(event.clientX);
    setIsDraggingContrast(false);

    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleSliderLostCapture = () => {
    clearQueuedDragUpdate();
    setIsDraggingContrast(false);
  };

  return (
    <div className="h-full w-full overflow-hidden rounded-md border border-[#2a2a35] bg-[#0a0a0f] font-sans">
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-[#2a2a35] bg-[#1C1B22] px-6 py-4">
          <div className="flex items-center gap-8">
            <button className="text-[#00b4d8] transition-colors hover:text-[#00d4ff]">
              <Menu className="h-7 w-7" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-2xl font-medium text-white">Cardiac</span>
              <ChevronDown className="h-5 w-5 text-white" />
            </div>

            <nav className="flex items-center gap-8">
              {["LCA", "RCA", "LV/Aorta"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-2xl font-semibold transition-colors ${
                    activeTab === tab
                      ? "text-white"
                      : "text-[#00b4d8] hover:text-[#00d4ff]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="text-2xl font-light tracking-wide text-white">
            ACIST Pro<sup className="text-xs">™</sup>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <aside className="flex w-20 flex-col items-center border-r border-[#2a2a35]/50 bg-[#1C1B22] py-6">
            <nav className="flex flex-1 flex-col items-center gap-6">
              <button className="p-3 text-[#00b4d8] transition-colors hover:text-[#00d4ff]">
                <Home className="h-7 w-7" />
              </button>
              <button className="p-3 text-[#00b4d8] transition-colors hover:text-[#00d4ff]">
                <Settings className="h-7 w-7" />
              </button>
              <button className="p-3 text-[#00b4d8] transition-colors hover:text-[#00d4ff]">
                <Activity className="h-7 w-7" />
              </button>
              <button className="p-3 text-[#00b4d8] transition-colors hover:text-[#00d4ff]">
                <Pause className="h-7 w-7" />
              </button>
            </nav>
            <button className="mt-auto p-3 text-[#00b4d8] transition-colors hover:text-[#00d4ff]">
              <LogOut className="h-7 w-7" />
            </button>
          </aside>

          <main className="flex min-w-0 flex-1 flex-col p-6">
            <div className="mb-6 flex items-center gap-4">
              <span className="text-4xl font-semibold text-[#00cc66]">
                Ready: Large Injection
              </span>
              <button
                onClick={disarmInjection}
                className="flex items-center gap-2 text-[#00b4d8] transition-colors hover:text-[#00d4ff]"
              >
                <X className="h-5 w-5" />
                <span className="text-lg">Disarm</span>
              </button>
            </div>

            <div className="flex h-[312px] gap-6">
              <div className="flex min-w-0 flex-1 gap-6">
                <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-[#2a2a35]/50 bg-[#111118] p-6">
                  <span className="text-lg text-gray-400">
                    Flow Rate <span className="text-sm">(mL/s)</span>
                  </span>
                  <div className="flex min-h-0 flex-1 items-center justify-between">
                    <span
                      className="font-bold leading-none text-white tabular-nums"
                      style={{ fontSize: "100px" }}
                    >
                      {flowRate.toFixed(1)}
                    </span>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => adjustFlowRate(0.5)}
                        className="p-1 text-[#00b4d8] transition-colors hover:text-[#00d4ff]"
                      >
                        <ChevronUp className="h-10 w-10" strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => adjustFlowRate(-0.5)}
                        className="p-1 text-[#00b4d8] transition-colors hover:text-[#00d4ff]"
                      >
                        <ChevronDown className="h-10 w-10" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 h-0.5 rounded-full bg-[#3a3a45]" />
                </div>

                <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-[#2a2a35]/50 bg-[#111118] p-6">
                  <span className="text-lg text-gray-400">
                    Volume <span className="text-sm">(mL)</span>
                  </span>
                  <div className="flex min-h-0 flex-1 items-center justify-between">
                    <span
                      className="font-bold leading-none text-white tabular-nums"
                      style={{ fontSize: "100px" }}
                    >
                      {volume.toFixed(1)}
                    </span>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => adjustVolume(1)}
                        className="p-1 text-[#00b4d8] transition-colors hover:text-[#00d4ff]"
                      >
                        <ChevronUp className="h-10 w-10" strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => adjustVolume(-1)}
                        className="p-1 text-[#00b4d8] transition-colors hover:text-[#00d4ff]"
                      >
                        <ChevronDown className="h-10 w-10" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 h-0.5 rounded-full bg-[#3a3a45]" />
                </div>
              </div>

              <div className="flex w-56 flex-col gap-5">
                <div>
                  <span className="text-lg font-medium text-[#00b4d8]">
                    Rise Time
                  </span>
                  <div className="text-4xl font-semibold text-white tabular-nums">
                    0.5<span className="text-xl text-gray-400">s</span>
                  </div>
                </div>

                <div>
                  <span className="text-lg text-gray-400">Last Injection</span>
                  <div className="flex items-baseline gap-4">
                    <span className="text-4xl font-semibold text-white tabular-nums">
                      9.5 <span className="text-sm text-gray-400">mL/s</span>
                    </span>
                    <span className="text-4xl font-semibold text-white tabular-nums">
                      18.5 <span className="text-sm text-gray-400">mL</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg text-gray-400">X-ray Sync</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {xRaySync ? "ON" : "OFF"}
                    </span>
                    <button
                      onClick={() => setXRaySync((previous) => !previous)}
                      className={`relative h-7 w-14 rounded-full transition-colors ${
                        xRaySync ? "bg-[#00b4d8]" : "bg-gray-600"
                      }`}
                    >
                      <div
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
                          xRaySync ? "translate-x-8" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-end justify-between gap-6">
              <div className="flex w-full max-w-[760px] min-w-0 flex-col gap-3">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-5xl font-bold text-white tabular-nums"
                      data-testid="contrast-to-patient-value"
                    >
                      {formatMl(contrastToPatient)}
                    </span>
                    <span className="text-lg text-gray-400">mL</span>
                    <span className="ml-2 text-lg text-gray-400">
                      Contrast to Patient
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-white tabular-nums">
                      {TARGET_LIMIT_ML}
                    </span>
                    <span className="text-lg text-gray-400">mL</span>
                    <span className="ml-2 text-lg text-[#00b4d8]">
                      Target Limit
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <div
                    ref={sliderDragRef}
                    data-testid="contrast-drag-surface"
                    aria-label="Contrast to Patient slider"
                    onPointerDown={handleSliderPointerDown}
                    onPointerMove={handleSliderPointerMove}
                    onPointerUp={handleSliderPointerFinish}
                    onPointerCancel={handleSliderPointerFinish}
                    onLostPointerCapture={handleSliderLostCapture}
                    className="absolute inset-y-0 left-0 z-30 cursor-ew-resize touch-none"
                    style={{ width: `${MAX_TRACK_PERCENT}%` }}
                  />

                  <div className="relative h-12 rounded-full border border-[#3a3a45] bg-[#000000]">
                    <div
                      data-testid="contrast-fill"
                      className={`absolute inset-y-0 left-0 rounded-full ${
                        isDraggingContrast
                          ? "transition-none"
                          : "transition-all duration-150"
                      }`}
                      style={{
                        width: `${baseFillPercent}%`,
                        background: visuals.fillBackground,
                        willChange: "width",
                      }}
                    />

                    {contrastPercentRaw >= 100 && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-semibold tracking-wide text-black">
                          Target Reached
                        </span>
                      </div>
                    )}

                    {overagePercent > 0 && (
                      <div
                        data-testid="contrast-overage"
                        className={`absolute inset-y-1 left-full ml-1 rounded-l-md rounded-r-full ${
                          isDraggingContrast
                            ? "transition-none"
                            : "transition-all duration-150"
                        }`}
                        style={{
                          width: `${overagePercent}%`,
                          backgroundColor: visuals.overageColor,
                          willChange: "width",
                        }}
                      />
                    )}
                  </div>

                  <div className="relative mt-2 h-6">
                    <span
                      data-testid="contrast-percent-label"
                      className={`absolute -translate-x-1/2 text-4xl font-semibold tabular-nums ${
                        isDraggingContrast
                          ? "transition-none"
                          : "transition-all duration-150"
                      }`}
                      style={{
                        left: `${markerPositionPercent}%`,
                        color: visuals.percentColor,
                        willChange: "left",
                      }}
                    >
                      {contrastPercent}%
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <button className="flex items-center gap-2 text-[#00b4d8] transition-colors hover:text-[#00d4ff]">
                    <User className="h-5 w-5" />
                    <span className="text-lg">Dr. Johnson</span>
                  </button>
                </div>
              </div>

              <div className="flex w-56 shrink-0 flex-col gap-3">
                <span className="text-lg text-gray-400">
                  Contrast Available
                </span>

                <div className="relative h-14 overflow-hidden rounded-lg border-2 border-[#9333ea] bg-[#1a1a24]">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#7c3aed] to-[#9333ea]"
                    style={{ width: `${contrastAvailablePercent}%` }}
                  />
                  <div className="absolute inset-0 flex items-center px-4">
                    <span className="text-4xl font-bold text-white tabular-nums">
                      {formatMl(contrastAvailable)}
                    </span>
                    <span className="ml-1 text-lg text-gray-300">mL</span>
                  </div>
                </div>

                <span className="text-right text-sm text-gray-500">
                  Auto refill at {AUTO_REFILL_AT_ML} mL
                </span>

                <div className="flex gap-3">
                  <button
                    onClick={purgeContrast}
                    className="flex-1 rounded-full bg-[#1a3a5c] py-2.5 font-semibold text-white transition-colors hover:bg-[#254a70]"
                  >
                    PURGE
                  </button>
                  <button
                    onClick={refillContrast}
                    disabled={!canRefill}
                    className={`flex-1 rounded-full border py-2.5 font-semibold transition-colors ${
                      canRefill
                        ? "border-[#7c3aed] bg-[#2a1457] text-[#d8b4fe] hover:bg-[#3a1b75]"
                        : "cursor-not-allowed border-gray-600 bg-transparent text-gray-500"
                    }`}
                  >
                    REFILL
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
