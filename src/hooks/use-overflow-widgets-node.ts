"use client";

import { useEffect, useState } from "react";

// Monaco's popups (autocomplete, hovers, parameter hints) use fixed positioning
// computed against the viewport. Inside the dialog or drawer, which are
// positioned with CSS transforms, fixed elements are placed relative to the
// transformed ancestor instead, so the popups land in the wrong spot and get
// clipped. Rendering them in a node on <body> keeps them under the cursor.
// Base UI treats a node added after the dialog opened as third-party, so
// clicking a suggestion doesn't close the dialog.
export function useOverflowWidgetsNode() {
  const [node] = useState(() => {
    if (typeof document === "undefined") return null;
    const element = document.createElement("div");
    // "monaco-editor" picks up the theme's CSS variables for the popups.
    element.className = "monaco-editor";
    // Set directly: Monaco's own .monaco-editor rule would beat a utility class.
    element.style.position = "fixed";
    element.style.top = "0";
    element.style.left = "0";
    element.style.zIndex = "60"; // Above the dialog and drawer (z-50).
    return element;
  });

  useEffect(() => {
    if (!node) return;
    document.body.appendChild(node);
    return () => node.remove();
  }, [node]);

  return node;
}
