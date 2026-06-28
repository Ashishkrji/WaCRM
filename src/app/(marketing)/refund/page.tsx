export default function RefundPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden text-left">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.03] pointer-events-none" />
      
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-8 relative z-10">
        <div className="space-y-2 border-b border-slate-900 pb-6">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Refund Policy</h1>
          <p className="text-xs text-slate-500">Last updated: June 28, 2026</p>
        </div>

        <div className="space-y-6 text-sm text-slate-400 leading-relaxed">
          <h2 className="text-lg font-bold text-white">15-Day Money-Back Guarantee</h2>
          <p>
            At MJChatSyncs, we want to ensure you are 100% satisfied with your purchase. If you have any technical or billing queries, please do not hesitate to contact us.
          </p>
          <p>
            If you feel that the service you purchased is not the best fit for your requirements, we offer a <strong>15-day money-back guarantee</strong> on all subscription plans.
          </p>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">Eligibility Conditions</h2>
            <p>
              To be eligible for a refund, you must submit your request within 15 calendar days of your initial subscription payment. Please note:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-1 text-xs text-slate-500">
              <li>Refunds do not apply to subsequent renewal payments (monthly or annual).</li>
              <li>Any conversation charges billed directly by Meta (Facebook) are non-refundable through MJChatSyncs.</li>
              <li>Accounts suspended due to violations of Meta's WhatsApp Spam Policies are not eligible for a refund.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">How to Request a Refund</h2>
            <p>
              To request a refund, please send an email to <span className="text-blue-500">support@mjchatsyncs.com</span> with your account details, transaction receipt, and the reason for your cancellation.
            </p>
            <p>
              Once approved, your refund will be processed, and a credit will automatically be applied to your original method of payment within 5 to 10 business days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
