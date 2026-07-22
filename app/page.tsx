"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Globe,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ArticleCard } from "@/components/ui/article-card";
import { Show, UserButton, SignInButton } from "@clerk/nextjs";

// Mock data for the 12 Top News articles matching Skew Home spec
const articlesData = [
  {
    id: 1,
    imageUrl:
      "https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=800&auto=format&fit=crop",
    category: "Politics",
    location: "United States",
    title: "Trump Sends Iran Revised Peace Proposal With Tougher Terms: Report",
    leftPercentage: 20,
    centerPercentage: 31,
    rightPercentage: 49,
    sourcesCount: 12,
  },
  {
    id: 2,
    imageUrl:
      "https://images.unsplash.com/photo-1596368708356-6e1e1025ee73?q=80&w=800&auto=format&fit=crop",
    category: "Health",
    location: "United States",
    title:
      "Researchers Make Case for Grapes as a 'Superfood' After Review of Health Evidence",
    leftPercentage: 18,
    centerPercentage: 42,
    rightPercentage: 40,
    sourcesCount: 7,
  },
  {
    id: 3,
    imageUrl:
      "https://images.unsplash.com/photo-1507413245164-6160d8298b31?q=80&w=800&auto=format&fit=crop",
    category: "Science",
    location: "Switzerland",
    title:
      "CERN Finds High-Significance Hint of Physics Beyond Standard Model",
    leftPercentage: 16,
    centerPercentage: 62,
    rightPercentage: 22,
    sourcesCount: 8,
  },
  {
    id: 4,
    imageUrl:
      "https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=800&auto=format&fit=crop",
    category: "World",
    location: "Nicaragua",
    title:
      "Indigenous Leader Brooklyn Rivera Dies in Nicaragua After Nearly 3 Years of Detention",
    leftPercentage: 54,
    centerPercentage: 28,
    rightPercentage: 18,
    sourcesCount: 63,
  },
  {
    id: 5,
    imageUrl:
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=800&auto=format&fit=crop",
    category: "World",
    location: "Middle East",
    title:
      "UN Security Council to Hold Emergency Meeting as Israel Pushes Deeper into Lebanon",
    leftPercentage: 22,
    centerPercentage: 35,
    rightPercentage: 43,
    sourcesCount: 15,
  },
  {
    id: 6,
    imageUrl:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop",
    category: "Business",
    location: "Global",
    title:
      "Oil Prices Dip as OPEC+ Considers Output Increase Amid Weak Demand",
    leftPercentage: 22,
    centerPercentage: 50,
    rightPercentage: 28,
    sourcesCount: 11,
  },
  {
    id: 7,
    imageUrl:
      "https://images.unsplash.com/photo-1517976487492-5750f3195933?q=80&w=800&auto=format&fit=crop",
    category: "Technology",
    location: "United States",
    title:
      "SpaceX Launches Starship Test Flight in Milestone for Mars Program",
    leftPercentage: 12,
    centerPercentage: 45,
    rightPercentage: 49,
    sourcesCount: 9,
  },
  {
    id: 8,
    imageUrl:
      "https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=800&auto=format&fit=crop",
    category: "Business",
    location: "United States",
    title:
      "Apple Unveils AI-Powered Features Across iPhone, iPad and Mac",
    leftPercentage: 15,
    centerPercentage: 40,
    rightPercentage: 45,
    sourcesCount: 10,
  },
  {
    id: 9,
    imageUrl:
      "https://images.unsplash.com/photo-1504386106331-3e4e71712b38?q=80&w=800&auto=format&fit=crop",
    category: "Climate",
    location: "Global",
    title:
      "2025 on Track to Be Among Top 3 Hottest Years, EU Climate Service Says",
    leftPercentage: 33,
    centerPercentage: 34,
    rightPercentage: 33,
    sourcesCount: 14,
  },
  {
    id: 10,
    imageUrl:
      "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=800&auto=format&fit=crop",
    category: "Economy",
    location: "United States",
    title:
      "Fed Holds Rates Steady, Signals Caution on Inflation and Growth Outlook",
    leftPercentage: 30,
    centerPercentage: 45,
    rightPercentage: 25,
    sourcesCount: 13,
  },
  {
    id: 11,
    imageUrl:
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800&auto=format&fit=crop",
    category: "Soccer",
    location: "Europe",
    title:
      "Real Madrid Win Champions League After Comeback Victory in Final",
    leftPercentage: 10,
    centerPercentage: 20,
    rightPercentage: 70,
    sourcesCount: 26,
  },
  {
    id: 12,
    imageUrl:
      "https://images.unsplash.com/photo-1599818816822-2632b498fbe8?q=80&w=800&auto=format&fit=crop",
    category: "Environment",
    location: "Canada",
    title:
      "Wildfires Force Thousands to Evacuate Across Western Canada",
    leftPercentage: 27,
    centerPercentage: 33,
    rightPercentage: 40,
    sourcesCount: 17,
  },
];

