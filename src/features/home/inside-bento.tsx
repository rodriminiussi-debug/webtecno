import { AutoplayVideo } from '@/components/autoplay-video'
import { cn } from '@/lib/cn'
import { posterFor } from './feature-media'

// Apple's own "inside" animations for AirPods 5 (apple.com/airpods-5)
const CARDS = [
  {
    src: '/apple/xray.mp4',
    kicker: 'Arquitectura acústica',
    title: 'Rediseñados desde adentro.',
    body: 'Una arquitectura acústica multipuerto nueva: más profundidad, claridad y detalle. Las líneas azules muestran el aire y el sonido que la atraviesan.',
    dark: false,
    wide: true,
  },
  {
    src: '/apple/chip.mp4',
    kicker: 'Chip H2',
    title: 'El cerebro de todo.',
    body: 'Audio computacional en tiempo real para la cancelación de ruido, el Audio Adaptativo y el aislamiento de voz.',
    dark: false,
    wide: false,
  },
  {
    src: '/apple/force-sensor.mp4',
    kicker: 'Sensor de presión',
    title: 'Un toque. Un deslizamiento.',
    body: 'Presioná el vástago para pausar o atender y deslizá para subir o bajar el volumen.',
    dark: false,
    wide: false,
  },
  {
    src: '/apple/siri.mp4',
    kicker: 'Siri con IA',
    title: 'Manos libres. Más inteligente.',
    body: 'Acceso sin manos a un asistente más potente y personal en tu iPhone, y Traducción en vivo para hablar en otros idiomas.',
    dark: true,
    wide: true,
  },
] as const

export function InsideBento() {
  return (
    <div className="container-mono">
      <div className="mb-8 flex items-end justify-between gap-6 md:mb-12">
        <p className="max-w-[18ch] text-[clamp(1.9rem,3.6vw,3.25rem)] font-medium leading-[1] tracking-[-0.045em]">
          Por dentro. <span className="text-white/45">Ingeniería que no se ve: se escucha.</span>
        </p>
      </div>
      <ul className="grid gap-4 md:grid-cols-5 md:gap-5">
        {CARDS.map((card) => (
          <li
            key={card.src}
            className={cn(
              'flex flex-col overflow-hidden rounded-[28px]',
              card.wide ? 'md:col-span-3' : 'md:col-span-2',
              card.dark ? 'bg-black text-white ring-1 ring-white/12' : 'bg-[#f6f5f8] text-[#1d1d1f]',
            )}
          >
            <div className="px-7 pt-7 md:px-9 md:pt-9">
              <p className={cn('label-mono', card.dark ? 'text-white/55' : 'text-black/45')}>{card.kicker}</p>
              <h3 className="mt-3 text-[clamp(1.6rem,2.4vw,2.3rem)] font-semibold leading-[1.02] tracking-[-0.04em]">{card.title}</h3>
              <p className={cn('mt-3 max-w-md text-[15px] leading-relaxed', card.dark ? 'text-white/65' : 'text-black/60')}>{card.body}</p>
            </div>
            <AutoplayVideo src={card.src} poster={posterFor(card.src)} label={card.title} className="mt-auto aspect-[1600/864] w-full" />
          </li>
        ))}
      </ul>
    </div>
  )
}
