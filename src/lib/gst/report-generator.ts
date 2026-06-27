/**
 * GST Report Generator
 * Builds GSTR-1 and GSTR-3B format data for filing.
 */

import { supabaseAdmin } from '@/lib/automations/admin-client'

// ─────────────────────────────────────────────
// GSTR-1 (Outward Supplies)
// ─────────────────────────────────────────────

export interface GSTR1Data {
  period: { month: number; year: number }
  gstin: string
  b2b: B2BInvoice[]          // Business to Business (with GSTIN)
  b2c: B2CInvoice[]          // Business to Consumer (without GSTIN)
  cdnr: CDNRInvoice[]        // Credit/Debit Notes
  exp: ExportInvoice[]       // Export invoices
  summary: GSTR1Summary
}

interface B2BInvoice {
  ctin: string               // Customer GSTIN
  inv: Array<{
    inum: string             // Invoice number
    idt: string              // Invoice date (DD-MM-YYYY)
    val: number              // Invoice value
    pos: string              // Place of supply (state code)
    rchrg: string            // Reverse charge (Y/N)
    inv_typ: string          // Invoice type
    itms: Array<{
      num: number
      itm_det: {
        txval: number        // Taxable value
        irt: number          // Integrated rate
        iamt: number         // Integrated tax amount
        crt: number          // Central rate
        camt: number         // Central tax amount
        srt: number          // State rate
        samt: number         // State tax amount
        csamt: number        // Cess amount
      }
    }>
  }>
}

interface B2CInvoice {
  sply_ty: string            // "INTER" or "INTRA"
  pos: string                // Place of supply
  typ: string
  itms: Array<{
    num: number
    itm_det: { txval: number; irt: number; iamt: number; crt: number; camt: number; srt: number; samt: number; csamt: number }
  }>
}

interface CDNRInvoice {
  ctin: string
  nt: Array<{
    ntty: string             // "C" credit or "D" debit
    nt_num: string
    nt_dt: string
    val: number
    itms: Array<{ num: number; itm_det: { txval: number; irt: number; iamt: number; crt: number; camt: number; srt: number; samt: number; csamt: number } }>
  }>
}

interface ExportInvoice {
  exp_typ: string
  inv: Array<{ inum: string; idt: string; val: number; sbpcode: string; sbnum: string; sbdt: string; itms: unknown[] }>
}

interface GSTR1Summary {
  total_taxable_value: number
  total_cgst: number
  total_sgst: number
  total_igst: number
  total_cess: number
  total_tax: number
  total_invoices: number
}

// ─────────────────────────────────────────────
// GSTR-3B (Monthly Summary Return)
// ─────────────────────────────────────────────

export interface GSTR3BData {
  period: { month: number; year: number }
  gstin: string
  outward_taxable_supplies: {
    total_taxable_value: number
    integrated_tax: number
    central_tax: number
    state_ut_tax: number
    cess: number
  }
  inward_taxable_supplies: {
    total_taxable_value: number
    integrated_tax: number
    central_tax: number
    state_ut_tax: number
    cess: number
  }
  itc_available: {
    integrated_tax: number
    central_tax: number
    state_ut_tax: number
    cess: number
  }
  tax_payable: {
    integrated_tax: number
    central_tax: number
    state_ut_tax: number
    cess: number
  }
  interest_late_fee: {
    interest: number
    late_fee: number
  }
}

// ─────────────────────────────────────────────
// Generator functions
// ─────────────────────────────────────────────

export async function generateGSTR1(userId: string, month: number, year: number, gstin: string): Promise<GSTR1Data> {
  const db = supabaseAdmin()

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0] // Last day of month

  const { data: invoices } = await db
    .from('gst_invoices')
    .select('*, gst_invoice_items(*)')
    .eq('user_id', userId)
    .gte('invoice_date', startDate)
    .lte('invoice_date', endDate)
    .in('status', ['sent', 'paid', 'partially_paid'])

  const allInvoices = invoices ?? []

  const b2bInvoices = allInvoices.filter((inv) => inv.buyer_gstin && inv.invoice_type !== 'credit_note' && inv.invoice_type !== 'debit_note')
  const b2cInvoices = allInvoices.filter((inv) => !inv.buyer_gstin && inv.invoice_type !== 'credit_note' && inv.invoice_type !== 'debit_note')
  const cdnInvoices = allInvoices.filter((inv) => inv.invoice_type === 'credit_note' || inv.invoice_type === 'debit_note')

  // Build B2B
  const b2b = buildB2B(b2bInvoices, gstin)

  // Build B2CS (simplified B2C)
  const b2c = buildB2C(b2cInvoices)

  // Build CDNR
  const cdnr = buildCDNR(cdnInvoices)

  // Summary
  const summary: GSTR1Summary = {
    total_taxable_value: sum(allInvoices, 'taxable_value'),
    total_cgst: sum(allInvoices, 'cgst_amount'),
    total_sgst: sum(allInvoices, 'sgst_amount'),
    total_igst: sum(allInvoices, 'igst_amount'),
    total_cess: sum(allInvoices, 'cess_amount'),
    total_tax: sum(allInvoices, 'total_tax'),
    total_invoices: allInvoices.length,
  }

  return { period: { month, year }, gstin, b2b, b2c, cdnr, exp: [], summary }
}

