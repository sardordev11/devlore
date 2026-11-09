"use client";

import { useEffect } from "react";

// The homepage sections stream in after a Suspense boundary, so neither the
// browser nor Next.js finds "/#features" on arrival (e.g. from the auth nav).
// Rendered with the sections, this scrolls to the hash once they exist.
export function ScrollToHash() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ behavior: "instant" });
  }, []);

  return null;
}
