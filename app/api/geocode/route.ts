import { NextResponse } from "next/server";
import { geocode } from "@/lib/sources/geocode";

export const revalidate = 86400;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  if (query.trim().length < 2) {
    return NextResponse.json({ candidates: [] });
  }

  try {
    const candidates = await geocode(query);
    return NextResponse.json(
      { candidates },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch (error) {
    console.error("geocode route failed", error);
    return NextResponse.json(
      { candidates: [], error: "Geocoding is unavailable right now." },
      { status: 502 },
    );
  }
}
