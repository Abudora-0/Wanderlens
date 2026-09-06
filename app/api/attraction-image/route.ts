import { NextResponse } from "next/server";
import { getWikipediaImageBySearch } from "@/lib/sources/wikipedia";

export const revalidate = 604800;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ image: null, url: null });
  }

  try {
    const found = await getWikipediaImageBySearch(query);
    return NextResponse.json(found, {
      headers: {
        "Cache-Control":
          "public, s-maxage=604800, stale-while-revalidate=2592000",
      },
    });
  } catch {
    return NextResponse.json({ image: null, url: null });
  }
}
