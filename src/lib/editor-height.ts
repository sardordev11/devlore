// Sizing for the Monaco code editor, which grows with its content.

export const EDITOR_MAX_HEIGHT = 400;
export const EDITOR_MIN_HEIGHT = 80;
// Monaco line height relative to the font size (19px at the default 13px).
const LINE_HEIGHT_RATIO = 1.45;
// Top and bottom padding inside the editor (12px each).
const VERTICAL_PADDING = 24;

export function getLineHeight(fontSize: number) {
  return Math.round(fontSize * LINE_HEIGHT_RATIO);
}

export function clampEditorHeight(height: number) {
  return Math.min(Math.max(height, EDITOR_MIN_HEIGHT), EDITOR_MAX_HEIGHT);
}

// Rough first-paint height until Monaco reports the real content height.
export function estimateEditorHeight(value: string, lineHeight: number) {
  return clampEditorHeight(value.split("\n").length * lineHeight + VERTICAL_PADDING);
}
