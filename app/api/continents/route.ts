import { NextResponse } from "next/server";
import { continents } from "@/lib/continents";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({ continents });
}
