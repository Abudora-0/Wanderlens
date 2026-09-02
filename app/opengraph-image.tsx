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
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background:
                "linear-gradient(135deg, #38e1c4, #7c6cf5 55%, #f2668b)",
            }}
          />
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
          github.com/Abudora-0/wanderlens
        </div>
      </div>
    ),
    size,
  );
}
