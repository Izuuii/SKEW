import * as React from "react";
import Image from "next/image";
import { Clock, Bookmark, Info } from "lucide-react";
import { BiasMeter } from "./bias-meter";

export interface ArticleCardProps {
  imageUrl?: string;
  category?: string;
  location?: string;
  title: string;
  summary: string;
  leftPercentage?: number;
  centerPercentage?: number;
  rightPercentage?: number;
  timeAgo?: string;
  readTime?: string;
  className?: string;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  imageUrl = "https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=800&auto=format&fit=crop",
  category = "Politics",
  location = "United States",
  title = "Trump Sends Iran Revised Peace Proposal With Tougher Terms: Report",
  summary = "The proposal includes stricter limits on uranium enrichment and enhanced verification measures.",
  leftPercentage = 25,
  centerPercentage = 50,
  rightPercentage = 49,
  timeAgo = "2h ago",
  readTime = "12 min read",
  className = "",
}) => {
  return (
    <article className={`bg-white rounded-[12px] border border-[#E5E7EB] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] hover:shadow-[0px_4px_12px_rgba(0,0,0,0.08)] transition-all duration-200 overflow-hidden flex flex-col md:flex-row ${className}`}>
      {/* Image container */}
      <div className="relative w-full md:w-[280px] shrink-0 h-[200px] md:h-auto bg-[#F6F6F6] overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover object-center"
        />
        <button
          type="button"
          aria-label="Info"
          className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 text-white backdrop-blur-xs hover:bg-black/60 transition-colors"
        >
          <Info className="w-3.5 h-3.5 stroke-[2]" />
        </button>
      </div>

      {/* Details content */}
      <div className="p-5 flex flex-col justify-between flex-1 gap-4">
        <div>
          {/* Metadata category */}
          <div className="text-[12px] font-medium text-[#6B7280] mb-1.5">
            <span>{category}</span>
            {location && (
              <>
                <span className="mx-1 font-bold">•</span>
                <span>{location}</span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="text-[18px] md:text-[20px] font-bold text-[#0D0D0F] leading-[1.3] tracking-tight mb-2 hover:text-[#1D4ED8] transition-colors cursor-pointer">
            {title}
          </h3>

          {/* Excerpt */}
          <p className="text-[13px] md:text-[14px] text-[#6B7280] leading-[1.6] line-clamp-2">
            {summary}
          </p>
        </div>

        {/* Bias Meter */}
        <div className="pt-1">
          <BiasMeter
            leftPercentage={leftPercentage}
            centerPercentage={centerPercentage}
            rightPercentage={rightPercentage}
            showTicks={false}
            size="sm"
          />
        </div>

        {/* Card Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]/60 text-[12px] text-[#6B7280]">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 stroke-[2]" />
            <span>{timeAgo}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-1.5 hover:text-[#0D0D0F] transition-colors cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5 stroke-[2]" />
              <span>{readTime}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
