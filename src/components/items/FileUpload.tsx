"use client";

import { FileIcon, UploadIcon, XIcon } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";

import { Button } from "@/components/ui/button";
import { useDataUrl } from "@/hooks/use-data-url";
import {
  checkFile,
  FILE_CONSTRAINTS,
  formatFileSize,
  getAcceptAttribute,
  type FileTypeSlug,
} from "@/lib/file-constraints";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  id: string;
  type: FileTypeSlug;
  file: File | null;
  onChange: (file: File | null) => void;
  // 0-100 while uploading, null otherwise.
  progress: number | null;
  disabled: boolean;
  error?: string;
}

function UploadProgress({ progress }: { progress: number }) {
  return (
    <div className="flex items-center gap-3">
      <div
        role="progressbar"
        aria-label="Upload progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">
        {progress}%
      </span>
    </div>
  );
}

interface SelectedFileCardProps {
  file: File;
  isImage: boolean;
  progress: number | null;
  disabled: boolean;
  onRemove: () => void;
}

function SelectedFileCard({
  file,
  isImage,
  progress,
  disabled,
  onRemove,
}: SelectedFileCardProps) {
  const previewUrl = useDataUrl(isImage ? file : null);

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      {previewUrl && (
        // A data URL for a local file, which next/image can't optimize.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={`Preview of ${file.name}`}
          className="max-h-48 w-full rounded-md bg-muted/40 object-contain"
        />
      )}
      <div className="flex items-center gap-3">
        {!isImage && <FileIcon className="size-8 shrink-0 text-muted-foreground" />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Remove file"
          disabled={disabled}
          onClick={onRemove}
        >
          <XIcon />
        </Button>
      </div>
      {progress !== null && <UploadProgress progress={progress} />}
    </div>
  );
}

interface FileDropZoneProps {
  type: FileTypeSlug;
  disabled: boolean;
  hasError: boolean;
  // Opens the hidden file input.
  onBrowse: () => void;
  onDrop: (file: File | undefined) => void;
}

function FileDropZone({ type, disabled, hasError, onBrowse, onDrop }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const isImage = type === "images";
  const extensions = Object.keys(FILE_CONSTRAINTS[type].extensions).join(", ");
  const maxSize = formatFileSize(FILE_CONSTRAINTS[type].maxSize);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (!disabled) onDrop(event.dataTransfer.files[0]);
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label={`Choose ${isImage ? "an image" : "a file"} or drop it here`}
      onClick={() => !disabled && onBrowse()}
      onKeyDown={(event) => {
        if (disabled || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        onBrowse();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50",
        isDragging && "border-foreground/40 bg-muted/50",
        hasError && "border-destructive",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <UploadIcon className="size-6 text-muted-foreground" />
      <p className="text-sm">
        <span className="font-medium">Click to choose</span> or drag and drop
      </p>
      <p className="text-xs text-muted-foreground">
        {extensions} · up to {maxSize}
      </p>
    </div>
  );
}

export function FileUpload({
  id,
  type,
  file,
  onChange,
  progress,
  disabled,
  error,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const shownError = localError ?? error;

  function selectFile(selected: File | undefined) {
    if (!selected) return;
    const check = checkFile(selected, type);
    if (!check.ok) {
      setLocalError(check.error);
      return;
    }
    setLocalError(null);
    onChange(selected);
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={getAcceptAttribute(type)}
        className="sr-only"
        disabled={disabled}
        aria-invalid={shownError ? true : undefined}
        aria-describedby={shownError ? `${id}-error` : undefined}
        onChange={(event) => {
          selectFile(event.target.files?.[0]);
          // Lets the same file be picked again after removing it.
          event.target.value = "";
        }}
      />

      {file ? (
        <SelectedFileCard
          file={file}
          isImage={type === "images"}
          progress={progress}
          disabled={disabled}
          onRemove={() => onChange(null)}
        />
      ) : (
        <FileDropZone
          type={type}
          disabled={disabled}
          hasError={Boolean(shownError)}
          onBrowse={() => inputRef.current?.click()}
          onDrop={selectFile}
        />
      )}

      {shownError && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {shownError}
        </p>
      )}
    </div>
  );
}
