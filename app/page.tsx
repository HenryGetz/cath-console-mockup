"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Settings } from "lucide-react";
import { useSwipeable } from "react-swipeable";
import acistAimLogo from "@/static/acist-aim-logo.png";
import acistHdiLogo from "@/static/acist-hdi-logo.png";
import acistLogo from "@/static/acist-logo.png";
import acistRxiLogo from "@/static/acist-rxi-logo.png";
import proLogo from "@/static/pro-logo.png";
import pulseHubLogo from "@/static/pulse-hub-logo.png";
import rxiGraphImage from "@/static/rxi-graph.jpg";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const MAX_CONTRAST_AVAILABLE_ML = 95;

type ValueAdjusterProps = {
  label: string;
  unit: string;
  value: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onSwipeIncrease: (steps?: number) => void;
  onSwipeDecrease: (steps?: number) => void;
};

function ValueAdjuster({
  label,
  unit,
  value,
  onIncrease,
  onDecrease,
  onSwipeIncrease,
  onSwipeDecrease,
}: ValueAdjusterProps) {
  const swipeHandlers = useSwipeable({
    onSwipedUp: ({ deltaY }) => {
      const steps = Math.max(1, Math.round(Math.abs(deltaY) / 55));
      onSwipeIncrease(steps);
    },
    onSwipedDown: ({ deltaY }) => {
      const steps = Math.max(1, Math.round(Math.abs(deltaY) / 55));
      onSwipeDecrease(steps);
    },
    preventScrollOnSwipe: true,
    trackTouch: true,
    trackMouse: true,
  });

  return (
    <div
      {...swipeHandlers}
      className="touch-manipulation space-y-1.5"
      style={{ touchAction: "pan-y" }}
    >
      <div className="text-sm text-[#8888A0]">
        {label} ({unit})
      </div>
      <div className="flex items-center justify-between gap-1">
        <div className="flex-1 pr-2 text-right text-4xl font-bold leading-none text-white tabular-nums">
          {value.toFixed(1)}
        </div>
        <div className="flex flex-col gap-0.5">
          <button
            onClick={onIncrease}
            aria-label={`Increase ${label}`}
            className="flex items-center justify-center p-0.5 text-[#00B4D8] transition-colors hover:text-[#00D4FF]"
          >
            <ChevronUp className="h-5 w-5" />
          </button>
          <button
            onClick={onDecrease}
            aria-label={`Decrease ${label}`}
            className="flex items-center justify-center p-0.5 text-[#00B4D8] transition-colors hover:text-[#00D4FF]"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

type DeviceTabProps = {
  label: string;
  logo: typeof proLogo;
  isActive: boolean;
  onSelect: () => void;
  size?: "default" | "large";
};

function DeviceTab({
  label,
  logo,
  isActive,
  onSelect,
  size = "default",
}: DeviceTabProps) {
  return (
    <button
      aria-label={label}
      aria-pressed={isActive}
      type="button"
      onClick={onSelect}
      onContextMenu={(event) => {
        event.preventDefault();
        onSelect();
      }}
      className={`flex h-[120px] w-full items-center justify-center transition-colors ${
        isActive
          ? "bg-[#312F3C] text-white"
          : "bg-transparent text-[#6F6F7A] hover:bg-[#25202F]"
      }`}
    >
      <span
        className={`relative w-full px-1.5 ${size === "large" ? "h-12" : "h-8"}`}
      >
        <Image
          src={logo}
          alt={`${label} logo`}
          fill
          className="scale-[0.88] object-contain object-center"
        />
      </span>
    </button>
  );
}

const deviceVideos = [
  {
    key: "pulse-hub",
    label: "Pulse Hub",
    logo: pulseHubLogo,
    src: "/static/pulse-hub.mp4",
    title: "Pulse Hub patient loop",
  },
  {
    key: "hdi",
    label: "HDi",
    logo: acistHdiLogo,
    src: "/static/hdi.mp4",
    title: "HDi patient loop",
  },
  {
    key: "pro",
    label: "Pro",
    logo: proLogo,
    src: "/screens/vol.jpg",
    mediaType: "image",
    title: "Pro screen",
  },
  {
    key: "rxi",
    label: "RXi",
    logo: acistRxiLogo,
    src: "/static/rxi.jpeg",
    mediaType: "image",
    title: "RXi patient loop",
  },
  {
    key: "aim",
    label: "AiM",
    logo: acistAimLogo,
    src: "/screens/flo.jpg",
    mediaType: "image",
    title: "AiM screen",
  },
] as const;

type DeviceVideo = (typeof deviceVideos)[number];

export default function PulseHubPage() {
  const [flowRate, setFlowRate] = useState(11.0);
  const [volume, setVolume] = useState(21.0);
  const [contrastAvailable] = useState(MAX_CONTRAST_AVAILABLE_ML);
  const [activeDeviceKey, setActiveDeviceKey] =
    useState<DeviceVideo["key"]>("pulse-hub");
  const playbackTimeRef = useRef<Record<DeviceVideo["key"], number>>({
    "pulse-hub": 0,
    hdi: 0,
    pro: 0,
    rxi: 0,
    aim: 0,
  });
  const videoRefs = useRef<Record<DeviceVideo["key"], HTMLVideoElement | null>>(
    {
      "pulse-hub": null,
      hdi: null,
      pro: null,
      rxi: null,
      aim: null,
    },
  );

  const activeDevice =
    deviceVideos.find((device) => device.key === activeDeviceKey) ??
    deviceVideos[0];
  const isCathConsole = activeDevice.key === "pulse-hub";

  const contrastAvailablePercent = clamp(
    (contrastAvailable / MAX_CONTRAST_AVAILABLE_ML) * 100,
    0,
    100,
  );

  const adjustFlowRate = (steps = 1) => {
    setFlowRate((previous) =>
      clamp(+(previous + 0.5 * steps).toFixed(1), 0, 30),
    );
  };

  const adjustVolume = (steps = 1) => {
    setVolume((previous) => clamp(+(previous + 0.5 * steps).toFixed(1), 0, 40));
  };

  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([key, element]) => {
      if (!element) {
        return;
      }

      if (key === activeDevice.key) {
        const cachedTime = playbackTimeRef.current[key as DeviceVideo["key"]];
        if (Number.isFinite(cachedTime) && Number.isFinite(element.duration)) {
          element.currentTime = Math.max(
            0,
            Math.min(cachedTime, element.duration - 0.001),
          );
        }

        if (!element.paused) {
          return;
        }

        void element.play().catch(() => {
          // Autoplay may be blocked until a user interaction occurs.
        });
      } else {
        playbackTimeRef.current[key as DeviceVideo["key"]] =
          element.currentTime;
        element.pause();
      }
    });
  }, [activeDevice.key]);

  const handleDeviceSelect = (key: DeviceVideo["key"]) => {
    setActiveDeviceKey(key);
  };

  return (
    <div className="h-full w-full bg-[#0A0A0F] font-sans text-white tabular-nums">
      <div className="flex h-full w-full">
        {isCathConsole ? (
          <aside className="w-[200px] border-r border-[#2A2A35] bg-[#0A0A0F] px-4 py-4">
            <div className="flex h-full flex-col">
              <section className="space-y-3">
                <div className="relative h-5 w-[72px]">
                  <Image
                    src={proLogo}
                    alt="Pro logo"
                    fill
                    className="object-contain object-left"
                  />
                </div>

                <ValueAdjuster
                  label="Flow Rate"
                  unit="mL/s"
                  value={flowRate}
                  onIncrease={() => adjustFlowRate()}
                  onDecrease={() => adjustFlowRate(-1)}
                  onSwipeIncrease={(steps = 1) => adjustFlowRate(steps)}
                  onSwipeDecrease={(steps = 1) => adjustFlowRate(-steps)}
                />

                <ValueAdjuster
                  label="Volume"
                  unit="mL"
                  value={volume}
                  onIncrease={() => adjustVolume()}
                  onDecrease={() => adjustVolume(-1)}
                  onSwipeIncrease={(steps = 1) => adjustVolume(steps)}
                  onSwipeDecrease={(steps = 1) => adjustVolume(-steps)}
                />

                <div className="space-y-1.5 pt-1.5">
                  <div className="text-sm text-[#8888A0]">
                    Contrast Available
                  </div>
                  <div className="flex items-baseline justify-end gap-1 text-right">
                    <span className="text-4xl font-bold leading-none text-white tabular-nums">
                      95
                    </span>
                    <span className="text-sm text-[#C8C8D0]">mL</span>
                  </div>

                  <div className="h-4 rounded-full border border-[#9933CC] bg-[#000000] p-[2px]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${contrastAvailablePercent}%`,
                        background: "#9933CC",
                      }}
                    />
                  </div>

                  <div className="space-y-1.5 pt-[20px]">
                    <div className="flex items-center justify-between text-xs leading-tight">
                      <div className="text-[#8888A0]">Used:</div>
                      <div className="tabular-nums text-right text-[#C8C8D0]">
                        10 mL / 80 mL
                      </div>
                    </div>
                    <div className="h-4 overflow-hidden rounded-full border border-[#2A2A35]/60 bg-[#000000] p-[2px]">
                      <div
                        className="h-full rounded-full bg-[#00B4D8]"
                        style={{ width: `${(10 / 80) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-auto space-y-3">
                <div className="relative h-5 w-[82px]">
                  <Image
                    src={acistRxiLogo}
                    alt="RXi logo"
                    fill
                    className="object-contain object-left"
                  />
                </div>

                <div className="pt-0.5">
                  <Image
                    src={rxiGraphImage}
                    alt="RXi pressure graph"
                    className="-mx-4 h-auto w-[calc(100%+2rem)] max-w-none rounded border border-[#2A2A35]/50 bg-[#000000]"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xl">
                    <span className="text-[#EF4444]">Pa</span>
                    <span className="text-[34px] font-bold leading-none text-[#EF4444] tabular-nums">
                      86
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xl">
                    <span className="text-[#00CC66]">Pd</span>
                    <span className="text-[34px] font-bold leading-none text-[#00CC66] tabular-nums">
                      76
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xl">
                    <span className="text-[#C8C8D0]">Pd/Pa</span>
                    <span className="text-[34px] font-bold leading-none text-white tabular-nums">
                      0.89
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xl">
                    <span className="text-[#C8C8D0]">FFR</span>
                    <span className="text-[34px] font-bold leading-none text-white tabular-nums">
                      0.89
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button className="flex min-h-[48px] min-w-[48px] flex-1 items-center justify-center rounded border border-[#2A2A35] text-lg text-[#C8C8D0] transition-colors hover:border-[#00B4D8] hover:text-[#00B4D8]">
                    Ø
                  </button>
                  <button className="flex min-h-[48px] min-w-[48px] flex-1 items-center justify-center rounded border border-[#2A2A35] text-lg text-[#C8C8D0] transition-colors hover:border-[#00B4D8] hover:text-[#00B4D8]">
                    =
                  </button>
                </div>
              </section>
            </div>
          </aside>
        ) : null}

        <main className="relative min-w-0 flex-1 bg-[#0A0A0F]">
          <section className="absolute inset-0 overflow-hidden bg-black">
            {deviceVideos.map((device) => {
              const isActive = activeDevice.key === device.key;

              if (device.mediaType === "image") {
                return (
                  <div
                    key={device.key}
                    aria-hidden={!isActive}
                    className={`absolute inset-0 transition-opacity duration-150 ${
                      isActive ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                  >
                    <Image
                      src={device.src}
                      alt={device.title}
                      fill
                      sizes="100vw"
                      className="bg-black object-contain"
                    />
                  </div>
                );
              }

              return (
                <video
                  key={device.key}
                  ref={(element) => {
                    if (element) {
                      videoRefs.current[device.key] = element;
                    }
                  }}
                  aria-hidden={!isActive}
                  loop
                  muted
                  playsInline
                  preload="auto"
                  tabIndex={-1}
                  className={`absolute inset-0 h-full w-full bg-black object-contain transition-opacity duration-150 ${
                    isActive ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                  style={{
                    WebkitTapHighlightColor: "transparent",
                    userSelect: "none",
                  }}
                  src={device.src}
                  title={device.title}
                  onTimeUpdate={(event) => {
                    playbackTimeRef.current[device.key] =
                      event.currentTarget.currentTime;
                  }}
                />
              );
            })}
          </section>
        </main>

        <aside className="w-20 border-l border-[#2A2A35] bg-[#1C1B22]">
          <div className="flex h-full flex-col">
            <div className="flex flex-col items-center gap-0">
              <div className="relative h-7 w-full">
                <Image
                  src={acistLogo}
                  alt="ACIST logo"
                  fill
                  className="object-contain object-center"
                />
              </div>
            </div>

            <div className="mt-0 flex flex-1 flex-col justify-start gap-0">
              {deviceVideos.map((device) => {
                return (
                  <DeviceTab
                    key={device.key}
                    label={device.label}
                    logo={device.logo}
                    isActive={device.key === activeDevice.key}
                    onSelect={() => handleDeviceSelect(device.key)}
                    size={device.key === "pulse-hub" ? "large" : "default"}
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-center border-t border-[#2A2A35]/70 pb-3 pt-2">
              <button className="flex min-h-[48px] min-w-[48px] items-center justify-center text-[#8888A0] transition-colors hover:text-[#C8C8D0]">
                <Settings className="h-7 w-7" />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
