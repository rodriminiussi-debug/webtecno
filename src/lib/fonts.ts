import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { IBM_Plex_Sans, Instrument_Sans, Manrope } from 'next/font/google'

// Declared up front because next/font is resolved at build time. Browsers only
// download the family that the active theme actually references.
const instrument = Instrument_Sans({ subsets: ['latin'], variable: '--font-instrument', display: 'swap' })
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' })
const plex = IBM_Plex_Sans({ subsets: ['latin'], weight: ['300', '400', '500', '600'], variable: '--font-plex', display: 'swap' })

export const fontVariables = [GeistSans.variable, GeistMono.variable, instrument.variable, manrope.variable, plex.variable].join(' ')
