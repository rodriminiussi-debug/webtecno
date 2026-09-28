'use client'

import { useId, useState } from 'react'
import { formatDate, formatMoney } from '@/lib/format'

type Point = { date: string; revenueCents: number; orders: number }

const W = 720
const H = 220
const PAD = { top: 16, right: 12, bottom: 28, left: 12 }

/** Single-series area chart with crosshair tooltip and an accessible table fallback. */
export function RevenueChart({ data, currency }: { data: Point[]; currency: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const [showTable, setShowTable] = useState(false)
  const gradientId = useId()
  const max = Math.max(...data.map((point) => point.revenueCents), 1)
  const x = (i: number) => PAD.left + (i / Math.max(data.length - 1, 1)) * (W - PAD.left - PAD.right)
  const y = (v: number) => PAD.top + (1 - v / max) * (H - PAD.top - PAD.bottom)
  const line = data.map((point, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(point.revenueCents).toFixed(1)}`).join(' ')
  const area = `${line} L${x(data.length - 1)},${H - PAD.bottom} L${x(0)},${H - PAD.bottom} Z`
  const total = data.reduce((sum, point) => sum + point.revenueCents, 0)
  const active = hover !== null ? data[hover] : null

  if (total === 0) return <p className="py-16 text-center text-[13px] text-muted">No hubo ingresos confirmados en los últimos 30 días.</p>

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <p className="tabular text-[13px] text-ink-2">
          {active ? (
            <>
              <span className="font-medium text-ink">{formatMoney(active.revenueCents, currency)}</span> · {active.orders} {active.orders === 1 ? 'pedido' : 'pedidos'} · {formatDate(active.date, { day: '2-digit', month: 'short' })}
            </>
          ) : (
            <>
              Total del período <span className="font-medium text-ink">{formatMoney(total, currency)}</span>
            </>
          )}
        </p>
        <button type="button" onClick={() => setShowTable((value) => !value)} className="text-[12px] text-muted underline-offset-2 hover:text-ink hover:underline">
          {showTable ? 'Ver gráfico' : 'Ver como tabla'}
        </button>
      </div>
      {showTable ? (
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-muted">
                <th className="py-1 font-normal">Día</th>
                <th className="py-1 text-right font-normal">Pedidos</th>
                <th className="py-1 text-right font-normal">Ingresos</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {data.map((point) => (
                <tr key={point.date} className="border-t border-line">
                  <td className="py-1">{formatDate(point.date, { day: '2-digit', month: 'short' })}</td>
                  <td className="py-1 text-right">{point.orders}</td>
                  <td className="py-1 text-right">{formatMoney(point.revenueCents, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full touch-none"
          role="img"
          aria-label={`Ingresos diarios, total ${formatMoney(total, currency)}`}
          onPointerMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect()
            const ratio = (event.clientX - rect.left) / rect.width
            const index = Math.round(((ratio * W - PAD.left) / (W - PAD.left - PAD.right)) * (data.length - 1))
            setHover(Math.min(Math.max(index, 0), data.length - 1))
          }}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--mono-ink)" stopOpacity="0.12" />
              <stop offset="1" stopColor="var(--mono-ink)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line key={ratio} x1={PAD.left} x2={W - PAD.right} y1={PAD.top + ratio * (H - PAD.top - PAD.bottom)} y2={PAD.top + ratio * (H - PAD.top - PAD.bottom)} stroke="var(--mono-line)" />
          ))}
          <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} stroke="var(--mono-line-strong)" />
          <path d={area} fill={`url(#${gradientId})`} />
          <path d={line} fill="none" stroke="var(--mono-ink)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {[0, Math.floor((data.length - 1) / 2), data.length - 1].map((i) => (
            <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'} className="fill-[var(--mono-muted)] font-mono text-[10px]">
              {formatDate(data[i].date, { day: '2-digit', month: 'short' })}
            </text>
          ))}
          {hover !== null && active && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--mono-ink)" strokeOpacity="0.25" />
              <circle cx={x(hover)} cy={y(active.revenueCents)} r="5" fill="var(--mono-ink)" stroke="var(--mono-surface)" strokeWidth="2" />
            </g>
          )}
        </svg>
      )}
    </div>
  )
}
