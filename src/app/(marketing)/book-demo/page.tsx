"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, CheckCircle2, Clock, Calendar, MessageSquare, ArrowLeft, ArrowRight } from "lucide-react";

export default function BookDemoPage() {
  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    phone: "",
    email: "",
    businessModel: "",
    primaryGoal: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate API request
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setSubmitting(false);
    setSubmitted(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-x-hidden">
      <div className="grid lg:grid-cols-12 gap-12 items-center w-full">
        {/* Left Side: Information */}
        <div className="lg:col-span-5 space-y-8 text-left">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors">
              <ArrowLeft className="h-3 w-3" /> Back to Home
            </Link>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Book a <span className="text-blue-500">Strategy Call</span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Schedule a 30-minute business audit with our automation architects. We'll map out your flows, audit your current setups, and show you how WaCRM can scale your operations.
            </p>
          </div>

          <div className="border-t border-slate-900 pt-6 space-y-6">
            {[
              { icon: <Clock className="h-5 w-5 text-blue-400" />, title: "30-Minute Business Audit", desc: "We'll analyze your current customer acquisition and support channels." },
              { icon: <MessageSquare className="h-5 w-5 text-emerald-400" />, title: "Interactive AI Demo", desc: "We'll show you how the RAG AI chatbot interacts with your website data live." },
              { icon: <Calendar className="h-5 w-5 text-purple-400" />, title: "Custom Automation Roadmap", desc: "We'll map out the exact sequences and integrations needed for your business." },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="shrink-0 p-2.5 h-10 w-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">{item.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Form / Success State */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-slate-900 bg-slate-900/10 p-8 sm:p-10 backdrop-blur-sm relative">
            <div className="absolute inset-0 bg-blue-600/5 blur-[60px] rounded-full pointer-events-none -z-10" />

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-6 text-left">
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-xs font-semibold text-slate-400">Full Name</label>
                    <input
                      required
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Ashish Kumar"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 placeholder-slate-6550 focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Business Name */}
                  <div className="space-y-2">
                    <label htmlFor="businessName" className="text-xs font-semibold text-slate-400">Business Name</label>
                    <input
                      required
                      type="text"
                      id="businessName"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      placeholder="My Enterprise"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 placeholder-slate-6550 focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  {/* WhatsApp Number */}
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-xs font-semibold text-slate-400">WhatsApp Number (with country code)</label>
                    <input
                      required
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 placeholder-slate-6550 focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Business Email */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-xs font-semibold text-slate-400">Business Email</label>
                    <input
                      required
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="ashish@business.com"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 placeholder-slate-6550 focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Business Model */}
                  <div className="space-y-2">
                    <label htmlFor="businessModel" className="text-xs font-semibold text-slate-400">Business Model</label>
                    <select
                      required
                      id="businessModel"
                      name="businessModel"
                      value={formData.businessModel}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300 focus:border-blue-500 focus:outline-none transition-colors appearance-none"
                    >
                      <option value="" disabled>Select business model</option>
                      <option value="d2c">D2C E-commerce</option>
                      <option value="coaching">Coaching & Education</option>
                      <option value="agency">Agency / Consulting</option>
                      <option value="local">Local Business</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Primary Goal */}
                  <div className="space-y-2">
                    <label htmlFor="primaryGoal" className="text-xs font-semibold text-slate-400">Primary Goal</label>
                    <select
                      required
                      id="primaryGoal"
                      name="primaryGoal"
                      value={formData.primaryGoal}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300 focus:border-blue-500 focus:outline-none transition-colors appearance-none"
                    >
                      <option value="" disabled>Select primary goal</option>
                      <option value="leads">Lead Generation / Qualification</option>
                      <option value="support">Customer Support Automation</option>
                      <option value="marketing">Broadcast Marketing Campaigns</option>
                      <option value="ai">Custom AI Chatbot (RAG)</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full font-semibold text-white bg-blue-600 hover:bg-blue-500 py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.45)] disabled:opacity-50 transition-all flex items-center justify-center gap-2 group"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      Schedule Strategy Call
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">Call Requested Successfully!</h3>
                  <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                    Thank you, <span className="text-white font-semibold">{formData.name}</span>. We have received your details for <span className="text-white font-semibold">{formData.businessName}</span>.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-900 bg-slate-950 p-4 w-full max-w-sm text-xs text-slate-400 leading-relaxed">
                  Our automation architect will reach out to you on WhatsApp at <span className="text-blue-400 font-semibold">{formData.phone}</span> within the next 2 hours to confirm your meeting slot.
                </div>
                <Link
                  href="/"
                  className="font-semibold text-xs text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Home Page
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
