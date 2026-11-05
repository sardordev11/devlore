"use client";

import { useEffect, useState } from "react";

import { getCollectionOptions } from "@/actions/collections";
import type { CollectionOption } from "@/lib/db/collections";

type CollectionOptionsState =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ready"; collections: CollectionOption[] };

// Loads the signed-in user's collections once, when the form using it mounts.
export function useCollectionOptions(): CollectionOptionsState {
  const [state, setState] = useState<CollectionOptionsState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    getCollectionOptions()
      .then((result) => {
        if (!active) return;
        setState(
          result.success
            ? { status: "ready", collections: result.data }
            : { status: "error", error: result.error },
        );
      })
      .catch(() => {
        if (active) setState({ status: "error", error: "Couldn't load your collections" });
      });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
