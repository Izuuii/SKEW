import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "text";
  outline?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", outline = false, disabled, className = "", children, ...props }, ref) => {
    let baseStyles = "inline-flex items-center justify-center font-medium text-[14px] leading-[1.6] rounded-[8px] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D0D0F]/20 disabled:pointer-events-none px-4 py-2";

    if (variant === "primary") {
      if (disabled) {
        baseStyles += " bg-[#E5E7EB] text-[#6B7280] cursor-not-allowed";
      } else if (outline) {
        baseStyles += " bg-transparent border border-[#0D0D0F] text-[#0D0D0F] hover:bg-[#F6F6F6]";
      } else {
        baseStyles += " bg-[#0D0D0F] text-white hover:bg-[#0D0D0F]/90 active:bg-[#0D0D0F]/80";
      }
    } else if (variant === "secondary") {
      if (disabled) {
        baseStyles += " bg-[#F0F0F0] text-[#6B7280]/60 cursor-not-allowed";
      } else if (outline) {
        baseStyles += " bg-transparent border border-[#E5E7EB] text-[#0D0D0F] hover:bg-[#F6F6F6]";
      } else {
        baseStyles += " bg-[#F6F6F6] border border-[#E5E7EB] text-[#0D0D0F] hover:bg-[#E5E7EB] active:bg-[#E5E7EB]/80";
      }
    } else if (variant === "text") {
      if (disabled) {
        baseStyles += " bg-transparent text-[#6B7280]/50 cursor-not-allowed";
      } else if (outline) {
        baseStyles += " bg-transparent text-[#0D0D0F] hover:underline";
      } else {
        baseStyles += " bg-transparent text-[#0D0D0F] hover:text-[#1D4ED8] active:text-[#1D4ED8]/80 px-2 py-1";
      }
    }

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${baseStyles} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
