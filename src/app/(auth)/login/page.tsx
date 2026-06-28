"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, BarChart3, Calendar, Mail, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const supabase = createClient();

  useEffect(() => {
    if (searchParams.get("error") === "suspended") {
      setError("Your account has been deactivated or suspended. Please contact system support.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Log login attempt in MongoDB Atlas
    void fetch("/api/auth/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "login",
        email,
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

    if (inviteToken) {
      router.push(`/join/${encodeURIComponent(inviteToken)}`);
    } else {
      router.push("/dashboard");
    }
  };

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
              <h1 className="text-4xl font-extrabold text-white tracking-tight">Welcome back!</h1>
              <p className="text-slate-400 text-base leading-relaxed">
                Sign in to manage your marketing campaigns
              </p>
            </div>

            {/* Feature List */}
            <div className="space-y-6 pt-4">
              {[
                {
                  icon: Mail,
                  title: "Campaign Dashboard",
                  desc: "Access all your WhatsApp campaigns in one place",
                },
                {
                  icon: BarChart3,
                  title: "Real-time Analytics",
                  desc: "Monitor your campaign performance live",
                },
                {
                  icon: Calendar,
                  title: "Scheduled Messages",
                  desc: "View and manage your automated message queue",
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
                <h2 className="text-2xl font-bold text-white tracking-tight">Sign in to your account</h2>
                <p className="text-xs text-slate-500">Enter your credentials to continue</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                    {error}
                  </div>
                )}

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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold text-slate-400">
                      Password
                    </Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 pr-10 border-slate-900 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 focus-visible:border-blue-500 focus-visible:ring-blue-500/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex justify-end pt-1">
                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-blue-500 hover:text-blue-400 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full mt-2 font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              {/* Bottom Link */}
              <p className="text-center text-xs text-slate-500">
                Don&apos;t have an account?{" "}
                <Link
                  href={
                    inviteToken
                      ? `/signup?invite=${encodeURIComponent(inviteToken)}`
                      : "/signup"
                  }
                  className="font-bold text-blue-500 hover:text-blue-400 transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-400 font-mono text-xs">
        Loading...
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
