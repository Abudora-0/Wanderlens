import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Wanderlens - focus the globe, find where to go";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "radial-gradient(1000px circle at 20% 0%, #16224a, #05070f 60%)",
          color: "#eef0f8",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 64 64">
            <defs>
              <linearGradient id="og-star" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38e1c4" />
                <stop offset="52%" stopColor="#7c6cf5" />
                <stop offset="100%" stopColor="#f2668b" />
              </linearGradient>
            </defs>
            <path
              d="M 32.00 4.00 L 34.30 26.46 L 41.55 22.45 L 37.54 29.70 L 60.00 32.00 L 37.54 34.30 L 41.55 41.55 L 34.30 37.54 L 32.00 60.00 L 29.70 37.54 L 22.45 41.55 L 26.46 34.30 L 4.00 32.00 L 26.46 29.70 L 22.45 22.45 L 29.70 26.46 Z"
              fill="url(#og-star)"
            />
            <circle cx="32" cy="32" r="5" fill="#f5c451" />
          </svg>
          <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: -1 }}>
            Wanderlens
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, maxWidth: 900 }}>
            Focus the globe. Find where to go.
          </div>
          <div style={{ fontSize: 30, color: "#b7bfd8", maxWidth: 820 }}>
            The best places to visit anywhere on Earth, with live weather and
            country context. Built on open travel data.
          </div>
        </div>

        <div style={{ fontSize: 22, color: "#7c86a6" }}>
          wanderlenss.vercel.app
        </div>
      </div>
    ),
    size,
  );
}
