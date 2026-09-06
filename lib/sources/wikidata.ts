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

export interface WikidataSight {
  qid: string;
  title: string;
  latitude: number;
  longitude: number;
  sitelinks: number;
}

interface SparqlResponse {
  results?: {
    bindings?: {
      place?: { value?: string };
      enTitle?: { value?: string };
      sitelinks?: { value?: string };
      lat?: { value?: string };
      lon?: { value?: string };
    }[];
  };
}

// Wikidata classes whose members are places a visitor actually goes to. The
// P279* walk in the query means "or any subclass", so `place of worship`
// catches every temple / shrine / church variant, etc.
const SIGHT_CLASSES = [
  "wd:Q839954", // archaeological site
  "wd:Q570116", // tourist attraction
  "wd:Q33506", // museum
  "wd:Q207694", // art museum
  "wd:Q1370598", // place of worship
  "wd:Q24398318", // religious building
  "wd:Q2977", // cathedral
  "wd:Q16970", // church building
  "wd:Q32815", // mosque
  "wd:Q34627", // synagogue
  "wd:Q44613", // monastery
  "wd:Q317557", // Buddhist temple
  "wd:Q23413", // castle
  "wd:Q751876", // château
  "wd:Q16560", // palace
  "wd:Q22698", // park
  "wd:Q1107656", // garden
  "wd:Q4989906", // monument
  "wd:Q1081138", // historic site
  "wd:Q2065736", // cultural property
  "wd:Q2319498", // landmark
  "wd:Q1043639", // rock-cut architecture
  "wd:Q57821", // fortification
  "wd:Q133056", // fountain
  "wd:Q12518", // tower
  "wd:Q39614", // cemetery
].join(", ");

const NOT_A_SIGHT =
  /^(constantinople|byzantium|new rome|edo|old |ancient )|\b(former capital|historical region|metropolitan municipality|ancient city|were the|was the capital|is a district of|neighbourhood of|neighborhood of)\b/i;

/**
 * The notable sights around a point, ranked by how many Wikipedia language
 * editions cover them (a solid fame proxy). This is what surfaces the famous
 * temple 5 km out that a distance-sorted geosearch would never reach.
 */
export async function getWikidataSights(
  latitude: number,
  longitude: number,
  radiusKm = 10,
): Promise<WikidataSight[]> {
  const query = `SELECT ?place ?enTitle (MAX(?s) AS ?sitelinks) (SAMPLE(?lat) AS ?lat) (SAMPLE(?lon) AS ?lon) WHERE {
  SERVICE wikibase:around {
    ?place wdt:P625 ?coord .
    bd:serviceParam wikibase:center "Point(${longitude} ${latitude})"^^geo:wktLiteral .
    bd:serviceParam wikibase:radius "${radiusKm}" .
  }
  ?place wikibase:sitelinks ?s . FILTER(?s >= 12)
  ?place p:P625/psv:P625 ?node .
  ?node wikibase:geoLatitude ?lat ; wikibase:geoLongitude ?lon .
  ?place (wdt:P31|wdt:P31/wdt:P279|wdt:P31/wdt:P279/wdt:P279) ?class .
  FILTER(?class IN (${SIGHT_CLASSES}))
  ?article schema:about ?place ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?enTitle .
}
GROUP BY ?place ?enTitle
ORDER BY DESC(?sitelinks)
LIMIT 28`;

  try {
    const url = new URL("https://query.wikidata.org/sparql");
    url.searchParams.set("query", query);
    url.searchParams.set("format", "json");
    const res = await timedFetch(
      url,
      {
        next: { revalidate: 604800 },
        headers: {
          Accept: "application/sparql-results+json",
          "User-Agent":
            "Wanderlens/1.0 (https://github.com/Abudora-0/Wanderlens; open-source travel discovery)",
        },
      },
      9000,
    );
    if (!res.ok) return [];
    const data = (await res.json()) as SparqlResponse;
    const rows = data.results?.bindings ?? [];
    const out: WikidataSight[] = [];
    for (const row of rows) {
      const qid = row.place?.value?.split("/").pop() ?? "";
      const title = row.enTitle?.value ?? "";
      const lat = Number(row.lat?.value);
      const lon = Number(row.lon?.value);
      const sitelinks = Number(row.sitelinks?.value);
      if (!qid || !title || !Number.isFinite(lat) || !Number.isFinite(lon)) {
        continue;
      }
      if (NOT_A_SIGHT.test(title)) continue;
      out.push({ qid, title, latitude: lat, longitude: lon, sitelinks });
    }
    return out;
  } catch {
    return [];
  }
}
