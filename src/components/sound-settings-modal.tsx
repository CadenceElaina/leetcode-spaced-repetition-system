"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Volume2, Play, Upload } from "lucide-react";
import {
  SOUND_PRESETS,
  loadSoundSettings,
  saveSoundSettings,
  previewSound,
  stopCurrentSound,
  type SoundSettings,
  type SoundPreset,
  type InactivitySound,
} from "@/lib/sounds";

const MAX_UPLOAD_BYTES = 512 * 1024; // 500 KB
const MAX_DURATION_S = 10;

/* ── Preset selector for one trigger slot ── */
function PresetSelector({
  label,
  value,
  onChange,
  customBlob,
  onCustomUpload,
  volume,
}: {
  label: string;
  value: SoundPreset;
  onChange: (v: SoundPreset) => void;
  customBlob: string | null;
  onCustomUpload: (blob: string) => void;
  volume: number;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError("File too large (max 500 KB)");
      return;
    }
    if (!file.type.startsWith("audio/")) {
      setUploadError("Must be an audio file");
      return;
    }
    // Check duration
    const url = URL.createObjectURL(file);
    const tmp = new Audio(url);
    tmp.addEventListener("loadedmetadata", () => {
      URL.revokeObjectURL(url);
      if (tmp.duration > MAX_DURATION_S) {
        setUploadError(`Clip too long (max ${MAX_DURATION_S}s)`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const blob = ev.target?.result as string;
        onCustomUpload(blob);
        onChange("custom");
      };
      reader.readAsDataURL(file);
    });
    tmp.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      setUploadError("Could not read audio file");
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {SOUND_PRESETS.filter((p) => p.id !== "custom").map((p) => (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-all ${
              value === p.id
                ? "border-accent bg-accent/15 text-accent"
                : "border-border text-muted-foreground hover:border-border/80 hover:bg-muted/50"
            }`}
          >
            {p.id !== "none" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  previewSound(p.id, volume);
                }}
                className="text-muted-foreground/60 hover:text-accent transition-colors"
                title="Preview"
              >
                <Play className="h-2.5 w-2.5" />
              </button>
            )}
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom upload row */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { onChange("custom"); fileRef.current?.click(); }}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-all ${
            value === "custom"
              ? "border-accent bg-accent/15 text-accent"
              : "border-border text-muted-foreground hover:border-border/80 hover:bg-muted/50"
          }`}
        >
          <Upload className="h-2.5 w-2.5" />
          Custom
        </button>
        {value === "custom" && customBlob && (
          <button
            onClick={() => previewSound("custom", volume, customBlob)}
            className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <Play className="h-2.5 w-2.5" />
            Preview
          </button>
        )}
        {uploadError && <p className="text-[11px] text-destructive">{uploadError}</p>}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="audio/mpeg,audio/ogg,audio/wav,audio/mp4,audio/webm"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

/* ── Main modal ── */
export function SoundSettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [settings, setSettings] = useState<SoundSettings>(() => loadSoundSettings());
  const [saved, setSaved] = useState(false);

  // Re-read from localStorage each time the modal opens
  useEffect(() => {
    if (open) setSettings(loadSoundSettings());
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const update = useCallback(<K extends keyof SoundSettings>(key: K, val: SoundSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
  }, []);

  function handleSave() {
    saveSoundSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!open || typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-background shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border shrink-0">
          <div>
            <h2 className="text-sm font-semibold">Sound Effects</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Optional. Off by default — enable what you want.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-6 flex-1">
          {/* Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium flex items-center gap-1.5">
                <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                Volume
              </label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {Math.round(settings.volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              onChange={(e) => update("volume", parseFloat(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          <div className="h-px bg-border/60" />

          {/* Session complete */}
          <PresetSelector
            label="Session complete"
            value={settings.sessionComplete}
            onChange={(v) => update("sessionComplete", v)}
            customBlob={settings.customSessionBlob}
            onCustomUpload={(blob) => update("customSessionBlob", blob)}
            volume={settings.volume}
          />

          <div className="h-px bg-border/60" />

          {/* Problem logged */}
          <PresetSelector
            label="Problem logged"
            value={settings.problemLog}
            onChange={(v) => update("problemLog", v)}
            customBlob={settings.customLogBlob}
            onCustomUpload={(blob) => update("customLogBlob", blob)}
            volume={settings.volume}
          />

          <div className="h-px bg-border/60" />

          {/* Inactivity */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">
              Inactivity reminder (Hell&apos;s Kitchen violin)
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Plays once when you haven&apos;t logged anything in a while. Very motivating.
            </p>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <button
                  role="switch"
                  aria-checked={settings.inactivity !== "none"}
                  onClick={() =>
                    update("inactivity", settings.inactivity === "none" ? "hells-kitchen" : "none")
                  }
                  className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border transition-colors ${
                    settings.inactivity !== "none"
                      ? "bg-accent border-accent/80"
                      : "bg-muted-foreground/30 border-muted-foreground/20"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ${
                      settings.inactivity !== "none" ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
                <span className="text-xs">Enable</span>
              </label>
              {settings.inactivity !== "none" && (
                <button
                  onClick={() => {
                    stopCurrentSound();
                    const a = new Audio("/sounds/hells-kitchen.mp3");
                    a.volume = settings.volume;
                    a.play().catch(() => {});
                  }}
                  className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  <Play className="h-2.5 w-2.5" />
                  Preview
                </button>
              )}
            </div>
            {settings.inactivity !== "none" && (
              <div className="flex items-center gap-3">
                <label className="text-xs text-muted-foreground whitespace-nowrap">
                  After
                </label>
                <select
                  value={settings.inactivityDays}
                  onChange={(e) => update("inactivityDays", parseInt(e.target.value))}
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  {[2, 3, 5, 7, 10, 14].map((d) => (
                    <option key={d} value={d}>
                      {d} days without logging
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-md bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            {saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
