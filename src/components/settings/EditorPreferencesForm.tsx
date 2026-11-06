"use client";

import { useEditorPreferences } from "@/components/settings/EditorPreferencesContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  EDITOR_FONT_SIZES,
  EDITOR_TAB_SIZES,
  EDITOR_THEME_LABELS,
  EDITOR_THEMES,
} from "@/lib/editor-preferences";

interface Option<T> {
  value: T;
  label: string;
}

const FONT_SIZE_OPTIONS = EDITOR_FONT_SIZES.map((size) => ({
  value: size,
  label: `${size}px`,
}));
const TAB_SIZE_OPTIONS = EDITOR_TAB_SIZES.map((size) => ({
  value: size,
  label: `${size} spaces`,
}));
const THEME_OPTIONS = EDITOR_THEMES.map((theme) => ({
  value: theme,
  label: EDITOR_THEME_LABELS[theme],
}));

interface PreferenceRowProps {
  id: string;
  label: string;
  description: string;
  children: React.ReactNode;
}

function PreferenceRow({ id, label, description, children }: PreferenceRowProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div>
        <p id={`${id}-label`} className="font-medium">
          {label}
        </p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

interface PreferenceSelectProps<T extends string | number> {
  id: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
}

function PreferenceSelect<T extends string | number>({
  id,
  value,
  options,
  onChange,
}: PreferenceSelectProps<T>) {
  return (
    <Select
      items={options}
      value={value}
      onValueChange={(next) => {
        if (next !== null) onChange(next);
      }}
    >
      <SelectTrigger aria-labelledby={`${id}-label`} className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Every change saves right away, so there's no save button.
export function EditorPreferencesForm() {
  const { preferences, setPreference } = useEditorPreferences();

  return (
    <div className="flex flex-col divide-y">
      <PreferenceRow
        id="editor-font-size"
        label="Font size"
        description="Text size in the code editor."
      >
        <PreferenceSelect
          id="editor-font-size"
          value={preferences.fontSize}
          options={FONT_SIZE_OPTIONS}
          onChange={(value) => setPreference("fontSize", value)}
        />
      </PreferenceRow>
      <PreferenceRow
        id="editor-tab-size"
        label="Tab size"
        description="Spaces inserted for each indentation level."
      >
        <PreferenceSelect
          id="editor-tab-size"
          value={preferences.tabSize}
          options={TAB_SIZE_OPTIONS}
          onChange={(value) => setPreference("tabSize", value)}
        />
      </PreferenceRow>
      <PreferenceRow
        id="editor-word-wrap"
        label="Word wrap"
        description="Wrap long lines instead of scrolling sideways."
      >
        <Switch
          aria-labelledby="editor-word-wrap-label"
          checked={preferences.wordWrap}
          onCheckedChange={(checked) => setPreference("wordWrap", checked)}
        />
      </PreferenceRow>
      <PreferenceRow
        id="editor-minimap"
        label="Minimap"
        description="Show a code overview along the right edge."
      >
        <Switch
          aria-labelledby="editor-minimap-label"
          checked={preferences.minimap}
          onCheckedChange={(checked) => setPreference("minimap", checked)}
        />
      </PreferenceRow>
      <PreferenceRow
        id="editor-theme"
        label="Theme"
        description="Color theme for the code editor."
      >
        <PreferenceSelect
          id="editor-theme"
          value={preferences.theme}
          options={THEME_OPTIONS}
          onChange={(value) => setPreference("theme", value)}
        />
      </PreferenceRow>
    </div>
  );
}
