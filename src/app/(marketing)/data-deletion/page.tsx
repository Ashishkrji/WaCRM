export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden text-left">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.03] pointer-events-none" />
      
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-8 relative z-10">
        <div className="space-y-2 border-b border-slate-900 pb-6">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Data Deletion Policy</h1>
          <p className="text-xs text-slate-500">Last updated: June 28, 2026</p>
        </div>

        <div className="space-y-6 text-sm text-slate-400 leading-relaxed">
          <p>
            MJChatSyncs respects your right to privacy and control over your personal data. In compliance with the General Data Protection Regulation (GDPR) and Meta's developer data policies, we provide a clear and easy way for users to request the permanent deletion of their data.
          </p>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">What Data is Deleted?</h2>
            <p>
              When a data deletion request is processed, the following information will be permanently removed from our databases:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-1 text-xs text-slate-500">
              <li>Your user profile, email address, and account credentials.</li>
              <li>Stored WhatsApp access tokens and configurations.</li>
              <li>Sync history, contact lists, and message logs.</li>
              <li>MongoDB Atlas AI training documents and chat logs.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">How to Submit a Request</h2>
            <p>
              You can request data deletion using either of the following methods:
            </p>
            
            <div className="space-y-3 pl-4 pt-2">
              <div>
                <h4 className="text-xs font-bold text-slate-200">Method 1: In-App Settings (Recommended)</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Log in to your MJChatSyncs dashboard, navigate to <strong>Settings &rarr; Account</strong>, and click on the <strong>Delete Account Permanently</strong> button. You will be asked to confirm your password.
                </p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Method 2: Email Request</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Send an email to <span className="text-blue-500">support@mjchatsyncs.com</span> with the subject line "Data Deletion Request". Please send the email from the address associated with your MJChatSyncs account.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">Data Retention</h2>
            <p>
              Please note that some billing and transaction records may be retained for legal, auditing, and tax compliance purposes as required by local laws.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
