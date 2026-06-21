"use client";

import { useEffect, useState, useRef, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  ShieldAlert, 
  PenTool, 
  QrCode, 
  Loader2, 
  CreditCard,
  Building,
  Check,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";

interface QuoteItem {
  desc: string;
  qty?: number;
  price: number;
}

interface QuoteDetails {
  id: string;
  service_required: string;
  items: QuoteItem[];
  total_amount: number;
  status: "pending" | "generated" | "paid" | "sent" | "failed";
  client_signature?: string;
  signed_at?: string;
  paid_at?: string;
  created_at: string;
  contacts?: {
    name?: string;
    company?: string;
    phone?: string;
  };
}

export default function PublicQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [quote, setQuote] = useState<QuoteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [paying, setPaying] = useState(false);
  const [signatureText, setSignatureText] = useState("");
  const [activePaymentMethod, setActivePaymentMethod] = useState<"upi" | "card">("upi");

  useEffect(() => {
    fetchQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchQuote() {
    try {
      setLoading(true);
      const res = await fetch(`/api/public/quote?id=${id}`);
      if (!res.ok) throw new Error("Could not find quotation");
      const data = await res.json();
      setQuote(data.quote);
    } catch (err: any) {
      console.error(err);
      toast.error("Error loading quotation.");
    } finally {
      setLoading(false);
    }
  }

  const handleSignQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatureText.trim()) {
      toast.error("Please enter your name to digitally sign.");
      return;
    }

    setSigning(true);
    try {
      const res = await fetch("/api/public/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, signature: signatureText.trim(), action: "sign" }),
      });

      if (!res.ok) throw new Error("Quotation signature failed");

      toast.success("Quote digitally signed! Select a payment method below to complete payment.");
      setSignatureText("");
      fetchQuote();
    } catch (err: any) {
      toast.error(err.message || "Failed to sign quote");
    } finally {
      setSigning(false);
    }
  };

  const handleSimulatePayment = async () => {
    setPaying(true);
    try {
      const res = await fetch("/api/public/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "pay", paymentMethod: activePaymentMethod }),
      });

      if (!res.ok) throw new Error("Payment simulation failed");

      toast.success(`Success! Payment verified successfully via ${activePaymentMethod === "upi" ? "BHIM UPI" : "Stripe Checkout"}.`);
      fetchQuote();
    } catch (err: any) {
      toast.error(err.message || "Failed to complete payment");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-950 text-slate-400">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm">Fetching MaaJanki Web Tech quotation details...</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-950 text-slate-400 p-4">
        <ShieldAlert className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-lg font-bold text-white mb-2">Quotation Unavailable</h2>
        <p className="text-sm max-w-md text-center">
          The requested quotation could not be retrieved. Please check the link or contact MaaJanki Web Tech team.
        </p>
      </div>
    );
  }

  const isSigned = !!quote.client_signature;
  const isPaid = quote.status === "paid";
  
  // GST Tax breakdown calculations
  // Assumes total amount is GST inclusive (18% total: 9% CGST, 9% SGST)
  const baseSubtotal = quote.total_amount / 1.18;
  const cgstAmount = baseSubtotal * 0.09;
  const sgstAmount = baseSubtotal * 0.09;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16 relative overflow-hidden">
      <div className="absolute top-0 left-0 h-[400px] w-full bg-gradient-to-b from-indigo-500/10 to-transparent blur-3xl -z-10" />

      <div className="max-w-4xl mx-auto px-4 pt-10 space-y-8">
        
        {/* Header Agency Branding */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-800/80 pb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-650 flex items-center justify-center rounded-xl font-black text-white text-lg tracking-wider border border-indigo-500/20">
              MJ
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">MaaJanki Web Tech</h2>
              <p className="text-xs text-slate-400">GSTIN: 09AAPCM9422H1Z5 • State Code: 09 (UP)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPaid ? (
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" />
                Invoice Paid
              </Badge>
            ) : isSigned ? (
              <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" />
                Signed - Awaiting Pay
              </Badge>
            ) : (
              <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Pending Signature
              </Badge>
            )}
          </div>
        </div>

        {/* GST Invoice Details */}
        <Card className="bg-slate-900/50 border-slate-850 backdrop-blur-sm shadow-xl">
          <CardHeader className="p-6 border-b border-slate-850 bg-slate-950/20">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest block mb-1">GST INVOICE / QUOTE</span>
                <CardTitle className="text-lg text-white font-extrabold">INV-{quote.id.slice(0, 8).toUpperCase()}</CardTitle>
                <CardDescription className="text-slate-400 text-xs mt-0.5">
                  Date: {new Date(quote.created_at).toLocaleDateString()}
                </CardDescription>
              </div>

              <div className="flex items-start gap-8 text-xs text-slate-400">
                <div>
                  <span className="font-bold text-slate-500 block uppercase text-[9px]">Billed From</span>
                  <p className="font-semibold text-slate-200 mt-1">MaaJanki Web Tech</p>
                  <p className="text-[11px] mt-0.5">Varanasi, Uttar Pradesh, India</p>
                </div>
                <div>
                  <span className="font-bold text-slate-500 block uppercase text-[9px]">Billed To</span>
                  <p className="font-semibold text-slate-200 mt-1">{quote.contacts?.name || "Client"}</p>
                  <p className="text-[11px] mt-0.5">{quote.contacts?.company || "Company Ltd."}</p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Line Items Table */}
            <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950/20 shadow-inner">
              <table className="w-full text-left text-slate-300 text-xs">
                <thead>
                  <tr className="border-b border-slate-850 bg-slate-950/30 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                    <th className="px-4 py-3">Item Description</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Rate</th>
                    <th className="px-4 py-3 text-right">Tax Rate</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60 font-medium">
                  {quote.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/10 transition-colors">
                      <td className="px-4 py-3.5 text-slate-200">
                        {item.desc}
                      </td>
                      <td className="px-4 py-3.5 text-center text-slate-400 font-mono">
                        {item.qty || 1}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono">
                        ₹{item.price.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-500 font-mono">
                        18% GST
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-200 font-mono">
                        ₹{(item.price * (item.qty || 1)).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Breakdown */}
            <div className="flex justify-end pt-2">
              <div className="w-full sm:w-64 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>Subtotal (Net Amount):</span>
                  <span className="font-mono text-slate-350">₹{baseSubtotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>CGST (9%):</span>
                  <span className="font-mono text-slate-350">₹{cgstAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-500 border-b border-slate-850 pb-2">
                  <span>SGST (9%):</span>
                  <span className="font-mono text-slate-350">₹{sgstAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-white font-bold text-sm pt-1">
                  <span>Grand Total (GST Inc.):</span>
                  <span className="font-mono text-emerald-400 text-base">₹{quote.total_amount.toLocaleString("en-IN")}.00</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Action Block: Signature or Payment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Signature Card */}
          <Card className="bg-slate-900/50 border-slate-850 backdrop-blur-sm flex flex-col justify-between">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <PenTool className="h-4.5 w-4.5 text-indigo-400" />
                Electronic Approval Signature
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                To proceed to checkout, please verify and apply your signature.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {isSigned ? (
                <div className="bg-slate-950/40 border border-slate-850/60 rounded-xl p-4 text-center space-y-2 mt-2">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Digital Signature Verified</span>
                  <div className="font-serif italic text-lg text-indigo-400 py-1">
                    {quote.client_signature}
                  </div>
                  <span className="text-[9px] text-slate-600 block">
                    Signed at: {quote.signed_at ? new Date(quote.signed_at).toLocaleString() : ""}
                  </span>
                </div>
              ) : (
                <form onSubmit={handleSignQuote} className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="sig-input" className="text-xs text-slate-400">Type Your Full Name</Label>
                    <Input
                      id="sig-input"
                      value={signatureText}
                      onChange={(e) => setSignatureText(e.target.value)}
                      placeholder="e.g. John Doe"
                      required
                      className="bg-slate-950 border-slate-800 text-white placeholder-slate-700 font-serif italic text-base text-center"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={signing}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                  >
                    {signing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                        Signing Invoice...
                      </>
                    ) : (
                      "Apply Digital Signature"
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Payment Card */}
          <Card className={`bg-slate-900/50 border-slate-850 backdrop-blur-sm transition-all duration-300 ${!isSigned && "opacity-40 pointer-events-none"}`}>
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="h-4.5 w-4.5 text-indigo-400" />
                Instant Gateway Checkout
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Select your payment method and complete the payment instantly.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-4">
              {isPaid ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 text-center space-y-2 mt-2">
                  <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto" />
                  <div>
                    <h4 className="text-sm font-extrabold text-emerald-400">Payment Successfully Completed</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Verification synced to MaaJanki CRM pipeline.</p>
                  </div>
                  <span className="text-[9px] text-slate-650 block font-mono">
                    Paid via UPI at: {quote.paid_at ? new Date(quote.paid_at).toLocaleString() : ""}
                  </span>
                </div>
              ) : (
                <div className="space-y-4 mt-2">
                  {/* Tab selectors */}
                  <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-850 w-fit mx-auto">
                    <Button 
                      variant={activePaymentMethod === "upi" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActivePaymentMethod("upi")}
                      className="text-xs h-7 px-4 rounded"
                    >
                      <QrCode className="h-3 w-3 mr-1" />
                      BHIM UPI QR
                    </Button>
                    <Button 
                      variant={activePaymentMethod === "card" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActivePaymentMethod("card")}
                      className="text-xs h-7 px-4 rounded"
                    >
                      <CreditCard className="h-3 w-3 mr-1" />
                      Card / Stripe
                    </Button>
                  </div>

                  {/* Payment simulation boxes */}
                  {activePaymentMethod === "upi" ? (
                    <div className="flex flex-col items-center justify-center p-3 border border-slate-800 bg-slate-950/30 rounded-xl space-y-2">
                      <div className="bg-white p-2 rounded-lg">
                        {/* Mock QR Code representation */}
                        <div className="grid grid-cols-4 gap-0.5 w-16 h-16 bg-white text-slate-950 font-bold text-center">
                          <div className="border-4 border-slate-950"></div>
                          <div className="bg-slate-950"></div>
                          <div></div>
                          <div className="border-4 border-slate-950"></div>
                          
                          <div></div>
                          <div className="bg-slate-950"></div>
                          <div className="bg-slate-950"></div>
                          <div></div>
                          
                          <div className="bg-slate-950"></div>
                          <div></div>
                          <div className="bg-slate-950"></div>
                          <div className="bg-slate-950"></div>
                          
                          <div className="border-4 border-slate-950"></div>
                          <div></div>
                          <div className="bg-slate-950"></div>
                          <div className="border-4 border-slate-950"></div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 text-center leading-normal">
                        Scan with GPay, PhonePe, or Paytm to pay <strong className="text-slate-200">₹{quote.total_amount.toLocaleString("en-IN")}.00</strong>
                      </span>
                    </div>
                  ) : (
                    <div className="p-4 border border-slate-800 bg-slate-950/20 rounded-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Stripe Gateway</span>
                        <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] px-1.5">Sandbox Mode</Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="h-7 bg-slate-900 border border-slate-800 rounded px-2.5 flex items-center text-xs text-slate-500">
                          4242 •••• •••• 4242
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleSimulatePayment}
                    disabled={paying || !isSigned}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 shadow-lg shadow-emerald-900/10"
                  >
                    {paying ? (
                      <>
                        <Loader2 className="h-4.5 w-4.5 animate-spin mr-2" />
                        Verifying payment...
                      </>
                    ) : (
                      `Simulate Customer Pay (₹${quote.total_amount.toLocaleString("en-IN")})`
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
