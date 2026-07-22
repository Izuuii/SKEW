import * as React from "react";
import { Plus } from "lucide-react";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  showPlus?: boolean;
  active?: boolean;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  showPlus = true,
  active = false,
  className = "",
  ...props
}) => {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-normal leading-[1.6] transition-all duration-150 border cursor-pointer ${
        active
          ? "bg-[#0D0D0F] text-white border-[#0D0D0F]"
          : "bg-[#F6F6F6] text-[#0D0D0F] border-[#E5E7EB] hover:bg-[#E5E7EB]/70 hover:border-[#D1D5DB]"
      } ${className}`}
      {...props}
    >
      <span>{label}</span>
      {showPlus && <Plus className="w-3.5 h-3.5 opacity-70 stroke-[2]" />}
    </button>
  );
};
