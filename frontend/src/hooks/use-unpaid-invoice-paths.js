import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import { getMyInstitutionInvoices } from "@/services/institutionService.js"

const SETTLED = ["paid", "cancelled", "refunded"]

export function useUnpaidInvoicePaths(enabled = true) {
  const invoicesQuery = useQuery({
    queryKey: ["institution-invoices"],
    queryFn: getMyInstitutionInvoices,
    enabled,
    retry: 1,
  })

  return useMemo(() => {
    const byCertificationId = new Map()
    const list = Array.isArray(invoicesQuery.data) ? invoicesQuery.data : []
    const unpaid = list
      .filter((invoice) => !SETTLED.includes(String(invoice.status ?? "").toLowerCase()))
      .sort((a, b) => new Date(b.issuedAt ?? 0) - new Date(a.issuedAt ?? 0))
    for (const invoice of unpaid) {
      for (const item of invoice.items ?? []) {
        if (item.certificationId != null && !byCertificationId.has(item.certificationId)) {
          byCertificationId.set(item.certificationId, `/institution/invoices/${invoice.institutionInvoiceId}`)
        }
      }
    }
    return (certificationId) => byCertificationId.get(certificationId) ?? "/institution/invoices"
  }, [invoicesQuery.data])
}
