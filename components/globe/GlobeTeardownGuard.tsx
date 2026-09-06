"use client";

import { useEffect } from "react";

/**
 * react-globe.gl (through globe.gl's `_destructor`) throws
 * "dispose is not a function" while React unmounts the globe on the way out of
 * /explore. There is no upstream fix on the current release line, and the throw
 * escapes as an uncaught error, which the App Router turns into a hard
 * "this page couldn't load" and blocks the navigation that triggered it.
 *
 * This lives in the root layout so it outlives the /explore route, and it only
 * swallows that one signature. Nothing else in the app disposes three.js
 * objects, so the match cannot mask an unrelated bug.
 */
export function GlobeTeardownGuard() {
  useEffect(() => {
    const isGlobeTeardown = (message: unknown) =>
      typeof message === "string" &&
      message.includes("dispose is not a function");

    const onError = (event: ErrorEvent) => {
      if (isGlobeTeardown(event.message)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason instanceof Error ? reason.message : String(reason ?? "");
      if (isGlobeTeardown(message)) event.preventDefault();
    };

    window.addEventListener("error", onError, true);
    window.addEventListener("unhandledrejection", onRejection, true);
    return () => {
      window.removeEventListener("error", onError, true);
      window.removeEventListener("unhandledrejection", onRejection, true);
    };
  }, []);

  return null;
}
