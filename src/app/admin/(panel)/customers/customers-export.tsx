'use client'

import { Button } from '@/components/ui/button'

/** CSV export built client-side from data already on the page: no extra endpoint needed. */
export function CustomersExport({ rows, filename = 'clientes.csv', headers = ['Nombre', 'Email', 'Teléfono', 'Pedidos', 'Total gastado'] }: { rows: string[][]; filename?: string; headers?: string[] }) {
  const download = () => {
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
    const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n')
    // BOM so Excel opens accents correctly
    const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }
  return (
    <Button size="sm" variant="secondary" onClick={download} disabled={!rows.length}>
      Exportar CSV
    </Button>
  )
}
