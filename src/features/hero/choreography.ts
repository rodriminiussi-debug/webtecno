// Pure timeline math shared by the 3D scene and the HTML overlays, so text and
// product always stay in sync with the same scroll progress (0 → 1).

export const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1)

/** Normalized progress of `p` inside [start, end]. */
export const segment = (p: number, start: number, end: number) => clamp01((p - start) / (end - start))

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
export const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Frame-rate independent exponential smoothing. */
export const damp = (current: number, target: number, lambda: number, delta: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * delta))

export const TIMELINE = {
  copyOut: [0.04, 0.16],
  recenter: [0.06, 0.3],
  lidOpen: [0.1, 0.3],
  budsRise: [0.24, 0.46],
  budsSpread: [0.36, 0.62],
  caseAway: [0.4, 0.66],
  closeUp: [0.6, 0.86],
  finale: [0.86, 1],
  // Sequential so a single slot can host them on mobile
  callouts: [
    [0.27, 0.43],
    [0.41, 0.57],
    [0.55, 0.71],
    [0.69, 0.85],
  ],
} as const

/** 0 → 1 → 0 envelope with soft edges, for elements that appear and then leave. */
export function window01(p: number, start: number, end: number, fade = 0.05) {
  return Math.min(segment(p, start, start + fade), 1 - segment(p, end - fade, end))
}
