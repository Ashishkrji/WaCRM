"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, CheckCircle, Clock, BarChart3, MessageCircle, Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const fullPhoneNumber = `${countryCode}${phone.replace(/\D/g, "")}`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: fullPhoneNumber,
        },
      },
    });

    // Log account creation attempt in MongoDB Atlas
    void fetch("/api/auth/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "signup",
        email,
        fullName,
        userId: data?.user?.id || null,
        status: error ? "failed" : "success",
        error: error ? error.message : null,
      }),
    }).catch((err) => console.error("[Auth/Log] failed:", err));

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center px-4 relative overflow-hidden font-sans">
        {/* Subtle Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.15] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md rounded-2xl border border-slate-900 bg-slate-900/20 p-8 backdrop-blur-xl shadow-2xl relative z-10 text-center space-y-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/15 text-blue-400">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Check your email</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              We&apos;ve sent a confirmation link to <span className="text-white font-semibold">{email}</span>. Please check your inbox and click the link to verify your account.
            </p>
          </div>
          <Link href="/login" className="block">
            <Button
              variant="outline"
              className="w-full h-11 border-slate-900 bg-slate-950/60 text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
            >
              Back to sign in
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center relative overflow-hidden font-sans py-12 px-4 sm:px-8 lg:px-12">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.15] pointer-events-none" />
      
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[250px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[250px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 lg:gap-16 items-center relative z-10">
        
        {/* Left Column: Branding & Features */}
        <div className="md:col-span-6 lg:col-span-7 flex flex-col justify-center space-y-12 text-left">
          <div className="space-y-12">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                <MessageSquare className="h-5.5 w-5.5 text-white" />
              </div>
              <span className="text-2xl font-extrabold text-white tracking-tight">MJChatSyncs</span>
            </div>

            {/* Welcome Headers */}
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold text-white tracking-tight">
                Welcome to <span className="text-blue-500">MJChatSyncs</span>
              </h1>
              <p className="text-slate-400 text-base leading-relaxed">
                Supercharge your WhatsApp marketing with powerful automation tools
              </p>
            </div>

            {/* Feature List */}
            <div className="space-y-6 pt-4">
              {[
                {
                  icon: Clock,
                  title: "Automated Campaigns",
                  desc: "Schedule and automate WhatsApp messages, broadcasts, and follow-ups",
                },
                {
                  icon: BarChart3,
                  title: "Advanced Analytics",
                  desc: "Track message delivery, engagement rates, and campaign performance",
                },
                {
                  icon: MessageCircle,
                  title: "Smart Chat Flows",
                  desc: "Create interactive chat flows with automated responses and triggers",
                },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="shrink-0 h-10 w-10 rounded-xl bg-blue-600/10 border border-blue-500/15 flex items-center justify-center text-blue-400">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1 text-left">
                    <h3 className="text-sm font-bold text-slate-200">{item.title}</h3>
                    <p className="text-xs text-slate-500 leading-normal">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Glassmorphic Form */}
        <div className="md:col-span-6 lg:col-span-5 flex items-center justify-center md:justify-end w-full">
          <div className="w-full max-w-md rounded-2xl border border-slate-900 bg-slate-900/20 p-8 backdrop-blur-xl shadow-2xl relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
            
            <div className="space-y-6 relative z-10">
              <div className="space-y-2 text-center md:text-left">
                <h2 className="text-2xl font-bold text-white tracking-tight">Create your account</h2>
                <p className="text-xs text-slate-500">Enter your details to get started</p>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                    {error}
                  </div>
                )}

                {/* Full Name */}
                <div className="space-y-1.5 text-left">
                  <Label htmlFor="fullName" className="text-xs font-semibold text-slate-400">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-11 border-slate-900 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 focus-visible:border-blue-500 focus-visible:ring-blue-500/10"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5 text-left">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-400">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 border-slate-900 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 focus-visible:border-blue-500 focus-visible:ring-blue-500/10"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5 text-left">
                  <Label htmlFor="password" className="text-xs font-semibold text-slate-400">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 pr-10 border-slate-900 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 focus-visible:border-blue-500 focus-visible:ring-blue-500/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-550 hover:text-slate-400 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5 text-left">
                  <Label htmlFor="phone" className="text-xs font-semibold text-slate-400">
                    Phone Number
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative shrink-0">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="h-11 px-3 border border-slate-900 bg-slate-950/60 text-slate-200 text-xs rounded-lg focus:outline-none focus:border-blue-500 appearance-none cursor-pointer flex items-center pr-8"
                      >
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+971">🇦🇪 +971</option>
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                        <span className="text-[10px]">▼</span>
                      </div>
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="h-11 flex-1 border-slate-900 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 focus-visible:border-blue-500 focus-visible:ring-blue-500/10"
                    />
                  </div>
                </div>

                {/* Terms Link */}
                <p className="text-[11px] text-slate-500 text-left leading-normal pt-1">
                  By creating an account, you agree to our{" "}
                  <Link href="/terms" className="text-blue-500 hover:text-blue-400 transition-colors">
                    Terms and Conditions
                  </Link>
                </p>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] disabled:opacity-50"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>

              {/* Bottom Link */}
              <p className="text-center text-xs text-slate-500">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-bold text-blue-500 hover:text-blue-400 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
