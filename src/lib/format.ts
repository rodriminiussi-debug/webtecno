const formatters = new Map<string, Intl.NumberFormat>()

export function formatMoney(cents: number, currency = 'ARS', locale = 'es-AR') {
  const key = `${locale}:${currency}`
  let formatter = formatters.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      // ARS prices are shown without cents; the value is still stored in cents
      minimumFractionDigits: 0,
      maximumFractionDigits: currency === 'ARS' ? 0 : 2,
    })
    formatters.set(key, formatter)
  }
  return formatter.format(cents / 100)
}

export function formatDate(iso: string, options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }) {
  return new Intl.DateTimeFormat('es-AR', options).format(new Date(iso))
}

export function formatDateTime(iso: string) {
  return formatDate(iso, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('es-AR').format(value)
}

export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}
