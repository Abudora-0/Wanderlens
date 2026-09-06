import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Sora } from "next/font/google";
import "./globals.css";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { GlobeTeardownGuard } from "@/components/globe/GlobeTeardownGuard";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = "https://wanderlenss.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Wanderlens - focus the globe, find where to go",
    template: "%s | Wanderlens",
  },
  description:
    "Spin an interactive globe, drop into any country, city or area on Earth, and get the best places to visit there with live weather and country context. Built on open travel data.",
  keywords: [
    "travel",
    "tourism",
    "places to visit",
    "interactive globe",
    "trip planning",
    "destination guide",
  ],
  authors: [{ name: "Abudora-0" }],
  openGraph: {
    title: "Wanderlens",
    description:
      "Focus the globe, find where to go. The best places to visit anywhere on Earth.",
    url: siteUrl,
    siteName: "Wanderlens",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wanderlens",
    description: "Focus the globe, find where to go.",
  },
};

export const viewport: Viewport = {
  themeColor: "#05070f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${sora.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="grain flex min-h-full flex-col">
        <GlobeTeardownGuard />
        <ScrollProgress />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
