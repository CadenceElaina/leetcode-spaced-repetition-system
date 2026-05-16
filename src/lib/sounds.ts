export type SoundPreset =
  | "wow"
  | "yippee"
  | "golf-clap"
  | "applause"
  | "crowd-cheers"
  | "deja-vu"
  | "custom"
  | "none";

export type InactivitySound = "hells-kitchen" | "fahhh" | "none";

export type InactivityPresetDef = {
  id: InactivitySound;
  label: string;
  file?: string;
};

export const INACTIVITY_PRESETS: InactivityPresetDef[] = [
  { id: "none", label: "None" },
  { id: "hells-kitchen", label: "Hell's Kitchen violin", file: "/sounds/hells-kitchen.mp3" },
  { id: "fahhh", label: "FAHHHH!", file: "/sounds/thud.mp3" },
];

export type SoundSettings = {
  sessionComplete: SoundPreset;
  problemLog: SoundPreset;
  inactivity: InactivitySound;
  inactivityDays: number;
  volume: number;
  customSessionBlob: string | null;
  customLogBlob: string | null;
};

export const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  sessionComplete: "none",
  problemLog: "none",
  inactivity: "none",
  inactivityDays: 3,
  volume: 0.35,
  customSessionBlob: null,
  customLogBlob: null,
};

export type PresetDef = {
  id: SoundPreset;
  label: string;
  file?: string;
  capSeconds?: number;
};

export const SOUND_PRESETS: PresetDef[] = [
  { id: "none", label: "None" },
  { id: "wow", label: "Wow!", file: "/sounds/wow.mp3" },
  { id: "yippee", label: "Yippee!", file: "/sounds/yippee.mp3" },
  { id: "golf-clap", label: "Golf Clap", file: "/sounds/golf-clap.mp3" },
  { id: "applause", label: "Applause", file: "/sounds/applause.mp3", capSeconds: 5 },
  { id: "crowd-cheers", label: "Crowd Cheers", file: "/sounds/crowd-cheers.mp3", capSeconds: 5 },
  { id: "deja-vu", label: "Deja Vu", file: "/sounds/deja-vu.mp3" },
  { id: "custom", label: "Custom (upload)" },
];

export const SOUND_SETTINGS_KEY = "aurora_sound_settings";

export function loadSoundSettings(): SoundSettings {
  if (typeof window === "undefined") return DEFAULT_SOUND_SETTINGS;
  try {
    const raw = localStorage.getItem(SOUND_SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SOUND_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_SOUND_SETTINGS;
}

export function saveSoundSettings(s: SoundSettings): void {
  localStorage.setItem(SOUND_SETTINGS_KEY, JSON.stringify(s));
}

let currentAudio: HTMLAudioElement | null = null;

function fadeOutAndStop(audio: HTMLAudioElement) {
  const step = audio.volume / 10;
  const timer = setInterval(() => {
    if (audio.volume > step) {
      audio.volume = Math.max(0, audio.volume - step);
    } else {
      audio.pause();
      if (currentAudio === audio) currentAudio = null;
      clearInterval(timer);
    }
  }, 30);
}

export function playSound(
  preset: SoundPreset,
  volume: number,
  customBlob?: string | null,
): void {
  if (preset === "none") return;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  const def = SOUND_PRESETS.find((p) => p.id === preset);
  const src = preset === "custom" ? (customBlob ?? null) : (def?.file ?? null);
  if (!src) return;

  const audio = new Audio(src);
  audio.volume = Math.max(0, Math.min(1, volume));
  currentAudio = audio;

  audio.play().catch(() => { /* autoplay policy blocked it */ });

  if (def?.capSeconds) {
    setTimeout(() => {
      if (currentAudio === audio) fadeOutAndStop(audio);
    }, def.capSeconds * 1000);
  }

  audio.addEventListener("ended", () => {
    if (currentAudio === audio) currentAudio = null;
  });
}

export function playInactivitySound(sound: InactivitySound, volume: number): void {
  if (sound === "none") return;
  const def = INACTIVITY_PRESETS.find((p) => p.id === sound);
  if (!def?.file) return;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  const audio = new Audio(def.file);
  audio.volume = Math.max(0, Math.min(1, volume));
  currentAudio = audio;
  audio.play().catch(() => {});
  audio.addEventListener("ended", () => {
    if (currentAudio === audio) currentAudio = null;
  });
}

export function previewSound(preset: SoundPreset, volume: number, customBlob?: string | null): void {
  playSound(preset, volume, customBlob);
}

export function stopCurrentSound(): void {
  if (currentAudio) {
    fadeOutAndStop(currentAudio);
  }
}
