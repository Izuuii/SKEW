import React from "react";
import {
  Menu,
  Search,
  Bookmark,
  Clock,
  Info,
  Share2,
  ExternalLink,
  Calendar,
  TrendingUp,
  Tag,
  User,
  Bell,
  SlidersHorizontal,
  CheckCircle2,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { BiasMeter } from "@/components/ui/bias-meter";
import { ArticleCard } from "@/components/ui/article-card";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F0F0F0] text-[#0D0D0F] font-sans pb-12">
      {/* Top Header Container */}
      <div className="max-w-[1280px] mx-auto px-6 py-8">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-[#E5E7EB] pb-6 mb-8 gap-4">
          <div>
            <h1 className="text-[36px] font-bold tracking-tight text-[#0D0D0F]">
              biasly <span className="text-[20px] font-normal text-[#6B7280]">News</span>
            </h1>
            <p className="text-[14px] text-[#6B7280] mt-1">
              Balanced news coverage, powered by AI.
            </p>
          </div>
          <div className="text-left md:text-right text-[12px] text-[#6B7280]">
            <span className="bg-[#E5E7EB] px-2.5 py-1 rounded-full font-medium text-[#0D0D0F] inline-block mb-1">
              Design System v1.0
            </span>
            <p>June 1, 2026</p>
          </div>
        </header>

        {/* 12-Column Grid Layout matching UI Spec */}
        <main className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* BRAND CARD (Cols 1-4) */}
          <section className="md:col-span-4 bg-white p-6 rounded-[12px] border border-[#E5E7EB] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] flex flex-col justify-between">
            <div>
              <h2 className="text-[11px] font-semibold tracking-wider text-[#6B7280] uppercase mb-6">
                BRAND
              </h2>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <h1 className="text-[48px] font-bold tracking-tight text-[#0D0D0F] leading-none mb-1">
                  biasly
                </h1>
                <span className="text-[24px] font-semibold text-[#0D0D0F] mb-6">
                  News
                </span>
                <p className="text-[14px] text-[#6B7280] max-w-[220px]">
                  Balanced news coverage, powered by AI.
                </p>
              </div>
            </div>
            <div className="border-t border-[#E5E7EB] pt-4 text-center text-[12px] text-[#6B7280]">
              biasly design guidelines
            </div>
          </section>

          {/* TYPOGRAPHY CARD (Cols 5-12) */}
          <section className="md:col-span-8 bg-white p-6 rounded-[12px] border border-[#E5E7EB] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
            <h2 className="text-[11px] font-semibold tracking-wider text-[#6B7280] uppercase mb-4">
              TYPOGRAPHY
            </h2>
            <div className="mb-4">
              <span className="text-[12px] font-medium text-[#6B7280]">FONT FAMILY</span>
              <h3 className="text-[28px] font-bold text-[#0D0D0F]">Poppins</h3>
              <p className="text-[13px] text-[#6B7280]">
                Poppins is a modern geometric sans-serif typeface that ensures clarity and excellent readability.
              </p>
            </div>

            {/* Typography Spec Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-[#6B7280] text-[11px] font-semibold uppercase">
                    <th className="pb-2">STYLE</th>
                    <th className="pb-2">SAMPLE</th>
                    <th className="pb-2">SIZE</th>
                    <th className="pb-2">WEIGHT</th>
                    <th className="pb-2">LINE HEIGHT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]/60">
                  <tr>
                    <td className="py-2.5 font-bold text-[14px]">H1</td>
                    <td className="py-2.5 text-[20px] font-bold truncate max-w-[160px]">Page / Screen Title</td>
                    <td className="py-2.5 text-[#6B7280]">32px</td>
                    <td className="py-2.5 text-[#6B7280]">Bold</td>
                    <td className="py-2.5 text-[#6B7280]">1.2</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold text-[14px]">H2</td>
                    <td className="py-2.5 text-[18px] font-semibold truncate max-w-[160px]">Section Title</td>
                    <td className="py-2.5 text-[#6B7280]">24px</td>
                    <td className="py-2.5 text-[#6B7280]">SemiBold</td>
                    <td className="py-2.5 text-[#6B7280]">1.3</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold text-[14px]">H3</td>
                    <td className="py-2.5 text-[16px] font-semibold truncate max-w-[160px]">Card / Module Title</td>
                    <td className="py-2.5 text-[#6B7280]">20px</td>
                    <td className="py-2.5 text-[#6B7280]">SemiBold</td>
                    <td className="py-2.5 text-[#6B7280]">1.3</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium text-[14px]">H4</td>
                    <td className="py-2.5 text-[14px] font-medium truncate max-w-[160px]">Subheading</td>
                    <td className="py-2.5 text-[#6B7280]">16px</td>
                    <td className="py-2.5 text-[#6B7280]">Medium</td>
                    <td className="py-2.5 text-[#6B7280]">1.4</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-[13px]">Body Large</td>
                    <td className="py-2.5 text-[14px] truncate max-w-[160px]">Important content</td>
                    <td className="py-2.5 text-[#6B7280]">16px</td>
                    <td className="py-2.5 text-[#6B7280]">Regular</td>
                    <td className="py-2.5 text-[#6B7280]">1.6</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-[13px]">Body Medium</td>
                    <td className="py-2.5 text-[13px] truncate max-w-[160px]">Body text</td>
                    <td className="py-2.5 text-[#6B7280]">14px</td>
                    <td className="py-2.5 text-[#6B7280]">Regular</td>
                    <td className="py-2.5 text-[#6B7280]">1.6</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-[13px]">Body Small</td>
                    <td className="py-2.5 text-[12px] truncate max-w-[160px]">Supporting text</td>
                    <td className="py-2.5 text-[#6B7280]">13px</td>
                    <td className="py-2.5 text-[#6B7280]">Regular</td>
                    <td className="py-2.5 text-[#6B7280]">1.6</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-[12px]">Caption</td>
                    <td className="py-2.5 text-[11px] truncate max-w-[160px]">Labels, meta text</td>
                    <td className="py-2.5 text-[#6B7280]">11px</td>
                    <td className="py-2.5 text-[#6B7280]">Regular</td>
                    <td className="py-2.5 text-[#6B7280]">1.4</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* COLORS CARD (Cols 1-4) */}
          <section className="md:col-span-4 bg-white p-6 rounded-[12px] border border-[#E5E7EB] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] space-y-6">
            <h2 className="text-[11px] font-semibold tracking-wider text-[#6B7280] uppercase">
              COLORS
            </h2>

            {/* Primary Colors */}
            <div>
              <span className="text-[11px] font-semibold uppercase text-[#6B7280] block mb-2">PRIMARY</span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="h-14 bg-[#0D0D0F] rounded-[8px] border border-[#E5E7EB] mb-1"></div>
                  <p className="text-[10px] font-medium">TEXT PRIMARY</p>
                  <p className="text-[10px] text-[#6B7280]">#0D0D0F</p>
                </div>
                <div>
                  <div className="h-14 bg-[#6B7280] rounded-[8px] mb-1"></div>
                  <p className="text-[10px] font-medium">TEXT SECONDARY</p>
                  <p className="text-[10px] text-[#6B7280]">#6B7280</p>
                </div>
                <div>
                  <div className="h-14 bg-[#F6F6F6] border border-[#E5E7EB] rounded-[8px] mb-1"></div>
                  <p className="text-[10px] font-medium">SURFACE</p>
                  <p className="text-[10px] text-[#6B7280]">#F6F6F6</p>
                </div>
              </div>
            </div>

            {/* Semantic Colors */}
            <div>
              <span className="text-[11px] font-semibold uppercase text-[#6B7280] block mb-2">SEMANTIC</span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="h-14 bg-[#B42318] rounded-[8px] mb-1"></div>
                  <p className="text-[10px] font-medium">LEFT BIAS</p>
                  <p className="text-[10px] text-[#6B7280]">#B42318</p>
                </div>
                <div>
                  <div className="h-14 bg-[#E5E7EB] border border-[#D1D5DB] rounded-[8px] mb-1"></div>
                  <p className="text-[10px] font-medium">CENTER</p>
                  <p className="text-[10px] text-[#6B7280]">#E5E7EB</p>
                </div>
                <div>
                  <div className="h-14 bg-[#1D4ED8] rounded-[8px] mb-1"></div>
                  <p className="text-[10px] font-medium">RIGHT BIAS</p>
                  <p className="text-[10px] text-[#6B7280]">#1D4ED8</p>
                </div>
              </div>
            </div>

            {/* Neutrals */}
            <div>
              <span className="text-[11px] font-semibold uppercase text-[#6B7280] block mb-2">NEUTRALS</span>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="h-12 bg-white border border-[#E5E7EB] rounded-[8px] mb-1"></div>
                  <p className="text-[9px] font-medium">BG PRIMARY</p>
                  <p className="text-[9px] text-[#6B7280]">#FFFFFF</p>
                </div>
                <div>
                  <div className="h-12 bg-[#F0F0F0] border border-[#E5E7EB] rounded-[8px] mb-1"></div>
                  <p className="text-[9px] font-medium">BG SECONDARY</p>
                  <p className="text-[9px] text-[#6B7280]">#F0F0F0</p>
                </div>
                <div>
                  <div className="h-12 bg-[#E5E7EB] rounded-[8px] mb-1"></div>
                  <p className="text-[9px] font-medium">BORDER</p>
                  <p className="text-[9px] text-[#6B7280]">#E5E7EB</p>
                </div>
                <div>
                  <div className="h-12 bg-[#E5E7EB] rounded-[8px] mb-1"></div>
                  <p className="text-[9px] font-medium">DIVIDER</p>
                  <p className="text-[9px] text-[#6B7280]">#E5E7EB</p>
                </div>
              </div>
            </div>
          </section>

          {/* UI ELEMENTS CARD (Cols 5-12) */}
          <section className="md:col-span-8 bg-white p-6 rounded-[12px] border border-[#E5E7EB] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] space-y-6">
            <h2 className="text-[11px] font-semibold tracking-wider text-[#6B7280] uppercase">
              UI ELEMENTS
            </h2>

            {/* Buttons Matrix */}
            <div>
              <span className="text-[12px] font-semibold text-[#0D0D0F] block mb-3">BUTTONS</span>
              <div className="overflow-x-auto">
                <table className="w-full text-center text-[13px]">
                  <thead>
                    <tr className="text-[11px] text-[#6B7280] font-medium border-b border-[#E5E7EB] pb-2">
                      <th className="text-left pb-2">Type</th>
                      <th className="pb-2">Default</th>
                      <th className="pb-2">Hover</th>
                      <th className="pb-2">Outline</th>
                      <th className="pb-2">Disabled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]/40">
                    <tr>
                      <td className="py-2.5 text-left font-medium">Primary</td>
                      <td className="py-2.5"><Button variant="primary">Button</Button></td>
                      <td className="py-2.5"><Button variant="primary" className="bg-[#0D0D0F]/90">Button</Button></td>
                      <td className="py-2.5"><Button variant="primary" outline>Button</Button></td>
                      <td className="py-2.5"><Button variant="primary" disabled>Button</Button></td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-left font-medium">Secondary</td>
                      <td className="py-2.5"><Button variant="secondary">Button</Button></td>
                      <td className="py-2.5"><Button variant="secondary" className="bg-[#E5E7EB]">Button</Button></td>
                      <td className="py-2.5"><Button variant="secondary" outline>Button</Button></td>
                      <td className="py-2.5"><Button variant="secondary" disabled>Button</Button></td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-left font-medium">Text</td>
                      <td className="py-2.5"><Button variant="text">Button</Button></td>
                      <td className="py-2.5"><Button variant="text" className="text-[#1D4ED8]">Button</Button></td>
                      <td className="py-2.5 text-[#6B7280]">—</td>
                      <td className="py-2.5 text-[#6B7280]">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Chips / Category */}
            <div>
              <span className="text-[12px] font-semibold text-[#0D0D0F] block mb-3">CHIP / CATEGORY</span>
              <div className="flex flex-wrap gap-2">
                <Chip label="World Cup" />
                <Chip label="IPL" />
                <Chip label="Business & Markets" />
                <Chip label="More" />
              </div>
            </div>

            {/* Bias Meter */}
            <div>
              <span className="text-[12px] font-semibold text-[#0D0D0F] block mb-3">BIAS METER</span>
              <BiasMeter leftPercentage={25} centerPercentage={50} rightPercentage={25} showTicks={true} />
            </div>
          </section>

          {/* ICONS CARD (Cols 1-4) */}
          <section className="md:col-span-4 bg-white p-6 rounded-[12px] border border-[#E5E7EB] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
            <h2 className="text-[11px] font-semibold tracking-wider text-[#6B7280] uppercase mb-4">
              ICONS
            </h2>
            <div className="grid grid-cols-5 gap-4 text-center py-2 text-[#0D0D0F]">
              <div className="flex justify-center"><Menu className="w-5 h-5 stroke-[2]" /></div>
              <div className="flex justify-center"><Search className="w-5 h-5 stroke-[2]" /></div>
              <div className="flex justify-center"><Bookmark className="w-5 h-5 stroke-[2]" /></div>
              <div className="flex justify-center"><Clock className="w-5 h-5 stroke-[2]" /></div>
              <div className="flex justify-center"><Info className="w-5 h-5 stroke-[2]" /></div>
              <div className="flex justify-center"><Share2 className="w-5 h-5 stroke-[2]" /></div>
              <div className="flex justify-center"><ExternalLink className="w-5 h-5 stroke-[2]" /></div>
              <div className="flex justify-center"><Calendar className="w-5 h-5 stroke-[2]" /></div>
              <div className="flex justify-center"><TrendingUp className="w-5 h-5 stroke-[2]" /></div>
              <div className="flex justify-center"><Tag className="w-5 h-5 stroke-[2]" /></div>
              <div className="flex justify-center"><User className="w-5 h-5 stroke-[2]" /></div>
              <div className="flex justify-center"><Bell className="w-5 h-5 stroke-[2]" /></div>
              <div className="flex justify-center"><SlidersHorizontal className="w-5 h-5 stroke-[2]" /></div>
              <div className="flex justify-center"><CheckCircle2 className="w-5 h-5 stroke-[2]" /></div>
              <div className="flex justify-center"><MoreHorizontal className="w-5 h-5 stroke-[2]" /></div>
            </div>
            <p className="text-[12px] text-[#6B7280] mt-6">
              Line style • 2px stroke • Rounded caps
            </p>
          </section>

          {/* CARD EXAMPLE (Cols 5-12) */}
          <section className="md:col-span-8 bg-white p-6 rounded-[12px] border border-[#E5E7EB] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
            <h2 className="text-[11px] font-semibold tracking-wider text-[#6B7280] uppercase mb-4">
              CARD EXAMPLE
            </h2>
            <ArticleCard
              category="Politics"
              location="United States"
              title="Trump Sends Iran Revised Peace Proposal With Tougher Terms: Report"
              summary="The proposal includes stricter limits on uranium enrichment and enhanced verification measures."
              leftPercentage={25}
              centerPercentage={50}
              rightPercentage={49}
              timeAgo="2h ago"
              readTime="12 min read"
            />
          </section>

          {/* SPACING SYSTEM CARD (Cols 1-4) */}
          <section className="md:col-span-4 bg-white p-6 rounded-[12px] border border-[#E5E7EB] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
            <h2 className="text-[11px] font-semibold tracking-wider text-[#6B7280] uppercase mb-1">
              SPACING SYSTEM
            </h2>
            <p className="text-[11px] text-[#6B7280] mb-6">(4px BASE UNIT)</p>

            <div className="flex items-end justify-between gap-1 h-32 pb-2">
              <div className="flex flex-col items-center gap-2">
                <div className="w-4 bg-[#C7D2FE] rounded-xs" style={{ height: "4px" }}></div>
                <span className="text-[10px] text-[#6B7280]">4px</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-5 bg-[#C7D2FE] rounded-xs" style={{ height: "8px" }}></div>
                <span className="text-[10px] text-[#6B7280]">8px</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 bg-[#C7D2FE] rounded-xs" style={{ height: "16px" }}></div>
                <span className="text-[10px] text-[#6B7280]">16px</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-7 bg-[#C7D2FE] rounded-xs" style={{ height: "24px" }}></div>
                <span className="text-[10px] text-[#6B7280]">24px</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 bg-[#C7D2FE] rounded-xs" style={{ height: "32px" }}></div>
                <span className="text-[10px] text-[#6B7280]">32px</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-9 bg-[#C7D2FE] rounded-xs" style={{ height: "40px" }}></div>
                <span className="text-[10px] text-[#6B7280]">40px</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 bg-[#C7D2FE] rounded-xs" style={{ height: "64px" }}></div>
                <span className="text-[10px] text-[#6B7280]">64px</span>
              </div>
            </div>
            <p className="text-[12px] text-[#6B7280] mt-4">
              Consistent spacing scale based on 4px base unit
            </p>
          </section>

          {/* GRID SYSTEM CARD (Cols 5-8) */}
          <section className="md:col-span-4 bg-white p-6 rounded-[12px] border border-[#E5E7EB] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
            <h2 className="text-[11px] font-semibold tracking-wider text-[#6B7280] uppercase mb-4">
              GRID SYSTEM
            </h2>
            <div className="bg-[#EEF2FF] p-3 rounded-[8px] flex gap-1 h-36 relative overflow-hidden">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex-1 bg-[#C7D2FE]/60 rounded-xs h-full"></div>
              ))}
              <div className="absolute right-3 top-3 text-right text-[10px] text-[#6B7280] space-y-1 bg-white/80 p-1.5 rounded backdrop-blur-xs">
                <p><span className="font-semibold">Container</span> 1280px</p>
                <p><span className="font-semibold">Columns</span> 12</p>
                <p><span className="font-semibold">Gutter</span> 24px</p>
                <p><span className="font-semibold">Margin</span> 24px</p>
              </div>
            </div>
          </section>

          {/* SHADOWS & BORDER RADIUS (Cols 9-12) */}
          <section className="md:col-span-4 bg-white p-6 rounded-[12px] border border-[#E5E7EB] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] space-y-6">
            <div>
              <h2 className="text-[11px] font-semibold tracking-wider text-[#6B7280] uppercase mb-3">
                SHADOWS
              </h2>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-white rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] border border-[#E5E7EB]">
                  <p className="text-[10px] font-semibold">SMALL</p>
                  <p className="text-[9px] text-[#6B7280]">0 1px 2px</p>
                </div>
                <div className="p-3 bg-white rounded-[8px] shadow-[0px_4px_12px_rgba(0,0,0,0.08)] border border-[#E5E7EB]">
                  <p className="text-[10px] font-semibold">MEDIUM</p>
                  <p className="text-[9px] text-[#6B7280]">0 4px 12px</p>
                </div>
                <div className="p-3 bg-white rounded-[8px] shadow-[0px_12px_24px_rgba(0,0,0,0.12)] border border-[#E5E7EB]">
                  <p className="text-[10px] font-semibold">LARGE</p>
                  <p className="text-[9px] text-[#6B7280]">0 12px 24px</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-[11px] font-semibold tracking-wider text-[#6B7280] uppercase mb-3">
                BORDER RADIUS
              </h2>
              <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                <div>
                  <div className="w-full h-10 bg-[#F6F6F6] border border-[#D1D5DB] rounded-[4px] mb-1"></div>
                  <p className="font-semibold">SMALL</p>
                  <p className="text-[#6B7280]">4px</p>
                </div>
                <div>
                  <div className="w-full h-10 bg-[#F6F6F6] border border-[#D1D5DB] rounded-[8px] mb-1"></div>
                  <p className="font-semibold">MEDIUM</p>
                  <p className="text-[#6B7280]">8px</p>
                </div>
                <div>
                  <div className="w-full h-10 bg-[#F6F6F6] border border-[#D1D5DB] rounded-[12px] mb-1"></div>
                  <p className="font-semibold">LARGE</p>
                  <p className="text-[#6B7280]">12px</p>
                </div>
                <div>
                  <div className="w-full h-10 bg-[#F6F6F6] border border-[#D1D5DB] rounded-full mb-1"></div>
                  <p className="font-semibold">FULL</p>
                  <p className="text-[#6B7280]">9999px</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Footer Spec Banner */}
      <footer className="mt-12 bg-[#0D0D0F] text-white py-6 px-8">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between text-[13px] gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[20px] font-bold tracking-tight">biasly</span>
            <span className="text-[14px] text-zinc-400 font-semibold">News</span>
            <span className="text-zinc-500 hidden md:inline">|</span>
            <span className="text-zinc-400 text-[12px]">Balanced news coverage, powered by AI.</span>
          </div>

          <div className="flex items-center gap-6 text-[12px] text-zinc-400">
            <span>Design System v1.0</span>
            <span>June 1, 2026</span>
          </div>

          <div className="text-[13px] font-medium text-white">
            Stay consistent. Stay unbiased.
          </div>
        </div>
      </footer>
    </div>
  );
}