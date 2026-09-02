"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { DestinationDossier, GeoCandidate } from "@/lib/types";

type Status = "idle" | "loading" | "ready" | "error";

interface ExperienceState {
  selected: GeoCandidate | null;
  dossier: DestinationDossier | null;
  status: Status;
  error: string | null;
  select: (candidate: GeoCandidate) => void;
  clear: () => void;
}

const ExperienceContext = createContext<ExperienceState | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<GeoCandidate | null>(null);
  const [dossier, setDossier] = useState<DestinationDossier | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const select = useCallback((candidate: GeoCandidate) => {
    const id = ++requestId.current;
    setSelected(candidate);
    setStatus("loading");
    setError(null);
    setDossier(null);

    const params = new URLSearchParams({
      name: candidate.name,
      display: candidate.displayName,
      lat: String(candidate.latitude),
      lon: String(candidate.longitude),
      kind: candidate.kind,
    });
    if (candidate.countryCode) params.set("cc", candidate.countryCode);
    if (candidate.country) params.set("country", candidate.country);

    fetch(`/api/destination?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Destination lookup failed");
        return (await res.json()) as DestinationDossier;
      })
      .then((data) => {
        if (id !== requestId.current) return;
        setDossier(data);
        setStatus("ready");
      })
      .catch(() => {
        if (id !== requestId.current) return;
        setStatus("error");
        setError("We could not reach the travel archives. Try again in a moment.");
      });

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("to", candidate.name);
      url.searchParams.set("place", candidate.displayName);
      url.searchParams.set("lat", candidate.latitude.toFixed(3));
      url.searchParams.set("lon", candidate.longitude.toFixed(3));
      url.searchParams.set("kind", candidate.kind);
      if (candidate.countryCode) url.searchParams.set("cc", candidate.countryCode);
      window.history.replaceState({}, "", url);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const name = params.get("to");
    const lat = Number.parseFloat(params.get("lat") ?? "");
    const lon = Number.parseFloat(params.get("lon") ?? "");
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lon)) return;
    const handle = setTimeout(() => {
      select({
        id: `link-${name}`,
        name,
        displayName: params.get("place") ?? name,
        country: "",
        countryCode: params.get("cc"),
        admin1: null,
        latitude: lat,
        longitude: lon,
        population: null,
        kind: (params.get("kind") as GeoCandidate["kind"]) ?? "city",
        timezone: null,
      });
    }, 0);
    return () => clearTimeout(handle);
    // Run once on mount to restore a shared link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clear = useCallback(() => {
    requestId.current += 1;
    setSelected(null);
    setDossier(null);
    setStatus("idle");
    setError(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.search = "";
      window.history.replaceState({}, "", url);
    }
  }, []);

  const value = useMemo(
    () => ({ selected, dossier, status, error, select, clear }),
    [selected, dossier, status, error, select, clear],
  );

  return (
    <ExperienceContext.Provider value={value}>
      {children}
    </ExperienceContext.Provider>
  );
}

export function useExperience(): ExperienceState {
  const context = useContext(ExperienceContext);
  if (!context) {
    throw new Error("useExperience must be used within ExperienceProvider");
  }
  return context;
}
