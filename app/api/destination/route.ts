import { NextResponse } from "next/server";
import { buildDossier } from "@/lib/destination";
import type { PlaceKind } from "@/lib/types";

export const revalidate = 3600;

const VALID_KINDS: PlaceKind[] = [
  "country",
  "region",
  "city",
  "area",
  "landmark",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name")?.trim();
  const lat = Number.parseFloat(searchParams.get("lat") ?? "");
  const lon = Number.parseFloat(searchParams.get("lon") ?? "");
  const kindParam = searchParams.get("kind") as PlaceKind | null;
  const kind: PlaceKind =
    kindParam && VALID_KINDS.includes(kindParam) ? kindParam : "city";

  if (!name || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json(
      { error: "name, lat and lon are required." },
      { status: 400 },
    );
  }

  try {
    const dossier = await buildDossier({
      name,
      displayName: searchParams.get("display")?.trim() || name,
      latitude: lat,
      longitude: lon,
      kind,
      countryCode: searchParams.get("cc")?.trim() || null,
      country: searchParams.get("country")?.trim() || null,
    });

    return NextResponse.json(dossier, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("destination route failed", error);
    return NextResponse.json(
      { error: "Could not assemble this destination right now." },
      { status: 502 },
    );
  }
}