export async function generateGSTR3B(userId: string, month: number, year: number, gstin: string): Promise<GSTR3BData> {
  const db = supabaseAdmin()

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  const { data: invoices } = await db
    .from('gst_invoices')
    .select('taxable_value, cgst_amount, sgst_amount, igst_amount, cess_amount, total_tax')
    .eq('user_id', userId)
    .gte('invoice_date', startDate)
    .lte('invoice_date', endDate)
    .in('status', ['sent', 'paid', 'partially_paid'])

  const allInvoices = invoices ?? []

  const totalTaxable = sum(allInvoices, 'taxable_value')
  const totalIGST = sum(allInvoices, 'igst_amount')
  const totalCGST = sum(allInvoices, 'cgst_amount')
  const totalSGST = sum(allInvoices, 'sgst_amount')
  const totalCess = sum(allInvoices, 'cess_amount')

  return {
    period: { month, year },
    gstin,
    outward_taxable_supplies: {
      total_taxable_value: totalTaxable,
      integrated_tax: totalIGST,
      central_tax: totalCGST,
      state_ut_tax: totalSGST,
      cess: totalCess,
    },
    inward_taxable_supplies: { total_taxable_value: 0, integrated_tax: 0, central_tax: 0, state_ut_tax: 0, cess: 0 },
    itc_available: { integrated_tax: 0, central_tax: 0, state_ut_tax: 0, cess: 0 },
    tax_payable: {
      integrated_tax: totalIGST,
      central_tax: totalCGST,
      state_ut_tax: totalSGST,
      cess: totalCess,
    },
    interest_late_fee: { interest: 0, late_fee: 0 },
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function sum(arr: Array<Record<string, unknown>>, key: string): number {
  return arr.reduce((s, item) => s + (Number(item[key]) || 0), 0)
}

function buildB2B(invoices: Array<Record<string, unknown>>, _gstin: string): B2BInvoice[] {
  const byGstin: Record<string, B2BInvoice> = {}

  for (const inv of invoices) {
    const ctin = String(inv.buyer_gstin || '')
    if (!byGstin[ctin]) byGstin[ctin] = { ctin, inv: [] }
    byGstin[ctin].inv.push({
      inum: String(inv.invoice_number),
      idt: formatDate(String(inv.invoice_date)),
      val: Number(inv.grand_total),
      pos: String(inv.buyer_state_code || '09'),
      rchrg: inv.reverse_charge ? 'Y' : 'N',
      inv_typ: 'R',
      itms: [{
        num: 1,
        itm_det: {
          txval: Number(inv.taxable_value),
          irt: Number(inv.igst_amount) > 0 ? ((Number(inv.igst_amount) / Number(inv.taxable_value)) * 100) : 0,
          iamt: Number(inv.igst_amount),
          crt: Number(inv.cgst_amount) > 0 ? ((Number(inv.cgst_amount) / Number(inv.taxable_value)) * 100) : 0,
          camt: Number(inv.cgst_amount),
          srt: Number(inv.sgst_amount) > 0 ? ((Number(inv.sgst_amount) / Number(inv.taxable_value)) * 100) : 0,
          samt: Number(inv.sgst_amount),
          csamt: Number(inv.cess_amount),
        },
      }],
    })
  }

  return Object.values(byGstin)
}

function buildB2C(invoices: Array<Record<string, unknown>>): B2CInvoice[] {
  if (invoices.length === 0) return []
  const totalTaxable = sum(invoices, 'taxable_value')
  const totalIGST = sum(invoices, 'igst_amount')
  const totalCGST = sum(invoices, 'cgst_amount')
  const totalSGST = sum(invoices, 'sgst_amount')
  const totalCess = sum(invoices, 'cess_amount')

  return [{
    sply_ty: totalIGST > 0 ? 'INTER' : 'INTRA',
    pos: '09',
    typ: 'OE',
    itms: [{ num: 1, itm_det: { txval: totalTaxable, irt: 0, iamt: totalIGST, crt: 0, camt: totalCGST, srt: 0, samt: totalSGST, csamt: totalCess } }],
  }]
}

function buildCDNR(invoices: Array<Record<string, unknown>>): CDNRInvoice[] {
  const byGstin: Record<string, CDNRInvoice> = {}
  for (const inv of invoices) {
    const ctin = String(inv.buyer_gstin || 'URP')
    if (!byGstin[ctin]) byGstin[ctin] = { ctin, nt: [] }
    byGstin[ctin].nt.push({
      ntty: inv.invoice_type === 'credit_note' ? 'C' : 'D',
      nt_num: String(inv.invoice_number),
      nt_dt: formatDate(String(inv.invoice_date)),
      val: Number(inv.grand_total),
      itms: [],
    })
  }
  return Object.values(byGstin)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
}
