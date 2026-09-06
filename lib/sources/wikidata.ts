import { timedFetch } from "@/lib/sources/http";

interface EntityData {
  entities?: Record<
    string,
    {
      claims?: {
        P625?: {
          mainsnak?: {
            datavalue?: {
              value?: { latitude?: number; longitude?: number };
            };
          };
        }[];
      };
    }
  >;
}

/** Resolve a Wikidata Q-id to [lat, lon] via property P625 (coordinate location). */
export async function coordsForWikidata(
  qid: string,
): Promise<{ latitude: number; longitude: number } | null> {
  if (!/^Q\d+$/.test(qid)) return null;
  try {
    const res = await timedFetch(
      `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`,
      { next: { revalidate: 604800 } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as EntityData;
    const value =
      data.entities?.[qid]?.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
    if (
      typeof value?.latitude === "number" &&
      typeof value?.longitude === "number"
    ) {
      return { latitude: value.latitude, longitude: value.longitude };
    }
    return null;
  } catch {
    return null;
  }
}
