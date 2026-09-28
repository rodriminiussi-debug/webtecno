import { cn } from '@/lib/cn'

// The colour wave Apple uses to signal Apple Intelligence / Siri. Used only where
// a feature is AI-driven, so the colour keeps its meaning.
export const INTELLIGENCE_GRADIENT = 'conic-gradient(from 0deg, #ff8a3d, #ff4f8b, #b45cff, #4f7bff, #33d1ff, #7dffb5, #ff8a3d)'

export function IntelligenceGlow({ className, intensity = 1 }: { className?: string; intensity?: number }) {
  return (
    <div className={cn('pointer-events-none', className)} aria-hidden="true">
      <div
        className="absolute inset-[8%] rounded-full blur-[60px] motion-safe:animate-[intelligence-spin_9s_linear_infinite]"
        style={{ background: INTELLIGENCE_GRADIENT, opacity: 0.55 * intensity }}
      />
      <div
        className="absolute inset-[20%] rounded-full blur-[22px] motion-safe:animate-[intelligence-spin_6s_linear_infinite_reverse]"
        style={{ background: INTELLIGENCE_GRADIENT, opacity: 0.35 * intensity, maskImage: 'radial-gradient(closest-side, transparent 62%, black 70%, transparent 78%)' }}
      />
      <style>{`@keyframes intelligence-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
