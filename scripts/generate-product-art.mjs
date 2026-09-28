// Generates the demo product renders in public/products as original SVG art.
// Consistent studio lighting (key light top-left), transparent background:
// the storefront tile supplies the backdrop. Run: node scripts/generate-product-art.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const OUT = path.join(process.cwd(), 'public', 'products')
mkdirSync(OUT, { recursive: true })

const defs = `
<defs>
  <filter id="blur-lg" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
  <filter id="blur-sm" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
  <linearGradient id="white" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#eeeeec"/><stop offset="1" stop-color="#cfcfcb"/>
  </linearGradient>
  <linearGradient id="white-v" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#ecebe8"/><stop offset="1" stop-color="#d2d1cd"/>
  </linearGradient>
  <linearGradient id="white-h" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#d9d9d5"/><stop offset=".25" stop-color="#ffffff"/><stop offset=".7" stop-color="#f0f0ed"/><stop offset="1" stop-color="#c9c9c4"/>
  </linearGradient>
  <linearGradient id="graphite" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#4a4a4e"/><stop offset=".5" stop-color="#2a2a2d"/><stop offset="1" stop-color="#151517"/>
  </linearGradient>
  <linearGradient id="graphite-h" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#1b1b1d"/><stop offset=".3" stop-color="#4b4b50"/><stop offset=".7" stop-color="#2c2c2f"/><stop offset="1" stop-color="#121214"/>
  </linearGradient>
  <linearGradient id="sand" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#f1ebe0"/><stop offset=".55" stop-color="#ddd4c4"/><stop offset="1" stop-color="#bfb4a1"/>
  </linearGradient>
  <linearGradient id="titanium" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#e4e1dc"/><stop offset=".45" stop-color="#bdb9b2"/><stop offset=".7" stop-color="#d6d3cd"/><stop offset="1" stop-color="#9c9891"/>
  </linearGradient>
  <linearGradient id="silver" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#f4f4f5"/><stop offset=".5" stop-color="#d0d1d4"/><stop offset="1" stop-color="#a9abb0"/>
  </linearGradient>
  <linearGradient id="silver-h" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#a4a6ab"/><stop offset=".2" stop-color="#eeeff1"/><stop offset=".6" stop-color="#d3d4d7"/><stop offset="1" stop-color="#9a9ca1"/>
  </linearGradient>
  <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#1d1d21"/><stop offset=".6" stop-color="#0b0b0d"/><stop offset="1" stop-color="#050506"/>
  </linearGradient>
  <linearGradient id="wall" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#2b2b30"/><stop offset=".45" stop-color="#6d6a66"/><stop offset=".7" stop-color="#ff6a2b"/><stop offset="1" stop-color="#1c1c20"/>
  </linearGradient>
  <linearGradient id="glare" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ffffff" stop-opacity=".22"/><stop offset=".4" stop-color="#ffffff" stop-opacity=".04"/><stop offset=".41" stop-color="#ffffff" stop-opacity="0"/>
  </linearGradient>
  <radialGradient id="lens" cx=".4" cy=".35" r=".7">
    <stop offset="0" stop-color="#4a5566"/><stop offset=".35" stop-color="#101318"/><stop offset="1" stop-color="#030304"/>
  </radialGradient>
  <radialGradient id="cavity" cx=".5" cy=".4" r=".6">
    <stop offset="0" stop-color="#c9c9c5"/><stop offset="1" stop-color="#e9e9e6"/>
  </radialGradient>
  <radialGradient id="mesh" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="#3a3a3e"/><stop offset="1" stop-color="#18181a"/>
  </radialGradient>
  <pattern id="knit" width="8" height="8" patternUnits="userSpaceOnUse">
    <rect width="8" height="8" fill="#2b2b2e"/><circle cx="4" cy="4" r="1.6" fill="#3d3d41"/>
  </pattern>
  <pattern id="knit-light" width="8" height="8" patternUnits="userSpaceOnUse">
    <rect width="8" height="8" fill="#dcdcd8"/><circle cx="4" cy="4" r="1.6" fill="#ececea"/>
  </pattern>
  <pattern id="felt" width="6" height="6" patternUnits="userSpaceOnUse">
    <rect width="6" height="6" fill="#8f8a83"/><circle cx="1.5" cy="2" r=".8" fill="#9c978f"/><circle cx="4.5" cy="4.5" r=".7" fill="#827d76"/>
  </pattern>
</defs>`

