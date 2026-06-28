export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden text-left">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.03] pointer-events-none" />
      
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-8 relative z-10">
        <div className="space-y-2 border-b border-slate-900 pb-6">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Privacy Policy</h1>
          <p className="text-xs text-slate-500">Last updated: June 28, 2026</p>
        </div>

        <div className="space-y-6 text-sm text-slate-400 leading-relaxed">
          <p>
            At MJChatSyncs, we prioritize the privacy and security of our users' data. This Privacy Policy describes how we collect, use, and share information when you use our platform, services, or website.
          </p>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us when creating an account, configuring your WhatsApp Business API, or communicating with our support team. This may include:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-1 text-xs text-slate-500">
              <li>Contact details (e.g., name, email address, phone number).</li>
              <li>Meta API credentials (e.g., Access Tokens, Phone Number IDs).</li>
              <li>Billing and payment information processed securely via Stripe.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. How We Use Your Information</h2>
            <p>
              We use the collected information to operate, maintain, and improve the MJChatSyncs platform. Specifically, we use your data to:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-1 text-xs text-slate-500">
              <li>Process transactions and send related billing notifications.</li>
              <li>Route incoming and outgoing WhatsApp messages via the Meta Cloud API.</li>
              <li>Provide customer support and resolve technical issues.</li>
              <li>Verify accounts and ensure compliance with Meta's developer policies.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Data Security & Encryption</h2>
            <p>
              We implement industry-standard security measures to protect your sensitive data. All Meta API access tokens are encrypted at rest using AES-256-GCM encryption. Communication between your browser and our servers is encrypted using Transport Layer Security (TLS).
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="text-xs text-blue-500">
              Email: support@mjchatsyncs.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
