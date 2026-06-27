/**
 * GST Calculator
 * Computes CGST/SGST/IGST/Cess for Indian tax invoices.
 * Handles intra-state (CGST + SGST) and inter-state (IGST) transactions.
 */

export interface LineItemInput {
  description: string
  hsn_sac?: string
  quantity: number
  rate: number
  unit?: string
  discount_pct?: number
  tax_rate?: number          // e.g. 18 = 18%
  is_interstate?: boolean
  cess_rate?: number
}

export interface LineItemCalculated extends LineItemInput {
  discount_amount: number
  taxable_value: number
  cgst_rate: number
  sgst_rate: number
  igst_rate: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  cess_amount: number
  total_amount: number
}

export interface InvoiceCalculated {
  items: LineItemCalculated[]
  subtotal: number
  discount_amount: number
  taxable_value: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  cess_amount: number
  total_tax: number
  shipping_charges: number
  grand_total: number
  amount_in_words: string
  is_interstate: boolean
}

// ─────────────────────────────────────────────
// Standard GST Slabs
// ─────────────────────────────────────────────

export const GST_SLABS = [0, 0.1, 0.25, 1, 1.5, 3, 5, 7.5, 12, 18, 28] as const
export type GSTSlab = typeof GST_SLABS[number]

// ─────────────────────────────────────────────
// Line Item Calculator
// ─────────────────────────────────────────────

export function calculateLineItem(item: LineItemInput, isInterstate?: boolean): LineItemCalculated {
  const taxRate = item.tax_rate ?? 18
  const interstate = isInterstate ?? item.is_interstate ?? false
  const cessRate = item.cess_rate ?? 0

  const grossAmount = round2(item.quantity * item.rate)
  const discountPct = item.discount_pct ?? 0
  const discountAmount = round2(grossAmount * discountPct / 100)
  const taxableValue = round2(grossAmount - discountAmount)

  const cgstRate = interstate ? 0 : round2(taxRate / 2)
  const sgstRate = interstate ? 0 : round2(taxRate / 2)
  const igstRate = interstate ? taxRate : 0

  const cgstAmount = round2(taxableValue * cgstRate / 100)
  const sgstAmount = round2(taxableValue * sgstRate / 100)
  const igstAmount = round2(taxableValue * igstRate / 100)
  const cessAmount = round2(taxableValue * cessRate / 100)

  const totalAmount = round2(taxableValue + cgstAmount + sgstAmount + igstAmount + cessAmount)

  return {
    ...item,
    discount_amount: discountAmount,
    taxable_value: taxableValue,
    cgst_rate: cgstRate,
    sgst_rate: sgstRate,
    igst_rate: igstRate,
    cgst_amount: cgstAmount,
    sgst_amount: sgstAmount,
    igst_amount: igstAmount,
    cess_amount: cessAmount,
    total_amount: totalAmount,
  }
}

// ─────────────────────────────────────────────
// Full Invoice Calculator
// ─────────────────────────────────────────────

export function calculateInvoice(
  items: LineItemInput[],
  options: {
    isInterstate?: boolean
    shippingCharges?: number
    shippingTaxRate?: number
    globalDiscount?: number
  } = {},
): InvoiceCalculated {
  const { isInterstate = false, shippingCharges = 0, shippingTaxRate = 18, globalDiscount = 0 } = options

  const calculatedItems = items.map(item => calculateLineItem(item, isInterstate))

  const subtotal = round2(calculatedItems.reduce((s, i) => s + round2(i.quantity * i.rate), 0))
  const discountAmount = round2(calculatedItems.reduce((s, i) => s + i.discount_amount, 0) + globalDiscount)
  const taxableValue = round2(calculatedItems.reduce((s, i) => s + i.taxable_value, 0))
  const cgstAmount = round2(calculatedItems.reduce((s, i) => s + i.cgst_amount, 0))
  const sgstAmount = round2(calculatedItems.reduce((s, i) => s + i.sgst_amount, 0))
  const igstAmount = round2(calculatedItems.reduce((s, i) => s + i.igst_amount, 0))
  const cessAmount = round2(calculatedItems.reduce((s, i) => s + i.cess_amount, 0))

  // Shipping charges with GST
  const shippingTaxable = shippingCharges
  const shippingTax = round2(shippingTaxable * shippingTaxRate / 100)
  const totalShipping = round2(shippingCharges + shippingTax)

  const totalTax = round2(cgstAmount + sgstAmount + igstAmount + cessAmount + shippingTax)
  const grandTotal = round2(taxableValue + totalTax + totalShipping)

  return {
    items: calculatedItems,
    subtotal,
    discount_amount: discountAmount,
    taxable_value: taxableValue,
    cgst_amount: cgstAmount,
    sgst_amount: sgstAmount,
    igst_amount: igstAmount,
    cess_amount: cessAmount,
    total_tax: totalTax,
    shipping_charges: shippingCharges,
    grand_total: grandTotal,
    amount_in_words: numberToWords(grandTotal),
    is_interstate: isInterstate,
  }
}

// ─────────────────────────────────────────────
// State Code to Name Mapping
// ─────────────────────────────────────────────

export const STATE_CODES: Record<string, string> = {
  '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
  '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana',
  '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
  '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
  '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam',
  '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha',
  '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '25': 'Daman & Diu', '26': 'Dadra & Nagar Haveli',
  '27': 'Maharashtra', '28': 'Andhra Pradesh (Old)',
  '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep',
  '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands', '36': 'Telangana',
  '37': 'Andhra Pradesh', '38': 'Ladakh', '97': 'Other Territory',
  '99': 'Centre Jurisdiction',
}

/**
 * Check if two state codes are the same (intra-state transaction).
 */
export function isIntraState(sellerStateCode: string, buyerStateCode: string): boolean {
  return sellerStateCode.slice(0, 2) === buyerStateCode.slice(0, 2)
}

/**
 * Validate GSTIN format (15 chars, specific pattern).
 */
export function validateGSTIN(gstin: string): boolean {
  const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  return pattern.test(gstin.toUpperCase())
}

/**
 * Extract state code from GSTIN.
 */
export function stateCodeFromGSTIN(gstin: string): string {
  return gstin.slice(0, 2)
}

/**
 * Extract PAN from GSTIN.
 */
export function panFromGSTIN(gstin: string): string {
  return gstin.slice(2, 12)
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function wordsForLessThanThousand(n: number): string {
  if (n < 20) return ONES[n]
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '')
  return ONES[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + wordsForLessThanThousand(n % 100) : '')
}

export function numberToWords(amount: number): string {
  const rupees = Math.floor(amount)
  const paise = Math.round((amount - rupees) * 100)

  if (rupees === 0 && paise === 0) return 'Zero Rupees Only'

  let result = ''
  if (rupees > 0) {
    if (rupees >= 10000000) result += wordsForLessThanThousand(Math.floor(rupees / 10000000)) + ' Crore '
    if (rupees % 10000000 >= 100000) result += wordsForLessThanThousand(Math.floor((rupees % 10000000) / 100000)) + ' Lakh '
    if (rupees % 100000 >= 1000) result += wordsForLessThanThousand(Math.floor((rupees % 100000) / 1000)) + ' Thousand '
    if (rupees % 1000 > 0) result += wordsForLessThanThousand(rupees % 1000)
    result = result.trim() + ' Rupees'
  }
  if (paise > 0) result += (rupees > 0 ? ' and ' : '') + wordsForLessThanThousand(paise) + ' Paise'
  return result + ' Only'
}
