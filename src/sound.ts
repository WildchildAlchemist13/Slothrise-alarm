// Alarm sounds. All three are synthesised (scratchpad tools/sounds.py), so there are no licences to clear.
import { useEffect } from 'react';
import { setAudioModeAsync, useAudioPlayer, type AudioPlayer } from 'expo-audio';

export const SOUNDS = {
  chime: require('../assets/sounds/alarm-chime.wav'),   // full alarm: bright arpeggio, loops every 2.4 s
  bells: require('../assets/sounds/gentle-bells.wav'),  // Gentle mode: slow warm bells, loops every 4.8 s
  yawn: require('../assets/sounds/yawn.wav'),           // Snooze's yawn, plays once
};

let audioReady: Promise<void> | null = null;
/** Ring even when the phone is on silent, and keep playing if the screen locks. */
export function prepareAudio() {
  audioReady ??= setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true }).catch(() => {});
  return audioReady;
}

/** Loop a sound while the calling screen is mounted. Returns the player so the caller can change its volume. */
export function useLoopingSound(source: number, volume = 1): AudioPlayer {
  const player = useAudioPlayer(source);
  useEffect(() => {
    let cancelled = false;
    prepareAudio().then(() => {
      if (cancelled) return;
      player.loop = true;
      player.volume = volume;
      player.play();
    });
    return () => {
      cancelled = true;
      try {
        player.pause();
      } catch {
        // already released on unmount
      }
    };
    // volume is only the starting level; later changes go through the returned player
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);
  return player;
}

/** Play a sound once when the calling screen mounts. */
export function useOneShot(source: number, volume = 1, delayMs = 0) {
  const player = useAudioPlayer(source);
  useEffect(() => {
    const t = setTimeout(() => {
      prepareAudio().then(() => {
        player.volume = volume;
        player.play();
      });
    }, delayMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);
}
