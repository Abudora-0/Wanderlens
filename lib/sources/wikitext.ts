import { timedFetch } from "@/lib/sources/http";

const UA =
  "Wanderlens/1.0 (https://github.com/Abudora-0/Wanderlens; open-source travel discovery)";

export function stripTemplates(input: string): string {
  let text = input;
  for (let pass = 0; pass < 4; pass += 1) {
    const next = text.replace(/\{\{([^{}]*)\}\}/g, (_match, body: string) => {
      const parts = String(body).split("|");
      const head = parts[0].trim().toLowerCase();
      if (head === "lang" || head === "nihongo" || head === "transl") {
        return parts[parts.length - 1] ?? "";
      }
      if (["convert", "nowrap", "small", "'"].includes(head)) {
        return parts[1] ?? "";
      }
      return "";
    });
    if (next === text) break;
    text = next;
  }
  return text;
}

export function stripWikiMarkup(input: string): string {
  return stripTemplates(input)
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/<ref[^>]*\/>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, "$1")
    .replace(/\[https?:\/\/\S+\s+([^\]]+)\]/g, "$1")
    .replace(/'''?/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Parse a `{{...}}` template starting at `start`; returns its `|`-split parts. */
export function parseTemplateAt(
  source: string,
  start: number,
): { fields: string[]; end: number } | null {
  let depth = 0;
  let i = start;
  const parts: string[] = [];
  let current = "";
  for (; i < source.length; i += 1) {
    const two = source.slice(i, i + 2);
    if (two === "{{" || two === "[[") {
      depth += 1;
      current += two;
      i += 1;
      continue;
    }
    if (two === "}}" || two === "]]") {
      depth -= 1;
      if (depth === 0 && two === "}}") {
        parts.push(current);
        return { fields: parts, end: i + 2 };
      }
      current += two;
      i += 1;
      continue;
    }
    if (source[i] === "|" && depth === 1) {
      parts.push(current);
      current = "";
      continue;
    }
    current += source[i];
  }
  return null;
}

export function toFields(rawParts: string[]): Record<string, string> {
  const fields: Record<string, string> = {};
  rawParts.slice(1).forEach((part) => {
    const eq = part.indexOf("=");
    if (eq === -1) return;
    const key = part.slice(0, eq).trim().toLowerCase();
    const value = part.slice(eq + 1).trim();
    if (key) fields[key] = value;
  });
  return fields;
}

/** First `[[wiki link]]` target inside a string, without the display text. */
export function firstLinkTarget(input: string): string | null {
  const match = input.match(/\[\[([^\]|#]+)/);
  return match ? match[1].trim() : null;
}

export interface WikiMarker {
  name: string;
  target: string | null;
  latitude: number | null;
  longitude: number | null;
  wikidata: string | null;
  blurb: string;
}

/**
 * Pull `{{marker ...}}` / `{{see ...}}` style entries out of a chunk of
 * wikitext, together with the trailing " - description" text that follows each.
 */
export function extractMarkers(wikitext: string, tokens = ["{{marker", "{{city", "{{see", "{{do", "{{listing"]): WikiMarker[] {
  const lower = wikitext.toLowerCase();
  const out: WikiMarker[] = [];
  const seen = new Set<string>();
  let cursor = 0;

  while (cursor < wikitext.length) {
    let at = -1;
    for (const token of tokens) {
      const found = lower.indexOf(token, cursor);
      if (found !== -1 && (at === -1 || found < at)) at = found;
    }
    if (at === -1) break;
    const parsed = parseTemplateAt(wikitext, at);
    if (!parsed) {
      cursor = at + 2;
      continue;
    }
    const fields = toFields(parsed.fields);
    const rawName = fields.name ?? "";
    const name = stripWikiMarkup(rawName);
    cursor = parsed.end;
    if (!name || name.length < 2) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    // trailing "  description" or " - description" up to the line end
    const after = wikitext.slice(parsed.end, parsed.end + 320);
    const dash = after.match(/^\s*(?:[-:–—]\s*)?([^\n*]+)/);
    const blurb = dash ? stripWikiMarkup(dash[1]) : "";

    const lat = Number.parseFloat(fields.lat ?? "");
    const lon = Number.parseFloat(fields.long ?? fields.lon ?? "");

    out.push({
      name,
      target: firstLinkTarget(rawName),
      latitude: Number.isFinite(lat) ? lat : null,
      longitude: Number.isFinite(lon) ? lon : null,
      wikidata: fields.wikidata?.match(/Q\d+/)?.[0] ?? null,
      blurb,
    });
  }
  return out;
}

interface ParseWikitextResponse {
  parse?: { title?: string; wikitext?: string };
}

/**
 * Split article wikitext into its level-2 sections. Returns the intro (before
 * any `==`) plus a map from lowercased heading to its body.
 */
export function splitSections(wikitext: string): {
  intro: string;
  sections: Record<string, string>;
} {
  const parts = wikitext.split(/\n==[ \t]*([^=\n]+?)[ \t]*==[ \t]*\n/);
  const intro = parts[0] ?? "";
  const sections: Record<string, string> = {};
  for (let i = 1; i < parts.length; i += 2) {
    const heading = parts[i].trim().toLowerCase();
    const body = parts[i + 1] ?? "";
    if (!(heading in sections)) sections[heading] = body;
  }
  return { intro, sections };
}

export async function fetchWikivoyageWikitext(
  title: string,
): Promise<{ title: string; wikitext: string } | null> {
  const url = new URL("https://en.wikivoyage.org/w/api.php");
  url.searchParams.set("action", "parse");
  url.searchParams.set("page", title);
  url.searchParams.set("prop", "wikitext");
  url.searchParams.set("redirects", "1");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");

  const res = await timedFetch(
    url,
    { next: { revalidate: 86400 }, headers: { "User-Agent": UA } },
    6000,
  );
  if (!res.ok) return null;
  const data = (await res.json()) as ParseWikitextResponse;
  if (typeof data.parse?.wikitext !== "string") return null;
  return { title: data.parse.title ?? title, wikitext: data.parse.wikitext };
}

export async function fetchWikivoyageSummary(
  title: string,
): Promise<string | null> {
  try {
    const res = await timedFetch(
      `https://en.wikivoyage.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { next: { revalidate: 86400 }, headers: { "User-Agent": UA } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { extract?: string };
    const extract = data.extract?.trim();
    if (!extract) return null;
    if (extract.length <= 460) return extract;
    const clipped = extract.slice(0, 460);
    const stop = Math.max(clipped.lastIndexOf(". "), clipped.lastIndexOf("! "));
    if (stop > 240) return clipped.slice(0, stop + 1);
    return `${clipped.slice(0, clipped.lastIndexOf(" ")).trim()}...`;
  } catch {
    return null;
  }
}
