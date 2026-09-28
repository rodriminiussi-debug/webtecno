import type { Metadata } from 'next'
import { LegalPage } from '@/components/store/legal-page'
import { getSettings } from '@/lib/store'

export const metadata: Metadata = { title: 'Política de privacidad', alternates: { canonical: '/privacy' } }

// Template text: must be reviewed by the store's legal advisor before launch.
export default async function PrivacyPage() {
  const { storeName, contact } = await getSettings()
  return (
    <LegalPage
      title="Política de privacidad"
      updated="septiembre 2026"
      sections={[
        { heading: 'Qué datos recolectamos', body: 'Nombre, email, teléfono, documento y dirección de entrega, sólo para procesar y entregar tu pedido. Si te suscribís al newsletter, guardamos tu email.' },
        { heading: 'Para qué los usamos', body: 'Para gestionar pedidos, emitir facturas, coordinar envíos y, si lo aceptaste, enviarte novedades. No vendemos ni cedemos tus datos a terceros.' },
        { heading: 'Pagos', body: 'Los datos de tarjeta los procesa directamente el proveedor de pagos. ' + storeName + ' nunca los recibe ni los almacena.' },
        { heading: 'Cookies', body: 'Usamos almacenamiento local para recordar tu carrito y cookies técnicas necesarias para el funcionamiento del sitio.' },
        { heading: 'Tus derechos', body: `Podés acceder, rectificar o eliminar tus datos en cualquier momento (Ley 25.326) escribiendo a ${contact.email}.` },
      ]}
    />
  )
}
