"use client";

import { useEffect, useState } from "react";

interface TrustIndexCardProps {
  score: number | null;
  riskLevel: string | null;
  isLoading: boolean;
}

const riskColors: Record<string, string> = {
  LOW: "#22c55e",
  MEDIUM: "#f59e0b",
  HIGH: "#f97316",
  CRITICAL: "#ef4444",
};

const riskBg: Record<string, string> = {
  LOW: "bg-green-500/10 text-green-400 border-green-500/20",
  MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  HIGH: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  CRITICAL: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function TrustIndexCard({
  score,
  riskLevel,
  isLoading,
}: TrustIndexCardProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  const radius = 80;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;

  useEffect(() => {
    if (score === null) { setAnimatedScore(0); return; }
    let start = 0;
    const step = score / 60; // animate over ~60 frames
    const timer = setInterval(() => {
      start += step;
      if (start >= score) { setAnimatedScore(score); clearInterval(timer); }
      else setAnimatedScore(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [score]);

  const offset =
    circumference - (animatedScore / 100) * circumference;
  const color =
    riskLevel && riskColors[riskLevel]
      ? riskColors[riskLevel]
      : "#6b7280";

  return (
    <div className="rounded-xl border border-border bg-card p-6 flex flex-col items-center gap-4">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Trust Index Score
      </h2>

      {/* SVG Ring */}
      <div className="relative flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2}>
          {/* Background track */}
          <circle
            stroke="#1f2937"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Animated progress */}
          <circle
            stroke={isLoading ? "#374151" : color}
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={isLoading ? circumference : offset}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "50% 50%",
              transition: "stroke-dashoffset 0.05s linear, stroke 0.3s ease",
            }}
          />
        </svg>

        {/* Center label */}
        <div className="absolute flex flex-col items-center">
          {isLoading ? (
            <span className="text-sm text-muted-foreground animate-pulse">
              Analyzing...
            </span>
          ) : score !== null ? (
            <>
              <span
                className="text-4xl font-bold tabular-nums"
                style={{ color }}
              >
                {animatedScore}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">No data</span>
          )}
        </div>
      </div>

      {/* Risk level badge */}
      {riskLevel && !isLoading && (
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full border ${riskBg[riskLevel] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}
        >
          {riskLevel} RISK
        </span>
      )}
    </div>
  );
}