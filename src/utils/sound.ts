/**
 * 사운드 훅 구조 — 사운드 파일이 준비되기 전까지는 Web Audio로 가벼운 비프음을 생성해 재생한다.
 * 추후 `SOUND_FILES[key]`에 실제 파일 경로(mp3/ogg)를 채우면 해당 키부터 자동으로 파일 재생으로 전환된다.
 */
export type SoundKey =
  | 'tap'
  | 'missionComplete'
  | 'levelUp'
  | 'itemPlace'
  | 'coin'
  | 'walk';

/** 파일이 준비된 사운드만 여기에 경로를 채운다 (예: '/sounds/tap.mp3') */
const SOUND_FILES: Partial<Record<SoundKey, string>> = {};

/** 파일이 없을 때 사용할 비프음 설정 (주파수 Hz, 길이 ms, 파형) */
const BEEP_FALLBACK: Record<SoundKey, { freq: number; duration: number; type: OscillatorType }> = {
  tap: { freq: 520, duration: 40, type: 'sine' },
  missionComplete: { freq: 880, duration: 180, type: 'triangle' },
  levelUp: { freq: 1046, duration: 260, type: 'square' },
  itemPlace: { freq: 660, duration: 90, type: 'sine' },
  coin: { freq: 1320, duration: 80, type: 'triangle' },
  walk: { freq: 220, duration: 30, type: 'sine' },
};

let audioCtx: AudioContext | null = null;
let muted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
}

function playBeep(key: SoundKey) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const { freq, duration, type } = BEEP_FALLBACK[key];
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = 0.06;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration / 1000);
  osc.stop(ctx.currentTime + duration / 1000);
}

const audioCache = new Map<string, HTMLAudioElement>();

/** 사운드를 재생한다. SOUND_FILES에 경로가 있으면 파일을, 없으면 비프음을 재생한다. */
export function playSound(key: SoundKey) {
  if (muted) return;
  const file = SOUND_FILES[key];
  if (file) {
    let audio = audioCache.get(file);
    if (!audio) {
      audio = new Audio(file);
      audioCache.set(file, audio);
    }
    audio.currentTime = 0;
    void audio.play().catch(() => {});
    return;
  }
  playBeep(key);
}

export function setSoundMuted(value: boolean) {
  muted = value;
}

export function isSoundMuted() {
  return muted;
}
