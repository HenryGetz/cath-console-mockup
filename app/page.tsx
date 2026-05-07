"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Settings } from "lucide-react";
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
};

function ValueAdjuster({
  label,
  unit,
  value,
  onIncrease,
  onDecrease,
}: ValueAdjusterProps) {
  return (
    <div className="space-y-1.5">
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
    src: "/static/hdi.mp4",
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
    src: "/static/hdi.mp4",
    title: "Pro patient loop",
  },
  {
    key: "rxi",
    label: "RXi",
    logo: acistRxiLogo,
    src: "/static/hdi.mp4",
    title: "RXi patient loop",
  },
  {
    key: "aim",
    label: "AiM",
    logo: acistAimLogo,
    src: "/static/hdi.mp4",
    title: "AiM patient loop",
  },
] as const;

type DeviceVideo = (typeof deviceVideos)[number];

export default function PulseHubPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [flowRate, setFlowRate] = useState(11.0);
  const [volume, setVolume] = useState(21.0);
  const [contrastAvailable] = useState(MAX_CONTRAST_AVAILABLE_ML);
  const [activeDeviceKey, setActiveDeviceKey] =
    useState<DeviceVideo["key"]>("pulse-hub");
  const playbackTimeRef = useRef(0);
  const hasStartedPlaybackRef = useRef(false);

  const activeDevice =
    deviceVideos.find((device) => device.key === activeDeviceKey) ??
    deviceVideos[0];
  const isCathConsole = activeDevice.key === "pulse-hub";

  const contrastAvailablePercent = clamp(
    (contrastAvailable / MAX_CONTRAST_AVAILABLE_ML) * 100,
    0,
    100,
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    hasStartedPlaybackRef.current = false;

    const setPlaybackPosition = () => {
      if (
        Number.isFinite(playbackTimeRef.current) &&
        Number.isFinite(video.duration)
      ) {
        const safePlaybackTime = Math.max(
          0,
          Math.min(
            playbackTimeRef.current,
            Math.max(0, video.duration - 0.001),
          ),
        );
        video.currentTime = safePlaybackTime;
      }
    };

    const startPlayback = async () => {
      if (hasStartedPlaybackRef.current) {
        return;
      }

      hasStartedPlaybackRef.current = true;
      setPlaybackPosition();

      try {
        if (video.paused) {
          await video.play();
        }
      } catch {
        // Some browsers block autoplay unless explicitly started later;
        // keep the video ready so it can start once playback becomes available.
      }
    };

    const updatePlaybackTime = () => {
      playbackTimeRef.current = video.currentTime;
    };

    video.muted = true;
    video.addEventListener("timeupdate", updatePlaybackTime);
    video.addEventListener("canplay", startPlayback);

    if (video.readyState >= 2) {
      void startPlayback();
    }

    return () => {
      video.removeEventListener("canplay", startPlayback);
      video.removeEventListener("timeupdate", updatePlaybackTime);
    };
  }, [activeDeviceKey]);

  const handleDeviceSelect = (key: DeviceVideo["key"]) => {
    const currentVideo = videoRef.current;
    if (currentVideo) {
      playbackTimeRef.current = currentVideo.currentTime;
    }

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
                  onIncrease={() =>
                    setFlowRate((previous) =>
                      clamp(+(previous + 0.5).toFixed(1), 0, 30),
                    )
                  }
                  onDecrease={() =>
                    setFlowRate((previous) =>
                      clamp(+(previous - 0.5).toFixed(1), 0, 30),
                    )
                  }
                />

                <ValueAdjuster
                  label="Volume"
                  unit="mL"
                  value={volume}
                  onIncrease={() =>
                    setVolume((previous) =>
                      clamp(+(previous + 0.5).toFixed(1), 0, 40),
                    )
                  }
                  onDecrease={() =>
                    setVolume((previous) =>
                      clamp(+(previous - 0.5).toFixed(1), 0, 40),
                    )
                  }
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
            <video
              ref={videoRef}
              aria-hidden="true"
              id="hdi-player"
              tabIndex={-1}
              className="absolute inset-0 h-full w-full bg-black object-cover"
              style={{
                WebkitTapHighlightColor: "transparent",
                userSelect: "none",
              }}
              src={activeDevice.src}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              title={activeDevice.title}
            />
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
