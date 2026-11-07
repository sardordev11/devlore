import { useSyncExternalStore } from "react";

const REFRESH_MS = 60_000;

let now = Date.now();

// One shared clock that ticks every minute, so relative dates stay current.
function subscribe(onChange: () => void) {
  now = Date.now();
  const id = setInterval(() => {
    now = Date.now();
    onChange();
  }, REFRESH_MS);
  return () => clearInterval(id);
}

function getSnapshot() {
  return now;
}

// The server doesn't know the viewer's clock or time zone.
function getServerSnapshot() {
  return null;
}

// The current time on the client, or null during server rendering and hydration.
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
