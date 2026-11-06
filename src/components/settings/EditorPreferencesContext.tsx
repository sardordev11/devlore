"use client";

import {
  createContext,
  use,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { updateEditorPreferences } from "@/actions/settings";
import type { EditorPreferences } from "@/lib/editor-preferences";

interface EditorPreferencesContextValue {
  preferencesPromise: Promise<EditorPreferences>;
  // Latest saved or optimistic value; null until the user changes something.
  current: EditorPreferences | null;
  save: (next: EditorPreferences, previous: EditorPreferences) => void;
}

interface EditorPreferencesProviderProps {
  // Started on the server and streamed in, so the shell doesn't wait for it.
  preferencesPromise: Promise<EditorPreferences>;
  children: React.ReactNode;
}

const EditorPreferencesContext =
  createContext<EditorPreferencesContextValue | null>(null);

export function EditorPreferencesProvider({
  preferencesPromise,
  children,
}: EditorPreferencesProviderProps) {
  const [current, setCurrent] = useState<EditorPreferences | null>(null);
  const latestRequest = useRef(0);

  // Optimistic: apply right away, roll back if the latest save fails.
  const save = useCallback(
    async (next: EditorPreferences, previous: EditorPreferences) => {
      const request = ++latestRequest.current;
      setCurrent(next);

      const result = await updateEditorPreferences(next).catch(() => null);
      if (result?.success) {
        toast.success("Editor preferences saved");
        return;
      }
      toast.error(result?.error ?? "Couldn't save your editor preferences");
      if (request === latestRequest.current) setCurrent(previous);
    },
    [],
  );

  const value = useMemo(
    () => ({ preferencesPromise, current, save }),
    [preferencesPromise, current, save],
  );

  return (
    <EditorPreferencesContext value={value}>{children}</EditorPreferencesContext>
  );
}

// Suspends until the stored preferences arrive, unless the user already changed them.
export function useEditorPreferences() {
  const context = useContext(EditorPreferencesContext);
  if (!context) {
    throw new Error(
      "useEditorPreferences must be used within EditorPreferencesProvider",
    );
  }

  const { preferencesPromise, current, save } = context;
  const preferences = current ?? use(preferencesPromise);

  const setPreference = useCallback(
    <K extends keyof EditorPreferences>(key: K, value: EditorPreferences[K]) => {
      if (preferences[key] === value) return;
      save({ ...preferences, [key]: value }, preferences);
    },
    [preferences, save],
  );

  return { preferences, setPreference };
}
