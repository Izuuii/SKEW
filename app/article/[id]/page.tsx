"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  Globe,
  Bookmark,
  Share2,
  MoreHorizontal,
  Info,
  Check,
  Loader2,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Show, UserButton } from "@clerk/nextjs";
import type { ArticleWithAnalysis } from "@/lib/supabase/types";

interface ArticleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const unwrappedParams = React.use(params);
  const articleId = unwrappedParams.id;

  const [article, setArticle] = useState<ArticleWithAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [themeMode, setThemeMode] = useState<"Light" | "Dark" | "Auto">("Light");
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadArticle() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/articles/${articleId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setArticle(json.data);
        } else {
          setError(json.error || "Article not found");
        }
      } catch (err) {
        console.error("Error loading article details:", err);
        setError("Unable to load article details from database");
      } finally {
        setIsLoading(false);
      }
    }

    if (articleId) {
      loadArticle();
    }
  }, [articleId]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const leftPct = article?.analysis?.left_percentage ?? 33;
  const centerPct = article?.analysis?.center_percentage ?? 34;
  const rightPct = article?.analysis?.right_percentage ?? 33;
  const sourceName = article?.source?.name || "News Source";

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

            <Link href="/" className="flex items-center gap-1.5 cursor-pointer">
              <span className="text-[22px] font-bold tracking-tight text-[#0D0D0F]">
                biasly
              </span>
              <span className="text-[22px] font-normal text-[#0D0D0F]">
                News
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-[14px]">
            <Link href="/" className="font-medium text-[#0D0D0F] hover:opacity-80 py-4 transition-colors">
              Home
            </Link>
            <a href="#foryou" className="font-medium text-[#6B7280] hover:text-[#0D0D0F] py-4 transition-colors">
              For You
            </a>
            <a href="#local" className="font-medium text-[#6B7280] hover:text-[#0D0D0F] py-4 transition-colors">
              Local
            </a>
            <a href="#blindspot" className="font-medium text-[#6B7280] hover:text-[#0D0D0F] py-4 transition-colors">
              Blindspot
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Show when="signed-out">
              <Link href="/sign-up">
                <Button variant="primary" className="bg-[#0D0D0F] text-white rounded-md text-[13px] font-medium px-4 h-9 cursor-pointer">
                  Subscribe
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="secondary" outline className="bg-transparent border-[#E5E7EB] text-[#0D0D0F] rounded-md text-[13px] font-medium px-4 h-9 cursor-pointer">
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
          <div className="md:hidden bg-white border-b border-[#E5E7EB] px-4 py-3 space-y-2 text-[14px]">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="block font-semibold text-[#0D0D0F] py-1">
              Home
            </Link>
          </div>
        )}
      </header>

      {/* 3. MAIN DETAILS CONTENT AREA */}
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        <div className="mb-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6B7280] hover:text-[#0D0D0F]">
            <ArrowLeft className="w-4 h-4 stroke-[2]" /> Back to Top News
          </Link>
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-[#6B7280]">
            <Loader2 className="w-8 h-8 animate-spin text-[#0D0D0F]" />
            <p className="text-[14px]">Fetching article details & AI analysis from Supabase...</p>
          </div>
        ) : error || !article ? (
          <div className="py-16 text-center bg-white rounded-xl border border-red-200 p-8 max-w-md mx-auto">
            <p className="font-bold text-red-600 text-[18px] mb-2">Article Not Found</p>
            <p className="text-[13px] text-zinc-600 mb-4">{error || "Could not find article"}</p>
            <Link href="/">
              <Button className="bg-[#0D0D0F] text-white text-[13px] px-4 py-2">Return Home</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT MAIN ARTICLE COLUMN */}
            <div className="lg:col-span-8 space-y-6">
              <div className="text-[13px] font-medium text-[#6B7280]">
                {sourceName} • {article.analysis?.bias_label ? `AI Framing: ${article.analysis.bias_label.toUpperCase()}` : "News Analysis"}
              </div>

              <h1 className="text-[26px] sm:text-[32px] md:text-[36px] font-bold text-[#0D0D0F] leading-[1.25] tracking-tight">
                {article.title}
              </h1>

              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB] text-[13px] text-[#6B7280]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[#0D0D0F]">Source: {sourceName}</span>
                  <span>|</span>
                  <span>
                    {new Date(article.published_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span>|</span>
                  <a
                    href={article.original_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#1D4ED8] hover:underline"
                  >
                    <span>Original Story</span>
                    <ExternalLink className="w-3 h-3 stroke-[2]" />
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSaved(!isSaved)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[12px] font-medium transition-colors cursor-pointer ${
                      isSaved ? "bg-[#0D0D0F] text-white border-[#0D0D0F]" : "bg-white text-[#0D0D0F] border-[#E5E7EB] hover:bg-[#F6F6F6]"
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
                    {isCopied ? <Check className="w-3.5 h-3.5 text-green-600 stroke-[2]" /> : <Share2 className="w-3.5 h-3.5 stroke-[2]" />}
                    <span>{isCopied ? "Copied!" : "Share"}</span>
                  </button>
                </div>
              </div>

              {article.image_url && (
                <div className="w-full bg-[#E5E7EB] rounded-[12px] overflow-hidden shadow-xs">
                  <img
                    src={article.image_url}
                    alt={article.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=800&auto=format&fit=crop";
                    }}
                    className="w-full h-auto max-h-[460px] object-cover object-center"
                  />
                </div>
              )}

              {/* Bias Distribution Bar */}
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[12px] p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-[14px] text-[#0D0D0F]">
                    <span>Political Bias Distribution (AI Estimated)</span>
                  </div>
                  <span className="text-[12px] text-[#6B7280]">
                    Confidence: {Math.round((article.analysis?.confidence || 0.9) * 100)}%
                  </span>
                </div>

                <div className="h-9 w-full rounded-[8px] overflow-hidden flex font-medium text-[12px]">
                  <div style={{ width: `${leftPct}%` }} className="bg-[#B42318] text-white flex items-center justify-center font-bold text-[11px] sm:text-[12px] px-1">
                    Left {leftPct}%
                  </div>
                  <div style={{ width: `${centerPct}%` }} className="bg-[#E5E7EB] text-[#0D0D0F] flex items-center justify-center font-bold text-[11px] sm:text-[12px] px-1 border-x border-white">
                    Center {centerPct}%
                  </div>
                  <div style={{ width: `${rightPct}%` }} className="bg-[#1D4ED8] text-white flex items-center justify-center font-bold text-[11px] sm:text-[12px] px-1">
                    Right {rightPct}%
                  </div>
                </div>
              </div>

              {/* Article Raw Text */}
              <div className="text-[15px] sm:text-[16px] text-[#1E1E22] leading-[1.75] space-y-5 pt-2">
                <h3 className="text-[18px] font-bold text-[#0D0D0F]">Article Body Text</h3>
                <div className="whitespace-pre-line bg-white border border-[#E5E7EB] rounded-xl p-5 text-[15px]">
                  {article.raw_text}
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR COLUMN: FULL AI ANALYSIS */}
            <div className="lg:col-span-4 space-y-6">
              {/* CARD 1: BIAS & FRAMING ANALYSIS */}
              <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E7EB]/60 pb-3">
                  <h3 className="font-bold text-[16px] text-[#0D0D0F]">
                    AI Bias Analysis
                  </h3>
                  <Info className="w-4 h-4 text-[#6B7280]" />
                </div>

                <div className="space-y-1">
                  <div className="text-[12px] font-medium text-[#6B7280]">Framing Classification</div>
                  <div className="text-[24px] font-bold capitalize text-[#0D0D0F]">
                    {article.analysis?.bias_label || "Center"}
                  </div>
                  <div className="text-[12px] text-[#6B7280]">
                    Sentiment: <span className="capitalize font-semibold text-[#0D0D0F]">{article.analysis?.sentiment_label || "Neutral"}</span> (Score: {article.analysis?.sentiment_score ?? 0})
                  </div>
                </div>

                {article.analysis?.framing_notes && (
                  <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] text-[12px] text-[#4B5563] leading-[1.5]">
                    <span className="font-semibold text-[#0D0D0F] block mb-1">Framing Notes:</span>
                    {article.analysis.framing_notes}
                  </div>
                )}

                {article.analysis?.loaded_terms && article.analysis.loaded_terms.length > 0 && (
                  <div>
                    <span className="text-[12px] font-semibold text-[#0D0D0F] block mb-1.5">Loaded Terms Detected:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {article.analysis.loaded_terms.map((term, i) => (
                        <span key={i} className="text-[11px] bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded">
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* CARD 2: NEUTRAL AI SUMMARY */}
              <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E7EB]/60 pb-3">
                  <h3 className="font-bold text-[16px] text-[#0D0D0F]">
                    Neutral AI Summary
                  </h3>
                  <Info className="w-4 h-4 text-[#6B7280]" />
                </div>

                <p className="text-[13px] text-[#1F2937] leading-[1.6]">
                  {article.analysis?.summary || "No AI summary generated for this article yet."}
                </p>

                {article.analysis?.disclaimer && (
                  <div className="pt-2 border-t border-[#E5E7EB]">
                    <p className="text-[11px] text-[#6B7280] italic">
                      {article.analysis.disclaimer}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-[#1E1E22] text-white pt-12 pb-8 mt-auto">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="pt-6 text-[12px] text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 Biasly News. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
