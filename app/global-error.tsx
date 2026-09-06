"use client";

import { useEffect, useState } from "react";

/**
 * Root-level error boundary. Next shows its own "this page couldn't load" here
 * for anything that escapes `app/error.tsx` or the root layout.
 *
 * react-globe.gl throws "dispose is not a function" from globe.gl's `_destructor`
 * while React unmounts the globe on the way out of /explore. That throw escapes
 * to this boundary even though the navigation itself already succeeded, so for
 * that one signature we retry once automatically and the destination renders.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const benign =
    typeof error?.message === "string" &&
    error.message.includes("dispose is not a function");
  const [recovering, setRecovering] = useState(benign);

  useEffect(() => {
    if (!benign) return;
    const id = setTimeout(() => {
      setRecovering(false);
      reset();
    }, 60);
    return () => clearTimeout(id);
  }, [benign, reset]);

  if (recovering) {
    return (
      <html lang="en">
        <body style={{ margin: 0, background: "#05070f" }} />
      </html>
    );
  }

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#05070f",
          color: "#e8ecf6",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>
            Something slipped
          </h1>
          <p
            style={{
              marginTop: "0.75rem",
              fontSize: "0.9rem",
              lineHeight: 1.6,
              color: "#aeb6c8",
            }}
          >
            That page did not finish loading. Try again, or head back to the
            globe.
          </p>
          <div
            style={{
              marginTop: "1.75rem",
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                borderRadius: "999px",
                border: "none",
                padding: "0.65rem 1.25rem",
                fontSize: "0.85rem",
                fontWeight: 500,
                background: "#e8ecf6",
                color: "#05070f",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                borderRadius: "999px",
                border: "1px solid rgba(174,182,200,0.3)",
                padding: "0.65rem 1.25rem",
                fontSize: "0.85rem",
                color: "#aeb6c8",
                textDecoration: "none",
              }}
            >
              Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
