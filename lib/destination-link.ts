import { slugify } from "@/lib/format";
import type { NodeKind } from "@/lib/types";

export interface DestinationTarget {
  name: string;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  countryCode?: string | null;
  kind?: NodeKind | "landmark";
}

/** Build the shareable /destination/<slug> href for a place. */
export function destinationHref(target: DestinationTarget): string {
  const slug =
    slugify(target.name) +
    (target.country ? `-${slugify(target.country)}` : "");
  const params = new URLSearchParams({ name: target.name });
  if (target.country) params.set("country", target.country);
  if (typeof target.latitude === "number") {
    params.set("lat", target.latitude.toFixed(4));
  }
  if (typeof target.longitude === "number") {
    params.set("lon", target.longitude.toFixed(4));
  }
  if (target.countryCode) params.set("cc", target.countryCode);
  if (target.kind) params.set("kind", target.kind);
  return `/destination/${slug || "place"}?${params.toString()}`;
}
