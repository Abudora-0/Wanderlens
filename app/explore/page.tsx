import type { Metadata } from "next";
import { Suspense } from "react";
import { ExploreView } from "@/components/explore/ExploreView";
import { GlobeSpinner } from "@/components/ui/GlobeSpinner";

export const metadata: Metadata = {
  title: "Explore the globe",
  description:
    "Spin the globe, pick a continent, then drill down through countries and regions to the cities worth visiting.",
};

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-[70vh] place-items-center">
          <GlobeSpinner label="Loading" />
        </div>
      }
    >
      <ExploreView />
    </Suspense>
  );
}
