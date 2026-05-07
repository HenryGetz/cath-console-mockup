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
};

function DeviceTab({ label, logo }: DeviceTabProps) {
  return (
    <button
      aria-label={label}
      className="flex h-[120px] w-full items-center justify-center bg-transparent transition-colors"
    >
      <span className="relative h-8 w-full px-1.5">
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

export default function PulseHubPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [flowRate, setFlowRate] = useState(11.0);
  const [volume, setVolume] = useState(21.0);
  const [contrastAvailable] = useState(MAX_CONTRAST_AVAILABLE_ML);

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

    const startPlayback = async () => {
      try {
        if (video.paused) {
          await video.play();
        }
      } catch {
        // Some browsers block autoplay unless explicitly started later;
        // keep the video ready so it can start once playback becomes available.
      }
    };

    video.muted = true;
    void startPlayback();
    video.addEventListener("canplay", startPlayback);

    return () => {
      video.removeEventListener("canplay", startPlayback);
    };
  }, []);

  return (
    <div className="h-full w-full bg-[#0A0A0F] font-sans text-white tabular-nums">
      <div className="flex h-full w-full">
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
                <div className="text-sm text-[#8888A0]">Contrast Available</div>
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
              src="/static/hdi.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              title="HDi patient loop"
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

              <button className="flex h-[120px] w-full items-center justify-center bg-[#312F3C]">
                <span className="relative h-12 w-full">
                  <Image
                    src={pulseHubLogo}
                    alt="Pulse Hub logo"
                    fill
                    className="scale-[0.88] object-contain object-center"
                  />
                </span>
              </button>
            </div>

            <div className="mt-0 flex flex-1 flex-col justify-start gap-0">
              <DeviceTab label="Pro" logo={proLogo} />
              <DeviceTab label="HDi" logo={acistHdiLogo} />
              <DeviceTab label="RXi" logo={acistRxiLogo} />
              <DeviceTab label="AiM" logo={acistAimLogo} />
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