const topicFilterChips = [
  "World Cup",
  "IPL",
  "Social Media",
  "Business & Markets",
  "Health & Medicine",
  "Soccer",
  "Artificial Intelligence",
  "Arsenal FC",
  "Extreme Weather and Disasters",
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("Home");
  const [themeMode, setThemeMode] = useState<"Light" | "Dark" | "Auto">("Light");
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

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
                    themeMode === mode ? "text-[#0D0D0F] font-medium bg-[#DDD]" : "text-[#6B7280]"
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
            <button type="button" className="hidden sm:inline hover:text-[#0D0D0F] cursor-pointer">
              Set Location
            </button>
            <button
              type="button"
              className="flex items-center gap-1 hover:text-[#0D0D0F] cursor-pointer font-medium"
            >
              <Globe className="w-3 h-3 stroke-[2]" />
              <span className="truncate max-w-[130px] sm:max-w-none">International Edition</span>
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

            <Link href="/" className="flex items-center gap-1.5 select-none">
              <span className="text-[20px] sm:text-[22px] font-bold tracking-tight text-[#0D0D0F]">
                biasly
              </span>
              <span className="text-[20px] sm:text-[22px] font-normal text-[#0D0D0F]">
                News
              </span>
            </Link>
          </div>

          {/* Center Navigation Tabs (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-[14px]">
            {[
              { label: "Home", hasBadge: false },
              { label: "For You", hasBadge: true },
              { label: "Local", hasBadge: false },
              { label: "Blindspot", hasBadge: false },
            ].map((nav) => (
              <button
                key={nav.label}
                type="button"
                onClick={() => setActiveTab(nav.label)}
                className={`relative py-4 transition-colors cursor-pointer ${
                  activeTab === nav.label
                    ? "font-semibold text-[#0D0D0F]"
                    : "text-[#6B7280] hover:text-[#0D0D0F]"
                }`}
              >
                <span className="inline-flex items-center gap-0.5">
                  {nav.label}
                  {nav.hasBadge && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B42318] inline-block -mt-2"></span>
                  )}
                </span>
                {activeTab === nav.label && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0D0D0F]" />
                )}
              </button>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Show when="signed-out">
              <Link href="/sign-up">
                <Button
                  variant="primary"
                  className="bg-[#0D0D0F] text-white hover:bg-[#0D0D0F]/90 text-[12px] sm:text-[13px] font-medium px-3 sm:px-4 py-1.5 rounded-[6px] h-8 sm:h-9 cursor-pointer"
                >
                  Subscribe
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button
                  variant="secondary"
                  outline
                  className="border border-[#E5E7EB] bg-white text-[#0D0D0F] hover:bg-[#F6F6F6] text-[12px] sm:text-[13px] font-medium px-3 sm:px-4 py-1.5 rounded-[6px] h-8 sm:h-9 cursor-pointer"
                >
                  Login
                </Button>
              </Link>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>
        </div>

        {/* Collapsible Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#E5E7EB] bg-white px-4 py-3 space-y-2 shadow-md">
            {[
              { label: "Home", hasBadge: false },
              { label: "For You", hasBadge: true },
              { label: "Local", hasBadge: false },
              { label: "Blindspot", hasBadge: false },
            ].map((nav) => (
              <button
                key={nav.label}
                type="button"
                onClick={() => {
                  setActiveTab(nav.label);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-[14px] rounded-md transition-colors ${
                  activeTab === nav.label
                    ? "font-semibold bg-[#F6F6F6] text-[#0D0D0F]"
                    : "text-[#6B7280] hover:bg-[#F9F9F9] hover:text-[#0D0D0F]"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  {nav.label}
                  {nav.hasBadge && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B42318] inline-block"></span>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* 3. CATEGORY / TOPICS HORIZONTAL FILTER BAR */}
      <div className="border-b border-[#E5E7EB] bg-[#F0F0F0]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            aria-label="Previous Topics"
            className="shrink-0 text-[#6B7280] hover:text-[#0D0D0F] p-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2]" />
          </button>

          <div className="flex items-center gap-2 overflow-x-auto py-0.5 no-scrollbar scroll-smooth">
            {topicFilterChips.map((topic) => (
              <Chip
                key={topic}
                label={topic}
                showPlus={true}
                active={activeChip === topic}
                onClick={() => setActiveChip(activeChip === topic ? null : topic)}
                className="shrink-0 bg-white/80 hover:bg-white text-[13px] text-[#0D0D0F] border-[#E5E7EB] py-1 px-3"
              />
            ))}
          </div>

          <button
            type="button"
            aria-label="Next Topics"
            className="shrink-0 text-[#6B7280] hover:text-[#0D0D0F] p-1 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 stroke-[2]" />
          </button>
        </div>
      </div>

      {/* 4. MAIN CONTENT: TOP NEWS GRID */}
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <h1 className="text-[28px] sm:text-[32px] font-bold text-[#0D0D0F] tracking-tight mb-6">
          Top News
        </h1>

        {/* 3-Column Responsive Grid matching Skew Home */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articlesData.map((article) => (
            <Link key={article.id} href={`/article/${article.id}`} className="block">
              <ArticleCard
                imageUrl={article.imageUrl}
                category={article.category}
                location={article.location}
                title={article.title}
                leftPercentage={article.leftPercentage}
                centerPercentage={article.centerPercentage}
                rightPercentage={article.rightPercentage}
                sourcesCount={article.sourcesCount}
                variant="grid"
              />
            </Link>
          ))}
        </div>
      </main>

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
                    <a href={`#${item.toLowerCase()}`} className="hover:text-white transition-colors">
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
                {["Help Center", "Guides", "Privacy Policy", "Terms of Service"].map((item) => (
                  <li key={item}>
                    <a href={`#${item.toLowerCase().replace(/\s+/g, "-")}`} className="hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4: Connect / Socials */}
            <div>
              <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">
                Connect
              </h4>
              <div className="flex items-center gap-4 text-zinc-400">
                <a href="#twitter" aria-label="X Twitter" className="hover:text-white transition-colors">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="#linkedin" aria-label="LinkedIn" className="hover:text-white transition-colors">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                  </svg>
                </a>
                <a href="#substack" aria-label="Substack" className="hover:text-white transition-colors">
                  <Share2 className="w-4 h-4 stroke-[2]" />
                </a>
                <a href="#youtube" aria-label="YouTube" className="hover:text-white transition-colors">
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