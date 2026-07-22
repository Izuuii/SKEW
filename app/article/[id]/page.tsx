"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Menu,
  Globe,
  Bookmark,
  Share2,
  MoreHorizontal,
  Info,
  ChevronRight,
  Clock,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ArticleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  // Unwrap params using React.use
  const unwrappedParams = React.use(params);
  const articleId = unwrappedParams.id || "1";

  const [themeMode, setThemeMode] = useState<"Light" | "Dark" | "Auto">("Light");
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState<string>("");
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setIsSubscribed(true);
      setEmailInput("");
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  // Mock data for related stories
  const relatedStories = [
    {
      id: 101,
      imageUrl:
        "https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=400&auto=format&fit=crop",
      category: "World • Middle East",
      title: "Iran Says It Will Not Negotiate Under 'Maximum Pressure'",
      readTime: "May 28, 2026 • 8 min read",
    },
    {
      id: 102,
      imageUrl:
        "https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=400&auto=format&fit=crop",
      category: "Politics • United States",
      title: "Bipartisan Group Urges Diplomacy With Iran",
      readTime: "May 28, 2026 • 5 min read",
    },
    {
      id: 103,
      imageUrl:
        "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=400&auto=format&fit=crop",
      category: "Politics • United States",
      title: "US Sanctions More Iranian Entities Over Nuclear Program",
      readTime: "May 26, 2026 • 6 min read",
    },
    {
      id: 104,
      imageUrl:
        "https://images.unsplash.com/photo-1507413245164-6160d8298b31?q=80&w=400&auto=format&fit=crop",
      category: "Science • Nuclear Policy",
      title: "What's in the 2015 Iran Nuclear Deal?",
      readTime: "May 25, 2026 • 10 min read",
    },
    {
      id: 105,
      imageUrl:
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&auto=format&fit=crop",
      category: "World • Middle East",
      title: "Oman Hosts Another Round of US-Iran Nuclear Talks",
      readTime: "May 27, 2026 • 7 min read",
    },
    {
      id: 106,
      imageUrl:
        "https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=400&auto=format&fit=crop",
      category: "World • Middle East",
      title: "Israel Reaffirms Red Line Over Iranian Nuclear Program",
      readTime: "May 24, 2026 • 6 min read",
    },
  ];

  // Top sources list for sidebar breakdown
  const topSources = [
    { name: "Fox News", bias: "Right", color: "text-[#1D4ED8]" },
    { name: "The Wall Street Journal", bias: "Center", color: "text-[#6B7280]" },
    { name: "Reuters", bias: "Center", color: "text-[#6B7280]" },
    { name: "BBC", bias: "Center", color: "text-[#6B7280]" },
    { name: "CNN", bias: "Left", color: "text-[#B42318]" },
    { name: "The New York Times", bias: "Center", color: "text-[#6B7280]" },
    { name: "The Washington Post", bias: "Center", color: "text-[#6B7280]" },
    { name: "Newsmax", bias: "Right", color: "text-[#1D4ED8]" },
  ];

  return (
    <div className="min-h-screen bg-[#F0F0F0] text-[#0D0D0F] font-sans flex flex-col">
      {/* 1. TOP UTILITY HEADER BAR */}
      <div className="bg-[#EAEAEA] border-b border-[#E5E7EB] text-[11px] text-[#6B7280]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-1 sm:py-0 sm:h-7 flex flex-wrap items-center justify-between gap-y-1 gap-x-2">
          {/* Left utility elements */}
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden md:inline hover:text-[#0D0D0F] cursor-pointer">
              Browser Extension
            </span>
            <div className="flex items-center gap-1.5">
              <span className="hidden xs:inline">Theme:</span>
              {(["Light", "Dark", "Auto"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setThemeMode(mode)}
                  className={`hover:text-[#0D0D0F] cursor-pointer px-1 py-0.5 rounded ${
                    themeMode === mode
                      ? "text-[#0D0D0F] font-medium bg-[#DDD]"
                      : "text-[#6B7280]"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Right utility elements */}
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden lg:inline">Monday, June 1, 2026</span>
            <button
              type="button"
              className="hidden sm:inline hover:text-[#0D0D0F] cursor-pointer"
            >
              Set Location
            </button>
            <button
              type="button"
              className="flex items-center gap-1 hover:text-[#0D0D0F] cursor-pointer font-medium"
            >
              <Globe className="w-3 h-3 stroke-[2]" />
              <span className="truncate max-w-[130px] sm:max-w-none">
                International Edition
              </span>
              <span className="text-[9px]">▼</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN NAVIGATION HEADER */}
      <header className="bg-[#F0F0F0] border-b border-[#E5E7EB] sticky top-0 z-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Left section: Hamburger Menu & Logo */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              aria-label="Toggle Menu"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 text-[#0D0D0F] hover:bg-[#E5E7EB] rounded-md transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5 stroke-[2]" />
            </button>

            <Link href="/" className="flex items-center gap-1.5 cursor-pointer">
              <span className="text-[22px] font-bold tracking-tight text-[#0D0D0F]">
                biasly
              </span>
              <span className="text-[22px] font-normal text-[#0D0D0F]">
                News
              </span>
            </Link>
          </div>

          {/* Center navigation links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-[14px] font-medium text-[#0D0D0F] hover:opacity-80 py-4 transition-colors"
            >
              Home
            </Link>

            <div className="relative flex items-center">
              <a
                href="#foryou"
                className="text-[14px] font-medium text-[#6B7280] hover:text-[#0D0D0F] py-4 transition-colors"
              >
                For You
              </a>
              <span className="absolute -top-0.5 -right-2.5 w-1.5 h-1.5 rounded-full bg-[#B42318]" />
            </div>

            <a
              href="#local"
              className="text-[14px] font-medium text-[#6B7280] hover:text-[#0D0D0F] py-4 transition-colors"
            >
              Local
            </a>

            <a
              href="#blindspot"
              className="text-[14px] font-medium text-[#6B7280] hover:text-[#0D0D0F] py-4 transition-colors"
            >
              Blindspot
            </a>
          </nav>

          {/* Right action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="primary"
              className="bg-[#0D0D0F] hover:bg-[#222] text-white rounded-md text-[13px] font-medium px-4 h-9"
            >
              Subscribe
            </Button>
            <Button
              variant="secondary"
              outline
              className="bg-transparent border-[#E5E7EB] hover:bg-[#E5E7EB]/50 text-[#0D0D0F] rounded-md text-[13px] font-medium px-4 h-9"
            >
              Login
            </Button>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#E5E7EB] px-4 py-3 space-y-2 text-[14px]">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block font-semibold text-[#0D0D0F] py-1"
            >
              Home
            </Link>
            <a
              href="#foryou"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-[#6B7280] py-1"
            >
              For You
            </a>
            <a
              href="#local"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-[#6B7280] py-1"
            >
              Local
            </a>
            <a
              href="#blindspot"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-[#6B7280] py-1"
            >
              Blindspot
            </a>
          </div>
        )}
      </header>

      {/* 3. MAIN DETAILS CONTENT AREA */}
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ======================================================== */}
          {/* LEFT MAIN ARTICLE COLUMN (approx 67% width = 8 cols)      */}
          {/* ======================================================== */}
          <div className="lg:col-span-8 space-y-6">
            {/* Category Breadcrumb */}
            <div className="text-[13px] font-medium text-[#6B7280]">
              Politics • United States
            </div>

            {/* Main Headline */}
            <h1 className="text-[26px] sm:text-[32px] md:text-[36px] font-bold text-[#0D0D0F] leading-[1.25] tracking-tight">
              Trump Sends Iran Revised Peace Proposal With Tougher Terms: Report
            </h1>

            {/* Byline & Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB] text-[13px] text-[#6B7280]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-[#0D0D0F]">
                  By David Morgan
                </span>
                <span>|</span>
                <span>May 31, 2026</span>
                <span>|</span>
                <span>12 min read</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSaved(!isSaved)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[12px] font-medium transition-colors cursor-pointer ${
                    isSaved
                      ? "bg-[#0D0D0F] text-white border-[#0D0D0F]"
                      : "bg-white text-[#0D0D0F] border-[#E5E7EB] hover:bg-[#F6F6F6]"
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5 stroke-[2]" />
                  <span>{isSaved ? "Saved" : "Save"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-[#E5E7EB] hover:bg-[#F6F6F6] text-[12px] font-medium text-[#0D0D0F] transition-colors cursor-pointer"
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-green-600 stroke-[2]" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5 stroke-[2]" />
                  )}
                  <span>{isCopied ? "Copied!" : "Share"}</span>
                </button>

                <button
                  type="button"
                  aria-label="More options"
                  className="p-1.5 rounded-md bg-white border border-[#E5E7EB] hover:bg-[#F6F6F6] text-[#0D0D0F] transition-colors cursor-pointer"
                >
                  <MoreHorizontal className="w-4 h-4 stroke-[2]" />
                </button>
              </div>
            </div>

            {/* Main Hero Image & Photo Caption */}
            <div className="space-y-2">
              <div className="w-full bg-[#E5E7EB] rounded-[12px] overflow-hidden shadow-xs">
                <img
                  src="https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=1200&auto=format&fit=crop"
                  alt="President Donald Trump in the Cabinet Room"
                  className="w-full h-auto max-h-[460px] object-cover object-center"
                />
              </div>
              <p className="text-[12px] text-[#6B7280] leading-[1.5]">
                President Donald Trump in the Cabinet Room at the White House,
                Washington, D.C., May 30, 2026. Photo: Andrew Harnik/Getty
                Images
              </p>
            </div>

            {/* Bias Distribution Card (Inline under image) */}
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[12px] p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-[14px] text-[#0D0D0F]">
                  <span>Bias Distribution</span>
                  <button
                    type="button"
                    aria-label="Info"
                    className="text-[#6B7280] hover:text-[#0D0D0F]"
                  >
                    <Info className="w-4 h-4 stroke-[2]" />
                  </button>
                </div>
              </div>

              {/* 3-Segment Multi-Color Progress Bar */}
              <div className="h-9 w-full rounded-[8px] overflow-hidden flex font-medium text-[12px]">
                <div
                  style={{ width: "20%" }}
                  className="bg-[#B42318] text-white flex items-center justify-center font-bold text-[11px] sm:text-[12px] px-1"
                >
                  Left 20%
                </div>
                <div
                  style={{ width: "31%" }}
                  className="bg-[#E5E7EB] text-[#0D0D0F] flex items-center justify-center font-bold text-[11px] sm:text-[12px] px-1 border-x border-white"
                >
                  Center 31%
                </div>
                <div
                  style={{ width: "49%" }}
                  className="bg-[#1D4ED8] text-white flex items-center justify-center font-bold text-[11px] sm:text-[12px] px-1"
                >
                  Right 49%
                </div>
              </div>

              <div className="text-[12px] text-[#6B7280] font-medium">
                12 sources
              </div>
            </div>

            {/* Article Content Paragraphs */}
            <div className="text-[15px] sm:text-[16px] text-[#1E1E22] leading-[1.75] space-y-5 pt-2">
              <p>
                The Trump administration has sent Iran a revised nuclear deal
                proposal that includes tougher terms on uranium enrichment and
                stronger verification measures, according to a report published
                Saturday.
              </p>
              <p>
                The new proposal, delivered through intermediaries in Oman,
                requires Iran to halt all uranium enrichment on its soil and
                ship its stockpile of enriched uranium out of the country. It
                also demands unrestricted access for international inspectors
                to all Iranian nuclear facilities, including military sites.
              </p>
              <p className="italic pl-4 border-l-2 border-[#0D0D0F] text-[#0D0D0F] font-medium">
                &ldquo;This is a take-it-or-leave-it proposal,&rdquo; a senior
                administration official told the Wall Street Journal. &ldquo;The
                President wants a deal, but he will not accept a weak agreement
                that puts America or our allies at risk.&rdquo;
              </p>
              <p>
                Iran has not yet officially responded to the proposal. However,
                Iranian Foreign Minister Hossein Amir-Abdollahian said last week
                that any deal must respect Iran&apos;s right to peaceful nuclear
                energy and include the lifting of all U.S. sanctions.
              </p>
              <p>
                The revised proposal comes after several rounds of indirect
                talks between U.S. and Iranian officials failed to produce a
                breakthrough. The Trump administration has warned that if
                diplomacy fails, it is prepared to take other action to prevent
                Iran from obtaining a nuclear weapon.
              </p>
              <p>
                European allies have urged both sides to continue negotiations.
                &ldquo;We believe diplomacy is still the best path
                forward,&rdquo; said a spokesperson for the EU&apos;s foreign
                policy chief.
              </p>
              <p>
                Israel, which has long opposed the 2015 nuclear deal with Iran,
                praised the Trump administration&apos;s tougher stance.
                &ldquo;This is the kind of leadership that was missing in the
                past,&rdquo; said Israeli Prime Minister Benjamin Netanyahu in a
                statement.
              </p>
              <p>
                The fate of the proposal now rests with Iran, as global
                attention remains focused on whether a new nuclear agreement
                can be reached—or if tensions will escalate further.
              </p>
            </div>

            {/* Related Stories Section */}
            <div className="pt-8 border-t border-[#E5E7EB] space-y-4">
              <h3 className="text-[20px] font-bold text-[#0D0D0F] tracking-tight">
                Related Stories
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedStories.map((story) => (
                  <div
                    key={story.id}
                    className="bg-white rounded-[12px] border border-[#E5E7EB] p-3 flex gap-3 hover:shadow-md transition-shadow cursor-pointer group"
                  >
                    <img
                      src={story.imageUrl}
                      alt={story.title}
                      className="w-[84px] h-[72px] rounded-[8px] object-cover shrink-0 bg-[#F6F6F6] group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="flex flex-col justify-between flex-1 min-w-0">
                      <div>
                        <div className="text-[11px] font-medium text-[#6B7280] truncate">
                          {story.category}
                        </div>
                        <h4 className="text-[13px] font-bold text-[#0D0D0F] leading-[1.3] line-clamp-2 hover:text-[#1D4ED8] transition-colors mt-0.5">
                          {story.title}
                        </h4>
                      </div>
                      <div className="text-[11px] text-[#6B7280] mt-1">
                        {story.readTime}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT SIDEBAR COLUMN (approx 33% width = 4 cols)         */}
          {/* ======================================================== */}
          <div className="lg:col-span-4 space-y-6">
            {/* CARD 1: BIAS ANALYSIS */}
            <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E7EB]/60 pb-3">
                <h3 className="font-bold text-[16px] text-[#0D0D0F]">
                  Bias Analysis
                </h3>
                <button
                  type="button"
                  aria-label="Info"
                  className="text-[#6B7280] hover:text-[#0D0D0F]"
                >
                  <Info className="w-4 h-4 stroke-[2]" />
                </button>
              </div>

              <div className="space-y-1">
                <div className="text-[12px] font-medium text-[#6B7280]">
                  Overall Bias
                </div>
                <div className="text-[26px] font-bold text-[#1D4ED8]">
                  Right 49%
                </div>
                <div className="text-[12px] text-[#6B7280]">
                  Based on 12 balanced sources
                </div>
              </div>

              {/* Bias Percentage Meters */}
              <div className="space-y-2.5 pt-1">
                {/* Left */}
                <div>
                  <div className="flex justify-between text-[12px] font-medium mb-1">
                    <span className="text-[#0D0D0F]">Left</span>
                    <span className="text-[#B42318] font-bold">20%</span>
                  </div>
                  <div className="h-2 w-full bg-[#F6F6F6] rounded-full overflow-hidden">
                    <div
                      style={{ width: "20%" }}
                      className="h-full bg-[#B42318] rounded-full"
                    />
                  </div>
                </div>

                {/* Center */}
                <div>
                  <div className="flex justify-between text-[12px] font-medium mb-1">
                    <span className="text-[#0D0D0F]">Center</span>
                    <span className="text-[#6B7280] font-bold">31%</span>
                  </div>
                  <div className="h-2 w-full bg-[#F6F6F6] rounded-full overflow-hidden">
                    <div
                      style={{ width: "31%" }}
                      className="h-full bg-[#D1D5DB] rounded-full"
                    />
                  </div>
                </div>

                {/* Right */}
                <div>
                  <div className="flex justify-between text-[12px] font-medium mb-1">
                    <span className="text-[#0D0D0F]">Right</span>
                    <span className="text-[#1D4ED8] font-bold">49%</span>
                  </div>
                  <div className="h-2 w-full bg-[#F6F6F6] rounded-full overflow-hidden">
                    <div
                      style={{ width: "49%" }}
                      className="h-full bg-[#1D4ED8] rounded-full"
                    />
                  </div>
                </div>
              </div>

              <p className="text-[12px] text-[#6B7280] leading-[1.5]">
                Our analysis is based on the political leaning of the publication
                and how the story is framed. Sources are weighted by reliability
                and recency.
              </p>

              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-[8px] border border-[#E5E7EB] bg-white hover:bg-[#F6F6F6] text-[13px] font-semibold text-[#0D0D0F] transition-colors cursor-pointer"
              >
                How We Analyze Bias
              </button>
            </div>

            {/* CARD 2: AI SUMMARY */}
            <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E7EB]/60 pb-3">
                <h3 className="font-bold text-[16px] text-[#0D0D0F]">
                  AI Summary
                </h3>
                <button
                  type="button"
                  aria-label="Info"
                  className="text-[#6B7280] hover:text-[#0D0D0F]"
                >
                  <Info className="w-4 h-4 stroke-[2]" />
                </button>
              </div>

              <div className="text-[12px] text-[#6B7280]">
                Generated May 31, 2026 • 3 min read
              </div>

              {/* Bullet Points */}
              <ul className="space-y-3 text-[13px] text-[#0D0D0F] leading-[1.5]">
                <li className="flex items-start gap-2">
                  <span className="text-[#0D0D0F] font-bold">•</span>
                  <span>
                    The Trump administration has sent Iran a revised nuclear deal
                    proposal with tougher terms, including a complete halt to
                    uranium enrichment and the removal of enriched uranium
                    stockpiles.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0D0D0F] font-bold">•</span>
                  <span>
                    The proposal also demands unrestricted inspector access to all
                    nuclear sites, including military facilities.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0D0D0F] font-bold">•</span>
                  <span>
                    Iran has not responded officially but says any deal must respect
                    its right to peaceful nuclear energy and include sanctions
                    relief.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0D0D0F] font-bold">•</span>
                  <span>
                    The U.S. warns it is prepared to take other action if diplomacy
                    fails, while European allies urge continued negotiations.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0D0D0F] font-bold">•</span>
                  <span>
                    Israel supports the tougher stance, praising the
                    administration&apos;s determination to prevent Iran from
                    acquiring nuclear weapons.
                  </span>
                </li>
              </ul>

              <div className="pt-2">
                <p className="text-[12px] text-[#6B7280] italic mb-3">
                  AI summaries can make mistakes.
                </p>
                <button
                  type="button"
                  className="py-1.5 px-3 rounded-[6px] border border-[#E5E7EB] bg-white hover:bg-[#F6F6F6] text-[12px] font-medium text-[#0D0D0F] transition-colors cursor-pointer"
                >
                  Provide Feedback
                </button>
              </div>
            </div>

            {/* CARD 3: SOURCE BREAKDOWN */}
            <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E7EB]/60 pb-3">
                <h3 className="font-bold text-[16px] text-[#0D0D0F]">
                  Source Breakdown
                </h3>
                <button
                  type="button"
                  aria-label="Info"
                  className="text-[#6B7280] hover:text-[#0D0D0F]"
                >
                  <Info className="w-4 h-4 stroke-[2]" />
                </button>
              </div>

              <div className="text-[13px] font-bold text-[#0D0D0F]">
                12 Total Sources
              </div>

              {/* Spectrum distribution */}
              <div className="space-y-2">
                <div className="flex justify-between text-[12px]">
                  <span className="font-medium text-[#0D0D0F]">Left</span>
                  <span className="text-[#6B7280]">2 (20%)</span>
                </div>
                <div className="h-2 w-full bg-[#F6F6F6] rounded-full overflow-hidden">
                  <div style={{ width: "20%" }} className="h-full bg-[#B42318]" />
                </div>

                <div className="flex justify-between text-[12px] pt-1">
                  <span className="font-medium text-[#0D0D0F]">Center</span>
                  <span className="text-[#6B7280]">4 (31%)</span>
                </div>
                <div className="h-2 w-full bg-[#F6F6F6] rounded-full overflow-hidden">
                  <div style={{ width: "31%" }} className="h-full bg-[#D1D5DB]" />
                </div>

                <div className="flex justify-between text-[12px] pt-1">
                  <span className="font-medium text-[#0D0D0F]">Right</span>
                  <span className="text-[#6B7280]">6 (49%)</span>
                </div>
                <div className="h-2 w-full bg-[#F6F6F6] rounded-full overflow-hidden">
                  <div style={{ width: "49%" }} className="h-full bg-[#1D4ED8]" />
                </div>
              </div>

              {/* Top Sources Table */}
              <div className="pt-2">
                <div className="flex justify-between text-[12px] font-semibold text-[#6B7280] pb-2 border-b border-[#E5E7EB]">
                  <span>Top Sources</span>
                  <span>Bias</span>
                </div>
                <div className="divide-y divide-[#E5E7EB]/60">
                  {topSources.map((source) => (
                    <div
                      key={source.name}
                      className="flex items-center justify-between py-2 text-[13px]"
                    >
                      <span className="text-[#0D0D0F] font-medium">
                        {source.name}
                      </span>
                      <span className={`font-semibold ${source.color}`}>
                        {source.bias}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-[8px] border border-[#E5E7EB] bg-white hover:bg-[#F6F6F6] text-[13px] font-semibold text-[#0D0D0F] transition-colors cursor-pointer"
              >
                View All Sources
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 4. EMAIL NEWSLETTER SUBSCRIPTION BANNER */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 my-8 w-full">
        <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-[20px] sm:text-[22px] font-bold text-[#0D0D0F] tracking-tight">
              Stay Informed. Stay Balanced.
            </h3>
            <p className="text-[14px] text-[#6B7280]">
              Get the top stories and bias analysis delivered to your inbox.
            </p>
          </div>

          <form
            onSubmit={handleSubscribe}
            className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto"
          >
            <input
              type="email"
              placeholder="Enter your email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              required
              className="px-4 py-2.5 bg-[#F6F6F6] border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#0D0D0F] placeholder-[#9CA3AF] w-full sm:w-[280px] focus:outline-none focus:border-[#0D0D0F] transition-colors"
            />
            <Button
              type="submit"
              variant="primary"
              className="bg-[#0D0D0F] hover:bg-[#222] text-white rounded-[8px] text-[14px] font-medium px-6 h-10 w-full sm:w-auto shrink-0"
            >
              {isSubscribed ? "Subscribed!" : "Subscribe"}
            </Button>
          </form>
        </div>
      </section>

      {/* 5. MULTI-COLUMN DARK FOOTER */}
      <footer className="bg-[#1E1E22] text-white pt-12 pb-8 mt-auto">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-zinc-700/60">
            {/* Col 1: Brand & Tagline */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[22px] font-bold tracking-tight text-white">
                  biasly
                </span>
                <span className="text-[22px] font-normal text-white">
                  News
                </span>
              </div>
              <p className="text-[13px] text-zinc-400 max-w-[220px] leading-[1.5]">
                Balanced news coverage powered by AI.
              </p>
            </div>

            {/* Col 2: Company Links */}
            <div>
              <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">
                Company
              </h4>
              <ul className="space-y-2.5 text-[13px] text-zinc-400">
                {["About", "Careers", "Press", "Contact"].map((item) => (
                  <li key={item}>
                    <a
                      href={`#${item.toLowerCase()}`}
                      className="hover:text-white transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Help Links */}
            <div>
              <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">
                Help
              </h4>
              <ul className="space-y-2.5 text-[13px] text-zinc-400">
                {["Help Center", "Guides", "Privacy Policy", "Terms of Service"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                        className="hover:text-white transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Col 4: Connect / Socials */}
            <div>
              <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">
                Connect
              </h4>
              <div className="flex items-center gap-4 text-zinc-400">
                <a
                  href="#twitter"
                  aria-label="X Twitter"
                  className="hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="#linkedin"
                  aria-label="LinkedIn"
                  className="hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                  </svg>
                </a>
                <a
                  href="#substack"
                  aria-label="Substack"
                  className="hover:text-white transition-colors"
                >
                  <Share2 className="w-4 h-4 stroke-[2]" />
                </a>
                <a
                  href="#youtube"
                  aria-label="YouTube"
                  className="hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar copyright */}
          <div className="pt-6 text-[12px] text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 Biasly News. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
