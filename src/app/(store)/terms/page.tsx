import type { Metadata } from 'next'
import { LegalPage } from '@/components/store/legal-page'
import { getSettings } from '@/lib/store'

export const metadata: Metadata = { title: 'Términos y condiciones', alternates: { canonical: '/terms' } }

// Template text: must be reviewed by the store's legal advisor before launch.
export default async function TermsPage() {
  const { storeName, contact } = await getSettings()
  return (
    <LegalPage
      title="Términos y condiciones"
      updated="septiembre 2026"
      sections={[
        { heading: 'Alcance', body: `Estos términos regulan el uso del sitio y las compras realizadas en ${storeName}. Al confirmar un pedido aceptás estas condiciones.` },
        { heading: 'Precios y stock', body: 'Los precios están expresados en pesos argentinos e incluyen IVA. El precio y la disponibilidad se confirman al procesar el pedido; si un producto se agota durante la compra te avisamos antes de cobrar.' },
        { heading: 'Pagos', body: 'Los pagos con tarjeta se procesan a través de proveedores certificados. No almacenamos datos de tarjetas. Las transferencias se acreditan al recibir el comprobante.' },
        { heading: 'Envíos', body: 'Los plazos de entrega son estimados y corren desde la acreditación del pago. El riesgo del producto se transfiere al momento de la entrega.' },
        { heading: 'Derecho de arrepentimiento', body: 'Según la Ley 24.240 podés revocar la compra dentro de los 10 días corridos desde la entrega, con el producto sin uso y en su empaque original. Podés solicitarlo desde el botón de arrepentimiento, en la sección Soporte.' },
        { heading: 'Garantía', body: 'Todos los productos cuentan con garantía legal y, cuando corresponde, garantía oficial del fabricante por 12 meses.' },
        { heading: 'Contacto', body: `Para cualquier consulta escribinos a ${contact.email}.` },
      ]}
    />
  )
}
