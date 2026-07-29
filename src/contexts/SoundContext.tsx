"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useBoringMode } from "./BoringModeContext";
import { createClientFlag } from "@/lib/client-flag";
import { SOUND_STORAGE_KEY } from "@/lib/storage-keys";

// Camada de som da interface, muito sutil, desligada por padrão
// (som automático é falta de educação) e sempre muda no Modo Boring.
// Os blips são sintetizados na hora com Web Audio: zero arquivo, zero custo.
// Os nomes de evento já são a API definitiva, então trocar a síntese por
// samples gravados depois não muda nenhum componente.

const soundFlag = createClientFlag(SOUND_STORAGE_KEY);

export type UiSound = "tick" | "toggle" | "confirm";

interface SoundValue {
  isSoundOn: boolean;
  toggleSound: () => void;
  play: (name: UiSound) => void;
}

const SoundContext = createContext<SoundValue | null>(null);

// Frequência (Hz), duração (s) e volume de cada evento, calibrados para sussurro.
const SOUND_RECIPES: Record<
  UiSound,
  { freq: number; dur: number; gain: number }
> = {
  tick: { freq: 2200, dur: 0.015, gain: 0.015 },
  toggle: { freq: 660, dur: 0.06, gain: 0.03 },
  confirm: { freq: 880, dur: 0.09, gain: 0.03 },
};

export function SoundProvider({ children }: { children: ReactNode }) {
  const { isBoringMode } = useBoringMode();
  const audioRef = useRef<AudioContext | null>(null);

  const isSoundOn = useSyncExternalStore(
    soundFlag.subscribe,
    soundFlag.getSnapshot,
    soundFlag.getServerSnapshot,
  );

  const toggleSound = useCallback(() => {
    soundFlag.set(!soundFlag.getSnapshot());
  }, []);

  const play = useCallback(
    (name: UiSound) => {
      if (!isSoundOn || isBoringMode) return;
      try {
        audioRef.current ??= new AudioContext();
        const audio = audioRef.current;
        const { freq, dur, gain } = SOUND_RECIPES[name];
        const osc = audio.createOscillator();
        const amp = audio.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        amp.gain.setValueAtTime(gain, audio.currentTime);
        amp.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
        osc.connect(amp).connect(audio.destination);
        osc.start();
        osc.stop(audio.currentTime + dur);
      } catch {
        // Sem suporte a Web Audio o site segue em silêncio, sem quebrar nada.
      }
    },
    [isSoundOn, isBoringMode],
  );

  return (
    <SoundContext value={{ isSoundOn, toggleSound, play }}>
      {children}
    </SoundContext>
  );
}

export function useSound(): SoundValue {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    throw new Error("useSound deve ser usado dentro de SoundProvider");
  }
  return ctx;
}
