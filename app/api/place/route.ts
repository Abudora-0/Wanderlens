import { NextResponse } from "next/server";
import { getPlaceNode } from "@/lib/sources/wikivoyage-hierarchy";
import type { NodeKind } from "@/lib/types";

export const revalidate = 86400;

const KINDS: NodeKind[] = ["continent", "country", "region", "city", "area"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title")?.trim();
  const kindParam = searchParams.get("kind") as NodeKind | null;
  const kind = kindParam && KINDS.includes(kindParam) ? kindParam : undefined;

  if (!title) {
    return NextResponse.json({ error: "title is required." }, { status: 400 });
  }

  try {
    const node = await getPlaceNode(title, kind);
    if (!node) {
      return NextResponse.json(
        { error: `No travel guide found for ${title}.` },
        { status: 404 },
      );
    }
    return NextResponse.json(node, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("place route failed", error);
    return NextResponse.json(
      { error: "Could not reach the travel guides right now." },
      { status: 502 },
    );
  }
}
