"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Globe,
  Share2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ArticleCard } from "@/components/ui/article-card";
import { Show, UserButton, SignInButton } from "@clerk/nextjs";
import type { ArticleWithAnalysis, Source, BiasLabel } from "@/lib/supabase/types";

const biasFilterChips: Array<{ label: string; value: BiasLabel | null }> = [
  { label: "All News", value: null },
  { label: "Left Bias", value: "left" },
  { label: "Center Bias", value: "center" },
  { label: "Right Bias", value: "right" },
  { label: "Mixed Framing", value: "mixed" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("Home");
  const [themeMode, setThemeMode] = useState<"Light" | "Dark" | "Auto">("Light");
  const [activeBiasFilter, setActiveBiasFilter] = useState<BiasLabel | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const [articles, setArticles] = useState<ArticleWithAnalysis[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [sourcesRes, articlesRes] = await Promise.all([
          fetch("/api/sources"),
          fetch(
            `/api/articles?${new URLSearchParams({
              ...(selectedSourceId ? { sourceId: selectedSourceId } : {}),
              ...(activeBiasFilter ? { biasLabel: activeBiasFilter } : {}),
            }).toString()}`
          ),
        ]);

        const sourcesJson = await sourcesRes.json();
        const articlesJson = await articlesRes.json();

        if (sourcesJson.success) {
          setSources(sourcesJson.data || []);
        }

        if (articlesJson.success) {
          setArticles(articlesJson.data || []);
        } else {
          setError(articlesJson.error || "Failed to load articles");
        }
      } catch (err) {
        console.error("Error fetching articles from database:", err);
        setError("Unable to connect to database");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [selectedSourceId, activeBiasFilter]);

  return (
    <div className="min-h-screen bg-[#F0F0F0] text-[#0D0D0F] font-sans flex flex-col">
      {/* 1. TOP UTILITY HEADER BAR */}
      <div className="bg-[#EAEAEA] border-b border-[#E5E7EB] text-[11px] text-[#6B7280]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-1 sm:py-0 sm:h-7 flex flex-wrap items-center justify-between gap-y-1 gap-x-2">
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

          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden lg:inline">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
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

      {/* 3. CATEGORY / BIAS HORIZONTAL FILTER BAR */}
      <div className="border-b border-[#E5E7EB] bg-[#F0F0F0]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 overflow-x-auto py-0.5 no-scrollbar scroll-smooth">
            {biasFilterChips.map((chip) => (
              <Chip
                key={chip.label}
                label={chip.label}
                showPlus={false}
                active={activeBiasFilter === chip.value}
                onClick={() => setActiveBiasFilter(chip.value)}
                className={`shrink-0 text-[13px] border-[#E5E7EB] py-1 px-3 cursor-pointer ${
                  activeBiasFilter === chip.value
                    ? "bg-[#0D0D0F] text-white"
                    : "bg-white/80 hover:bg-white text-[#0D0D0F]"
                }`}
              />
            ))}
          </div>

          {sources.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 shrink-0 border-l border-[#E5E7EB] pl-3">
              <span className="text-[12px] text-[#6B7280]">Source:</span>
              <select
                value={selectedSourceId || ""}
                onChange={(e) => setSelectedSourceId(e.target.value || null)}
                className="text-[12px] bg-white border border-[#E5E7EB] rounded px-2 py-1 text-[#0D0D0F]"
              >
                <option value="">All Sources</option>
                {sources.map((src) => (
                  <option key={src.id} value={src.id}>
                    {src.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 4. MAIN CONTENT: TOP NEWS GRID */}
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[28px] sm:text-[32px] font-bold text-[#0D0D0F] tracking-tight">
            Top News
          </h1>
          <span className="text-[13px] text-[#6B7280]">
            {articles.length} Stored {articles.length === 1 ? "Article" : "Articles"}
          </span>
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-[#6B7280]">
            <Loader2 className="w-8 h-8 animate-spin text-[#0D0D0F]" />
            <p className="text-[14px]">Loading real news from Supabase database...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center bg-white rounded-xl border border-red-200 p-8 text-red-600 max-w-md mx-auto">
            <p className="font-semibold mb-2">Database Connection Notice</p>
            <p className="text-[13px] text-zinc-600 mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-[#0D0D0F] text-white text-[13px] px-4 py-2"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Retry Connection
            </Button>
          </div>
        ) : articles.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-xl border border-[#E5E7EB] p-8 max-w-md mx-auto">
            <p className="font-bold text-[#0D0D0F] text-[18px] mb-2">No Stored Articles Found</p>
            <p className="text-[13px] text-[#6B7280] mb-4">
              Run `supabase/seed.sql` in your Supabase SQL Editor to populate sample articles and analyses.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => {
              const sourceName = article.source?.name || "News Source";
              const leftPct = article.analysis?.left_percentage ?? 33;
              const centerPct = article.analysis?.center_percentage ?? 34;
              const rightPct = article.analysis?.right_percentage ?? 33;

              return (
                <Link key={article.id} href={`/article/${article.id}`} className="block">
                  <ArticleCard
                    imageUrl={article.image_url}
                    category={sourceName}
                    location={article.analysis?.bias_label ? `Framing: ${article.analysis.bias_label.toUpperCase()}` : "Global"}
                    title={article.title}
                    summary={article.analysis?.summary}
                    leftPercentage={leftPct}
                    centerPercentage={centerPct}
                    rightPercentage={rightPct}
                    sourcesCount={Math.round((article.analysis?.confidence || 0.9) * 100)}
                    timeAgo={new Date(article.published_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                    variant="grid"
                  />
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* 5. MULTI-COLUMN DARK FOOTER */}
      <footer className="bg-[#1E1E22] text-white pt-12 pb-8 mt-auto">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-zinc-700/60">
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
                Balanced news coverage powered by AI and Supabase.
              </p>
            </div>

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
              </div>
            </div>
          </div>

          <div className="pt-6 text-[12px] text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 Biasly News. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}