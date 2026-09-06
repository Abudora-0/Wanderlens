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
            "radial-gradient(1100px circle at 22% 0%, #0f3b52, #05070f 62%)",
          color: "#eef0f8",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="66" height="66" viewBox="0 0 64 64">
            <defs>
              <radialGradient id="og-ocean" cx="37%" cy="33%" r="75%">
                <stop offset="0%" stopColor="#57a8ff" />
                <stop offset="55%" stopColor="#2f7ff5" />
                <stop offset="100%" stopColor="#173f95" />
              </radialGradient>
              <clipPath id="og-sphere">
                <circle cx="32" cy="32" r="25" />
              </clipPath>
            </defs>
            <circle cx="32" cy="32" r="25" fill="url(#og-ocean)" />
            <g clipPath="url(#og-sphere)">
              <path d="M8 20c4-3 9-2 11 1s-1 7-5 8-9 0-10-4 1-3 4-5z" fill="#34c26e" />
              <path d="M28 34c3-4 10-5 14-1s3 10-2 12-13 1-15-4 1-4 3-7z" fill="#2ba05f" />
              <path d="M40 14c2-2 6-1 7 2s-2 5-5 5-5-2-5-4 1-2 3-3z" fill="#2ba05f" />
            </g>
            <circle cx="32" cy="32" r="25" fill="none" stroke="#34ddbb" strokeOpacity="0.55" strokeWidth="1.6" />
            <circle cx="23" cy="21" r="3.2" fill="#f5c451" fillOpacity="0.9" />
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
