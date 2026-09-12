/**
 * Tiny Web Audio cues — no assets, no backend.
 * Failures are silent (autoplay policies, missing AudioContext).
 */

let ctx = null;
let unlocked = false;

function context() {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

export function unlockSounds() {
  const audio = context();
  if (!audio) return;
  if (audio.state === "suspended") audio.resume().catch(() => {});
  unlocked = true;
}

function tone(audio, { freq, duration, type = "sine", gain = 0.06, at = 0 }) {
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(0.0001, audio.currentTime + at);
  amp.gain.exponentialRampToValueAtTime(gain, audio.currentTime + at + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + at + duration);
  osc.connect(amp);
  amp.connect(audio.destination);
  osc.start(audio.currentTime + at);
  osc.stop(audio.currentTime + at + duration + 0.02);
}

export function playSound(kind, enabled) {
  if (!enabled) return;
  const audio = context();
  if (!audio) return;
  if (audio.state === "suspended") {
    audio.resume().catch(() => {});
    if (!unlocked) return;
  }

  try {
    if (kind === "move") {
      tone(audio, { freq: 520, duration: 0.06, type: "triangle", gain: 0.045 });
    } else if (kind === "capture") {
      tone(audio, { freq: 220, duration: 0.09, type: "square", gain: 0.04 });
      tone(audio, { freq: 140, duration: 0.1, type: "sine", gain: 0.03, at: 0.03 });
    } else if (kind === "check") {
      tone(audio, { freq: 660, duration: 0.08, type: "square", gain: 0.05 });
      tone(audio, { freq: 880, duration: 0.1, type: "square", gain: 0.04, at: 0.07 });
    } else if (kind === "success") {
      tone(audio, { freq: 523, duration: 0.1, type: "sine", gain: 0.05 });
      tone(audio, { freq: 659, duration: 0.12, type: "sine", gain: 0.05, at: 0.08 });
      tone(audio, { freq: 784, duration: 0.16, type: "sine", gain: 0.05, at: 0.16 });
    } else if (kind === "fail") {
      tone(audio, { freq: 196, duration: 0.16, type: "sawtooth", gain: 0.035 });
    } else if (kind === "gameover") {
      tone(audio, { freq: 392, duration: 0.12, type: "sine", gain: 0.05 });
      tone(audio, { freq: 330, duration: 0.16, type: "sine", gain: 0.045, at: 0.1 });
      tone(audio, { freq: 262, duration: 0.22, type: "sine", gain: 0.04, at: 0.22 });
    }
  } catch {
    // ignore
  }
}

export function soundForMove(move, afterFen, { Chess }) {
  if (!move) return "move";
  try {
    const after = new Chess(afterFen);
    if (after.isCheckmate() || after.isDraw() || after.isStalemate()) return "gameover";
    if (after.isCheck()) return "check";
  } catch {
    // fall through
  }
  if (move.captured || move.flags?.includes("e")) return "capture";
  return "move";
}
