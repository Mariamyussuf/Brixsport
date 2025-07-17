const FEEDBACK_KEY = 'brixsport_feedback_enabled';

export function isFeedbackEnabled(): boolean {
  return localStorage.getItem(FEEDBACK_KEY) !== 'false';
}
export function setFeedbackEnabled(enabled: boolean) {
  localStorage.setItem(FEEDBACK_KEY, enabled ? 'true' : 'false');
}

// Simple beep sounds (can be replaced with custom audio)
function playBeep(frequency: number, duration = 120) {
  if (!isFeedbackEnabled() || typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    osc.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, duration);
  } catch {}
}

export function playSuccess() { playBeep(880); }
export function playError() { playBeep(220); }
export function playSync() { playBeep(440); }

export function vibrateSuccess() { if (isFeedbackEnabled() && navigator.vibrate) navigator.vibrate([30, 20, 30]); }
export function vibrateError() { if (isFeedbackEnabled() && navigator.vibrate) navigator.vibrate([60, 40, 60]); }
export function vibrateSync() { if (isFeedbackEnabled() && navigator.vibrate) navigator.vibrate([20, 20, 20]); } 