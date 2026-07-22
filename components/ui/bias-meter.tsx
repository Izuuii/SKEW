import * as React from "react";

export interface BiasMeterProps {
  leftPercentage?: number;
  centerPercentage?: number;
  rightPercentage?: number;
  showTicks?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const BiasMeter: React.FC<BiasMeterProps> = ({
  leftPercentage = 25,
  centerPercentage = 50,
  rightPercentage = 25,
  showTicks = true,
  className = "",
  size = "md",
}) => {
  const total = leftPercentage + centerPercentage + rightPercentage;
  const leftPct = total > 0 ? Math.round((leftPercentage / total) * 100) : 0;
  const centerPct = total > 0 ? Math.round((centerPercentage / total) * 100) : 0;
  const rightPct = total > 0 ? 100 - leftPct - centerPct : 0;

  const heightClass = size === "sm" ? "h-6 text-[11px]" : size === "lg" ? "h-9 text-[13px]" : "h-7 text-[12px]";

  return (
    <div className={`w-full ${className}`}>
      {/* Bar container */}
      <div className={`flex w-full overflow-hidden rounded-[4px] font-medium leading-none ${heightClass}`}>
        {/* Left Segment */}
        {leftPct > 0 && (
          <div
            style={{ width: `${leftPct}%` }}
            className="bg-[#B42318] text-white flex items-center justify-center transition-all duration-300 px-1 truncate"
          >
            Left {leftPct}%
          </div>
        )}

        {/* Center Segment */}
        {centerPct > 0 && (
          <div
            style={{ width: `${centerPct}%` }}
            className="bg-[#E5E7EB] text-[#0D0D0F] flex items-center justify-center transition-all duration-300 px-1 truncate"
          >
            Center {centerPct}%
          </div>
        )}

        {/* Right Segment */}
        {rightPct > 0 && (
          <div
            style={{ width: `${rightPct}%` }}
            className="bg-[#1D4ED8] text-white flex items-center justify-center transition-all duration-300 px-1 truncate"
          >
            Right {rightPct}%
          </div>
        )}
      </div>

      {/* Ticks */}
      {showTicks && (
        <div className="flex justify-between items-center text-[11px] text-[#6B7280] mt-1 px-0.5 select-none">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      )}
    </div>
  );
};
