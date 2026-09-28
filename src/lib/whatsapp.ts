// Consultative selling: prices are shared over WhatsApp instead of on the site.

export const DEFAULT_WHATSAPP_TEMPLATE =
  '¡Hola {tienda}! Vi {producto}{opcion} en la web y quería consultar el precio y la disponibilidad. {link}'

export const GENERAL_WHATSAPP_MESSAGE = '¡Hola {tienda}! Estoy mirando la web y quería hacer una consulta.'

export function fillTemplate(template: string, values: { store: string; product?: string; option?: string | null; link?: string }) {
  return template
    .replaceAll('{tienda}', values.store)
    .replaceAll('{producto}', values.product ?? 'un producto')
    .replaceAll('{opcion}', values.option ? ` (${values.option})` : '')
    .replaceAll('{link}', values.link ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Argentine numbers need the 549 prefix for wa.me; anything non-numeric is stripped. */
export function normalizeWhatsAppNumber(value: string) {
  return value.replace(/\D/g, '')
}

export function whatsappUrl(number: string, text: string) {
  return `https://wa.me/${normalizeWhatsAppNumber(number)}?text=${encodeURIComponent(text)}`
}