const shadow = (cx, cy, rx, ry, opacity = 0.28) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" opacity="${opacity}" filter="url(#blur-lg)"/>`

const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">${defs}${body}</svg>\n`

// --- Parts -----------------------------------------------------------------

function bud({ x, y, rotate = 0, scale = 1, mirror = false, tone = 'white' }) {
  const body = tone === 'white' ? 'url(#white)' : 'url(#graphite)'
  const stem = tone === 'white' ? 'url(#white-h)' : 'url(#graphite-h)'
  const tip = tone === 'white' ? '#dedede' : '#3a3a3d'
  return `<g transform="translate(${x} ${y}) rotate(${rotate}) scale(${mirror ? -scale : scale} ${scale})">
    <rect x="-20" y="40" width="40" height="230" rx="20" fill="${stem}"/>
    <rect x="-20" y="248" width="40" height="22" rx="11" fill="url(#silver-h)"/>
    <ellipse cx="0" cy="20" rx="72" ry="66" fill="${body}"/>
    <ellipse cx="54" cy="4" rx="46" ry="40" fill="${tip}"/>
    <ellipse cx="62" cy="0" rx="28" ry="26" fill="#2a2a2c"/>
    <ellipse cx="62" cy="0" rx="20" ry="18" fill="url(#mesh)"/>
    <rect x="-44" y="-10" width="26" height="54" rx="13" fill="#1f1f22" transform="rotate(-8)"/>
    <ellipse cx="-24" cy="-6" rx="30" ry="18" fill="#fff" opacity=".55" filter="url(#blur-sm)"/>
  </g>`
}

function airpodsCase({ open = true }) {
  const lid = open
    ? `<rect x="196" y="236" width="408" height="190" rx="84" fill="url(#white-v)"/>
       <rect x="222" y="262" width="356" height="138" rx="64" fill="#e4e4e0"/>
       <rect x="222" y="262" width="356" height="138" rx="64" fill="url(#glare)"/>
       <rect x="300" y="420" width="200" height="16" rx="8" fill="url(#silver-h)"/>`
    : `<path d="M180 420 C180 360 620 360 620 420 L620 470 L180 470 Z" fill="url(#white-v)"/>`
  return `${shadow(400, 812, 250, 26)}
    ${lid}
    <path d="M180 440 L620 440 L620 700 C620 790 560 810 400 810 C240 810 180 790 180 700 Z" fill="url(#white-h)"/>
    <path d="M180 440 L620 440 L620 468 L180 468 Z" fill="#e2e2df"/>
    <ellipse cx="400" cy="442" rx="220" ry="16" fill="url(#white-v)"/>
    <ellipse cx="310" cy="444" rx="72" ry="10" fill="url(#cavity)"/>
    <ellipse cx="490" cy="444" rx="72" ry="10" fill="url(#cavity)"/>
    <circle cx="400" cy="600" r="6" fill="#9be7b0"/>
    <circle cx="400" cy="600" r="14" fill="#9be7b0" opacity=".25" filter="url(#blur-sm)"/>
    <path d="M200 520 C220 700 260 780 330 800" stroke="#fff" stroke-width="10" opacity=".6" fill="none" filter="url(#blur-sm)"/>`
}

function phoneBack({ x = 400, y = 500, rotate = 0, finish = 'url(#titanium)' }) {
  return `<g transform="translate(${x} ${y}) rotate(${rotate})">
    <rect x="-170" y="-350" width="340" height="700" rx="62" fill="#8d8983"/>
    <rect x="-164" y="-344" width="328" height="688" rx="57" fill="${finish}"/>
    <rect x="-150" y="-330" width="176" height="176" rx="44" fill="#a9a59e" opacity=".9"/>
    <rect x="-146" y="-326" width="168" height="168" rx="41" fill="${finish}"/>
    <circle cx="-106" cy="-286" r="36" fill="#6f6b65"/><circle cx="-106" cy="-286" r="28" fill="url(#lens)"/>
    <circle cx="-106" cy="-198" r="36" fill="#6f6b65"/><circle cx="-106" cy="-198" r="28" fill="url(#lens)"/>
    <circle cx="-26" cy="-242" r="36" fill="#6f6b65"/><circle cx="-26" cy="-242" r="28" fill="url(#lens)"/>
    <circle cx="-26" cy="-300" r="9" fill="#f7f3e8"/><circle cx="-26" cy="-184" r="6" fill="#2a2a2c"/>
    <rect x="-164" y="-344" width="328" height="688" rx="57" fill="url(#glare)"/>
  </g>`
}

function phoneFront({ x = 400, y = 500, rotate = 0 }) {
  return `<g transform="translate(${x} ${y}) rotate(${rotate})">
    <rect x="-170" y="-350" width="340" height="700" rx="62" fill="#8d8983"/>
    <rect x="-162" y="-342" width="324" height="684" rx="56" fill="#0a0a0b"/>
    <rect x="-150" y="-330" width="300" height="660" rx="46" fill="url(#wall)"/>
    <rect x="-50" y="-314" width="100" height="30" rx="15" fill="#000"/>
    <text x="0" y="-190" text-anchor="middle" font-family="Helvetica, Arial" font-size="76" font-weight="300" fill="#fff" opacity=".92">9:41</text>
    <rect x="-150" y="-330" width="300" height="660" rx="46" fill="url(#glare)"/>
  </g>`
}

function watch({ x = 400, y = 500, rotate = 0, band = '#2a2a2d', caseFill = 'url(#silver)' }) {
  return `<g transform="translate(${x} ${y}) rotate(${rotate})">
    <rect x="-118" y="-420" width="236" height="300" rx="50" fill="${band}"/>
    <rect x="-118" y="120" width="236" height="300" rx="50" fill="${band}"/>
    <g opacity=".35">${[0, 1, 2, 3].map((i) => `<rect x="-100" y="${-400 + i * 60}" width="200" height="4" rx="2" fill="#000"/>`).join('')}</g>
    <rect x="-172" y="-212" width="344" height="424" rx="96" fill="${caseFill}"/>
    <rect x="172" y="-80" width="22" height="92" rx="10" fill="url(#silver-h)"/>
    <rect x="174" y="40" width="14" height="70" rx="6" fill="#b4b6ba"/>
    <rect x="-156" y="-196" width="312" height="392" rx="82" fill="#050506"/>
    <circle cx="0" cy="0" r="104" fill="none" stroke="#ff4d00" stroke-width="18" stroke-dasharray="480 700" stroke-linecap="round" transform="rotate(-90)"/>
    <circle cx="0" cy="0" r="80" fill="none" stroke="#b7f36b" stroke-width="18" stroke-dasharray="360 700" stroke-linecap="round" transform="rotate(-90)"/>
    <circle cx="0" cy="0" r="56" fill="none" stroke="#6ad7f5" stroke-width="18" stroke-dasharray="260 700" stroke-linecap="round" transform="rotate(-90)"/>
    <text x="0" y="-140" text-anchor="middle" font-family="Helvetica, Arial" font-size="30" fill="#fff" opacity=".85">10:09</text>
    <rect x="-156" y="-196" width="312" height="392" rx="82" fill="url(#glare)"/>
  </g>`
}

function laptopOpen() {
  return `${shadow(400, 790, 330, 24)}
    <path d="M150 250 Q150 230 170 230 L630 230 Q650 230 650 250 L650 640 L150 640 Z" fill="url(#silver)"/>
    <rect x="162" y="242" width="476" height="390" rx="10" fill="#050506"/>
    <rect x="172" y="256" width="456" height="366" rx="4" fill="url(#wall)"/>
    <rect x="370" y="242" width="60" height="12" rx="6" fill="#000"/>
    <rect x="172" y="256" width="456" height="366" rx="4" fill="url(#glare)"/>
    <path d="M150 640 L650 640 L740 760 Q742 772 728 772 L72 772 Q58 772 60 760 Z" fill="url(#silver-h)"/>
    <path d="M178 656 L622 656 L680 736 L120 736 Z" fill="#c4c5c9"/>
    ${Array.from({ length: 5 }, (_, row) => `<path d="M${190 - row * 12} ${664 + row * 13} L${610 + row * 12} ${664 + row * 13}" stroke="#9fa1a6" stroke-width="7" stroke-dasharray="26 6"/>`).join('')}
    <path d="M330 744 L470 744 L476 764 L324 764 Z" fill="#c9cace"/>
    <path d="M60 760 L740 760 L736 772 L64 772 Z" fill="#8f9196"/>`
}

function laptopClosed() {
  return `${shadow(400, 800, 320, 22)}
    <g transform="translate(400 520) rotate(-8)">
      <rect x="-300" y="-230" width="600" height="440" rx="26" fill="#8f9196"/>
      <rect x="-300" y="-236" width="600" height="432" rx="26" fill="url(#silver)"/>
      <circle cx="0" cy="-20" r="30" fill="#c2c3c7"/>
      <rect x="-300" y="-236" width="600" height="432" rx="26" fill="url(#glare)"/>
    </g>`
}

function tablet({ front = true, rotate = 0 }) {
  const face = front
    ? `<rect x="-252" y="-340" width="504" height="680" rx="30" fill="#050506"/>
       <rect x="-236" y="-324" width="472" height="648" rx="18" fill="url(#wall)"/>
       <rect x="-236" y="-324" width="472" height="648" rx="18" fill="url(#glare)"/>`
    : `<rect x="-252" y="-340" width="504" height="680" rx="30" fill="url(#silver)"/>
       <rect x="-222" y="-310" width="84" height="84" rx="26" fill="#b9bbbf"/>
       <circle cx="-180" cy="-268" r="26" fill="#6e7075"/><circle cx="-180" cy="-268" r="19" fill="url(#lens)"/>
       <circle cx="0" cy="0" r="34" fill="#c4c5c9"/>
       <rect x="-252" y="-340" width="504" height="680" rx="30" fill="url(#glare)"/>`
  return `${shadow(400, 880, 240, 20, 0.22)}
    <g transform="translate(400 500) rotate(${rotate})">
      <rect x="-262" y="-350" width="524" height="700" rx="38" fill="#a7a9ad"/>
      ${face}
    </g>`
}

function charger({ withCable = false, rotate = 0 }) {
  const cable = withCable
    ? `<path d="M400 690 C400 820 600 780 620 900" stroke="url(#white-h)" stroke-width="22" fill="none" stroke-linecap="round"/>
       <rect x="376" y="640" width="48" height="70" rx="12" fill="url(#white-h)"/>`
    : ''
  return `${shadow(400, 820, 200, 22)}
    <g transform="rotate(${rotate} 400 520)">
      <rect x="360" y="210" width="16" height="90" rx="4" fill="url(#silver-h)"/>
      <rect x="424" y="210" width="16" height="90" rx="4" fill="url(#silver-h)"/>
      <rect x="230" y="290" width="340" height="360" rx="70" fill="url(#white)"/>
      <rect x="230" y="290" width="340" height="360" rx="70" fill="url(#glare)"/>
      <rect x="352" y="470" width="96" height="30" rx="15" fill="#1b1b1d"/><rect x="366" y="480" width="68" height="10" rx="5" fill="#3a3a3e"/>
      <rect x="352" y="540" width="96" height="30" rx="15" fill="#1b1b1d"/><rect x="366" y="550" width="68" height="10" rx="5" fill="#3a3a3e"/>
      <text x="400" y="400" text-anchor="middle" font-family="Helvetica, Arial" font-size="26" letter-spacing="8" font-weight="600" fill="#b9b9b5">MONO</text>
    </g>
    ${cable}`
}

function headphones({ tone = 'graphite' }) {
  const shell = tone === 'graphite' ? 'url(#graphite)' : 'url(#sand)'
  const band = tone === 'graphite' ? 'url(#graphite-h)' : 'url(#sand)'
  const cushion = tone === 'graphite' ? '#1a1a1c' : '#cbc1ae'
  const knit = tone === 'graphite' ? 'url(#knit)' : 'url(#knit-light)'
  return `${shadow(400, 850, 260, 24)}
    <path d="M190 560 C170 230 630 230 610 560" stroke="${band}" stroke-width="46" fill="none" stroke-linecap="round"/>
    <path d="M214 540 C200 290 600 290 586 540" stroke="${knit}" stroke-width="22" fill="none" stroke-linecap="round"/>
    <rect x="170" y="520" width="40" height="110" rx="18" fill="url(#silver-h)"/>
    <rect x="590" y="520" width="40" height="110" rx="18" fill="url(#silver-h)"/>
    <rect x="110" y="590" width="170" height="250" rx="80" fill="${shell}"/>
    <rect x="248" y="610" width="46" height="210" rx="23" fill="${cushion}"/>
    <rect x="520" y="590" width="170" height="250" rx="80" fill="${shell}"/>
    <rect x="506" y="610" width="46" height="210" rx="23" fill="${cushion}"/>
    <ellipse cx="160" cy="650" rx="30" ry="50" fill="#fff" opacity=".18" filter="url(#blur-sm)"/>
    <ellipse cx="570" cy="650" rx="30" ry="50" fill="#fff" opacity=".18" filter="url(#blur-sm)"/>`
}

function powerbank({ rotate = 0 }) {
  return `${shadow(400, 830, 220, 22)}
    <g transform="rotate(${rotate} 400 520)">
      <rect x="250" y="200" width="300" height="620" rx="46" fill="#8f9196"/>
      <rect x="254" y="196" width="292" height="612" rx="42" fill="url(#graphite)"/>
      <rect x="290" y="236" width="220" height="92" rx="16" fill="#060607"/>
      <text x="400" y="298" text-anchor="middle" font-family="Menlo, monospace" font-size="44" fill="#ff4d00">86%</text>
      <text x="400" y="560" text-anchor="middle" font-family="Helvetica, Arial" font-size="24" letter-spacing="8" font-weight="600" fill="#5a5a5f">MONO CELL</text>
      <rect x="254" y="196" width="292" height="612" rx="42" fill="url(#glare)"/>
      <rect x="330" y="790" width="40" height="12" rx="6" fill="#0c0c0d"/><rect x="386" y="790" width="40" height="12" rx="6" fill="#0c0c0d"/><rect x="442" y="790" width="30" height="12" rx="3" fill="#0c0c0d"/>
    </g>`
}

function cable({ close = false }) {
  if (close) {
    return `${shadow(400, 840, 200, 20)}
      <path d="M160 900 C200 600 520 760 420 420" stroke="url(#graphite-h)" stroke-width="42" fill="none" stroke-linecap="round"/>
      <path d="M160 900 C200 600 520 760 420 420" stroke="#000" stroke-opacity=".25" stroke-width="42" stroke-dasharray="6 6" fill="none"/>
      <g transform="translate(420 380) rotate(-12)">
        <rect x="-44" y="-120" width="88" height="170" rx="22" fill="url(#silver-h)"/>
        <rect x="-26" y="-190" width="52" height="84" rx="12" fill="url(#silver)"/>
        <rect x="-18" y="-178" width="36" height="16" rx="8" fill="#232326"/>
      </g>`
  }
  const loops = [0, 1, 2, 3]
    .map((i) => `<ellipse cx="400" cy="${520 + i * 14}" rx="${200 - i * 8}" ry="${150 - i * 6}" fill="none" stroke="url(#graphite-h)" stroke-width="30"/>`)
    .join('')
  return `${shadow(400, 760, 250, 26)}
    ${loops}
    <path d="M580 560 C660 600 660 700 560 760" stroke="url(#graphite-h)" stroke-width="30" fill="none" stroke-linecap="round"/>
    <g transform="translate(540 780) rotate(40)"><rect x="-30" y="-20" width="60" height="110" rx="16" fill="url(#silver-h)"/><rect x="-18" y="84" width="36" height="46" rx="8" fill="url(#silver)"/></g>
    <g transform="translate(250 380) rotate(-130)"><rect x="-30" y="-20" width="60" height="110" rx="16" fill="url(#silver-h)"/><rect x="-18" y="84" width="36" height="46" rx="8" fill="url(#silver)"/></g>`
}

function sleeve({ withLaptop = false }) {
  const laptop = withLaptop ? `<rect x="170" y="250" width="460" height="120" rx="18" fill="url(#silver)"/>` : ''
  return `${shadow(400, 860, 280, 24)}
    ${laptop}
    <rect x="140" y="300" width="520" height="540" rx="36" fill="url(#felt)"/>
    <rect x="140" y="300" width="520" height="540" rx="36" fill="url(#glare)"/>
    <path d="M140 330 Q140 300 170 300 L630 300 Q660 300 660 330 L660 470 Q400 560 140 470 Z" fill="#5d4a3a"/>
    <path d="M140 470 Q400 560 660 470" stroke="#4a3a2d" stroke-width="4" fill="none"/>
    <circle cx="400" cy="508" r="10" fill="#3b2e24"/>
    <path d="M160 820 L640 820" stroke="#7a756e" stroke-width="3" stroke-dasharray="10 8"/>`
}

function controller({ rotate = 0 }) {
  return `${shadow(400, 800, 300, 24)}
    <g transform="rotate(${rotate} 400 520)">
      <path d="M170 380 Q240 330 330 350 L470 350 Q560 330 630 380 Q720 450 730 640 Q736 740 660 740 Q610 740 570 660 L540 610 L260 610 L230 660 Q190 740 140 740 Q64 740 70 640 Q80 450 170 380 Z" fill="url(#white)"/>
      <path d="M170 380 Q240 330 330 350 L470 350 Q560 330 630 380" stroke="#fff" stroke-width="8" fill="none" opacity=".8"/>
      <circle cx="270" cy="470" r="52" fill="#1d1d20"/><circle cx="270" cy="470" r="34" fill="url(#graphite)"/>
      <circle cx="480" cy="560" r="44" fill="#1d1d20"/><circle cx="480" cy="560" r="28" fill="url(#graphite)"/>
      <g fill="#d2d2ce"><rect x="296" y="540" width="24" height="70" rx="6" transform="translate(-10 0)"/><rect x="263" y="563" width="70" height="24" rx="6" transform="translate(-10 0)"/></g>
      <circle cx="560" cy="430" r="17" fill="#ff4d00"/><circle cx="600" cy="470" r="17" fill="#2a2a2d"/><circle cx="520" cy="470" r="17" fill="#2a2a2d"/><circle cx="560" cy="510" r="17" fill="#2a2a2d"/>
      <rect x="370" y="430" width="60" height="16" rx="8" fill="#c9c9c5"/>
    </g>`
}

function speaker({ top = false }) {
  if (top) {
    return `${shadow(400, 820, 240, 26)}
      <ellipse cx="400" cy="560" rx="230" ry="230" fill="url(#knit-light)"/>
      <ellipse cx="400" cy="560" rx="150" ry="150" fill="url(#white)"/>
      <circle cx="400" cy="560" r="120" fill="none" stroke="#ff4d00" stroke-width="10" opacity=".9"/>
      <circle cx="400" cy="560" r="120" fill="none" stroke="#ff4d00" stroke-width="30" opacity=".25" filter="url(#blur-sm)"/>
      <circle cx="340" cy="560" r="8" fill="#9a9a96"/><circle cx="460" cy="560" r="8" fill="#9a9a96"/>`
  }
  return `${shadow(400, 850, 230, 26)}
    <rect x="200" y="300" width="400" height="530" rx="80" fill="url(#knit-light)"/>
    <rect x="200" y="300" width="400" height="530" rx="80" fill="url(#white-h)" opacity=".55"/>
    <ellipse cx="400" cy="306" rx="200" ry="46" fill="url(#white-v)"/>
    <ellipse cx="400" cy="306" rx="120" ry="26" fill="none" stroke="#ff4d00" stroke-width="6"/>
    <text x="400" y="780" text-anchor="middle" font-family="Helvetica, Arial" font-size="20" letter-spacing="8" font-weight="600" fill="#a9a9a5">MONO</text>`
}

function budsLite({ open = false }) {
  const pill = `<rect x="240" y="470" width="320" height="220" rx="110" fill="url(#graphite)"/>
    <path d="M240 580 L560 580" stroke="#111113" stroke-width="4"/>
    <circle cx="400" cy="640" r="5" fill="#ff4d00"/>
    <rect x="240" y="470" width="320" height="220" rx="110" fill="url(#glare)"/>`
  const buds = open
    ? `<g transform="translate(300 360) rotate(-20)"><ellipse cx="0" cy="0" rx="62" ry="56" fill="url(#graphite)"/><ellipse cx="46" cy="-4" rx="30" ry="28" fill="#3a3a3d"/><circle cx="-12" cy="-10" r="12" fill="#ff4d00" opacity=".9"/></g>
       <g transform="translate(500 360) rotate(20) scale(-1 1)"><ellipse cx="0" cy="0" rx="62" ry="56" fill="url(#graphite)"/><ellipse cx="46" cy="-4" rx="30" ry="28" fill="#3a3a3d"/><circle cx="-12" cy="-10" r="12" fill="#ff4d00" opacity=".9"/></g>`
    : ''
  return `${shadow(400, 760, 220, 22)}${pill}${buds}`
}

function dock({ withPhone = false }) {
  const phone = withPhone ? `<g transform="translate(300 420) rotate(-12) scale(.5)">${phoneBack({ x: 0, y: 0, finish: 'url(#graphite)' }).replace(/^<g transform="[^"]*">/, '<g>')}</g>` : ''
  return `${shadow(400, 830, 300, 24)}
    <path d="M110 760 L690 760 L660 820 L140 820 Z" fill="url(#silver-h)"/>
    <rect x="110" y="740" width="580" height="30" rx="14" fill="url(#silver)"/>
    <path d="M250 740 L290 400 Q294 380 314 380 L336 380 Q356 380 352 400 L330 740 Z" fill="url(#silver-h)"/>
    <circle cx="300" cy="450" r="90" fill="url(#silver)"/><circle cx="300" cy="450" r="60" fill="#dcdde0"/>
    <rect x="470" y="600" width="90" height="140" rx="20" fill="url(#silver-h)"/><circle cx="515" cy="620" r="36" fill="#f0f0f1"/>
    <ellipse cx="620" cy="738" rx="54" ry="10" fill="#c7c8cc"/>
    ${phone}`
}

// --- Compositions ----------------------------------------------------------

const art = {
  'airpods-5': [
    () => `${airpodsCase({ open: true })}${bud({ x: 330, y: 330, rotate: -14, scale: 0.72 })}${bud({ x: 470, y: 330, rotate: 14, scale: 0.72, mirror: true })}`,
    () => `${shadow(400, 860, 210, 20, 0.2)}${bud({ x: 300, y: 330, rotate: -24, scale: 1.25 })}${bud({ x: 520, y: 440, rotate: 18, scale: 1.25, mirror: true })}`,
  ],
  'iphone-17-pro': [
    () => `${shadow(400, 880, 220, 22)}${phoneBack({ rotate: -6 })}`,
    () => `${shadow(420, 880, 240, 22)}${phoneBack({ x: 470, y: 480, rotate: 8 })}${phoneFront({ x: 330, y: 520, rotate: -6 })}`,
  ],
  'apple-watch-series-11': [
    () => `${shadow(400, 900, 180, 18, 0.18)}${watch({})}`,
    () => `${shadow(400, 900, 180, 18, 0.18)}${watch({ rotate: -18, band: '#d9d2c5', caseFill: 'url(#titanium)' })}`,
  ],
  'macbook-air-15': [laptopOpen, laptopClosed],
  'ipad-air-13': [() => tablet({ front: true, rotate: -4 }), () => tablet({ front: false, rotate: 6 })],
  'mono-charge-35w': [() => charger({}), () => charger({ withCable: true, rotate: -10 })],
  'mono-studio-headphones': [() => headphones({ tone: 'graphite' }), () => headphones({ tone: 'sand' })],
  'mono-cell-20k': [() => powerbank({}), () => powerbank({ rotate: 14 })],
  'mono-cable-braided': [() => cable({}), () => cable({ close: true })],
  'mono-sleeve-15': [() => sleeve({}), () => sleeve({ withLaptop: true })],
  'mono-pad-controller': [() => controller({}), () => controller({ rotate: -14 })],
  'mono-home-hub': [() => speaker({}), () => speaker({ top: true })],
  'mono-buds-lite': [() => budsLite({ open: true }), () => budsLite({ open: false })],
  'mono-dock-3in1': [() => dock({}), () => dock({ withPhone: true })],
}

for (const [slug, views] of Object.entries(art)) {
  views.forEach((view, index) => writeFileSync(path.join(OUT, `${slug}-${index + 1}.svg`), svg(view())))
}
console.log(`Generated ${Object.keys(art).length * 2} renders in ${OUT}`)
