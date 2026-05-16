"use client";

import { useState, useCallback, useRef } from "react";
import {
  loadSoundSettings,
  playSound,
  playInactivitySound,
  type SoundSettings,
} from "@/lib/sounds";

const INACTIVITY_PLAYED_KEY = "aurora_inactivity_played_date";
export const LAST_SUBMIT_KEY = "aurora_last_submit_date";

export function useCelebration() {
  const [confettiBurst, setConfettiBurst] = useState(false);
  const confettiFiredRef = useRef(false);
  // Cache settings per render cycle so multiple calls in one tick are consistent
  const settingsCache = useRef<SoundSettings | null>(null);

  function getSettings(): SoundSettings {
    if (!settingsCache.current) {
      settingsCache.current = loadSoundSettings();
    }
    return settingsCache.current;
  }

  const playSessionComplete = useCallback(() => {
    // Only fire once per session completion event
    if (confettiFiredRef.current) return;
    confettiFiredRef.current = true;

    // Reset flag after a short delay so it can fire again if user does another session
    setTimeout(() => { confettiFiredRef.current = false; }, 5000);

    setConfettiBurst(true);
    setTimeout(() => setConfettiBurst(false), 3500);

    const s = getSettings();
    playSound(s.sessionComplete, s.volume, s.customSessionBlob);
  }, []);

  const resetSessionFired = useCallback(() => {
    confettiFiredRef.current = false;
  }, []);

  const playProblemLog = useCallback(() => {
    const s = getSettings();
    if (s.problemLog === "none") return;
    playSound(s.problemLog, s.volume, s.customLogBlob);
  }, []);

  const checkInactivity = useCallback((lastAttemptDate?: string | null) => {
    // Always re-read settings fresh for this check
    const s = loadSoundSettings();
    if (s.inactivity === "none") return;

    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(INACTIVITY_PLAYED_KEY) === today) return;

    const dateToCheck = lastAttemptDate ?? localStorage.getItem(LAST_SUBMIT_KEY);
    if (!dateToCheck) return;

    const daysSince = Math.floor(
      (Date.now() - new Date(dateToCheck).getTime()) / 86_400_000,
    );
    if (daysSince >= s.inactivityDays) {
      localStorage.setItem(INACTIVITY_PLAYED_KEY, today);
      playInactivitySound(s.inactivity, s.volume);
    }
  }, []);

  const recordSubmit = useCallback(() => {
    localStorage.setItem(LAST_SUBMIT_KEY, new Date().toISOString().slice(0, 10));
    // Bust the settings cache so next play reflects any recent save
    settingsCache.current = null;
  }, []);

  return {
    confettiBurst,
    playSessionComplete,
    resetSessionFired,
    playProblemLog,
    checkInactivity,
    recordSubmit,
  };
}
