export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden text-left">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.03] pointer-events-none" />
      
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-8 relative z-10">
        <div className="space-y-2 border-b border-slate-900 pb-6">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Terms of Service</h1>
          <p className="text-xs text-slate-500">Last updated: June 28, 2026</p>
        </div>

        <div className="space-y-6 text-sm text-slate-400 leading-relaxed">
          <p>
            By accessing or using the MJChatSyncs platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
          </p>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Account Registration & Use</h2>
            <p>
              To use MJChatSyncs, you must register for an account and provide accurate, current, and complete information. You are responsible for safeguarding your account credentials and for any activities or actions under your account.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Meta API & WhatsApp Policies</h2>
            <p>
              MJChatSyncs integrates with the official Meta WhatsApp Business Cloud API. By using our platform, you agree to comply fully with:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-1 text-xs text-slate-500">
              <li>WhatsApp Business Terms of Service.</li>
              <li>WhatsApp Commerce Policy.</li>
              <li>Meta Developer Policies.</li>
            </ul>
            <p className="text-xs text-red-400">
              Note: Any violation of Meta's policies leading to the suspension of your WhatsApp Business Account is your sole responsibility.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Fees & Subscription Billing</h2>
            <p>
              Some parts of the services are billed on a subscription basis. You will be billed in advance on a recurring and periodic basis (monthly or annually). All fees are exclusive of taxes, and you are responsible for paying any applicable taxes.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Limitation of Liability</h2>
            <p>
              In no event shall MJChatSyncs, its directors, employees, or partners, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
