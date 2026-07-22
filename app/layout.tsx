import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "biasly News - Balanced news coverage, powered by AI",
  description: "biasly collects real news articles, analyzes them with AI, and displays sentiment and framing insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F0F0F0] text-[#0D0D0F] font-sans">
        {children}
      </body>
    </html>
  );
}
