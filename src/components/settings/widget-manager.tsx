"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageCircle, 
  Code, 
  Copy, 
  CheckCircle2, 
  Globe, 
  Sparkles, 
  Laptop, 
  Layers, 
  ExternalLink,
  Loader2,
  Palette,
  Layout,
  Smartphone,
  Eye,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

interface ConnectedLine {
  id: string;
  phone_number: string;
  verified_name: string;
}

type WidgetTheme = "classic" | "glass" | "purple" | "gold" | "rose";

interface ThemePreset {
  name: string;
  color: string;
  bgClass: string;
  popupBg: string;
  borderClass: string;
  btnGlow: string;
}

const THEME_PRESETS: Record<WidgetTheme, ThemePreset> = {
  classic: {
    name: "WhatsApp Classic",
    color: "#25D366",
    bgClass: "bg-[#25D366]",
    popupBg: "#0b0f19",
    borderClass: "border-slate-800",
    btnGlow: "shadow-[0_4px_15px_rgba(37,211,102,0.3)] hover:shadow-[0_4px_25px_rgba(37,211,102,0.5)]"
  },
  glass: {
    name: "Glassmorphism Glow",
    color: "#10b981",
    bgClass: "bg-gradient-to-r from-emerald-500 to-teal-500",
    popupBg: "rgba(15, 23, 42, 0.75)",
    borderClass: "border-emerald-500/20 backdrop-blur-md",
    btnGlow: "shadow-[0_4px_20px_rgba(16,185,129,0.35)]"
  },
  purple: {
    name: "Vibrant Purple",
    color: "#8b5cf6",
    bgClass: "bg-gradient-to-r from-violet-600 to-indigo-600",
    popupBg: "#0f0b1e",
    borderClass: "border-violet-500/20",
    btnGlow: "shadow-[0_4px_20px_rgba(139,92,246,0.35)]"
  },
  gold: {
    name: "Royal Gold",
    color: "#f59e0b",
    bgClass: "bg-gradient-to-r from-amber-500 to-yellow-500",
    popupBg: "#17120a",
    borderClass: "border-amber-500/20",
    btnGlow: "shadow-[0_4px_20px_rgba(245,158,11,0.35)]"
  },
  rose: {
    name: "Sunset Rose",
    color: "#ec4899",
    bgClass: "bg-gradient-to-r from-rose-500 to-orange-500",
    popupBg: "#1b0b14",
    borderClass: "border-rose-500/20",
    btnGlow: "shadow-[0_4px_20px_rgba(236,72,153,0.35)]"
  }
};

export function WidgetManager() {
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [lines, setLines] = useState<ConnectedLine[]>([]);
  
  // Customization State
  const [phoneNumber, setPhoneNumber] = useState("15550199823");
  const [botName, setBotName] = useState("WaCRM Sales Bot");
  const [botSubtitle, setBotSubtitle] = useState("Replies instantly via WhatsApp");
  const [botAvatar, setBotAvatar] = useState("🤖");
  const [message, setMessage] = useState("Hello! I am your AI assistant. How can I help you today?");
  const [ctaText, setCtaText] = useState("Start Chat on WhatsApp");
  const [position, setPosition] = useState<"right" | "left">("right");
  const [activeTheme, setActiveTheme] = useState<WidgetTheme>("classic");
  
  // Interactive Live Preview State
  const [previewExpanded, setPreviewExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    fetchWhatsAppLines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  // Fetch connected lines
  async function fetchWhatsAppLines() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("whatsapp_config")
        .select("id, phone_number, status")
        .eq("status", "connected");

      if (!error && data && data.length > 0) {
        const activeLines = data.map((d: any) => ({
          id: d.id,
          phone_number: d.phone_number || "Unknown",
          verified_name: d.phone_number ? `WhatsApp Line (${d.phone_number})` : "WhatsApp Business Line"
        }));
        setLines(activeLines);
        // Default to first active number
        const cleanNumber = activeLines[0].phone_number.replace(/[^0-9]/g, "");
        if (cleanNumber) setPhoneNumber(cleanNumber);
      }
    } catch (e) {
      console.error("Failed to load active lines for widget:", e);
    } finally {
      setLoading(false);
    }
  }

  const selectedThemePreset = THEME_PRESETS[activeTheme];

  const generateWidgetCode = () => {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
    const encodedMessage = encodeURIComponent(message);
    const positionStyle = position === "right" ? "right: 24px;" : "left: 24px;";
    const alignStyle = position === "right" ? "align-items: flex-end;" : "align-items: flex-start;";
    const avatarTranslate = position === "right" ? "right: 0;" : "left: 0;";
    
    // Customize inline CSS templates based on theme selection
    const glassStyle = activeTheme === "glass" 
      ? `background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(16,185,129, 0.2);`
      : `background-color: ${selectedThemePreset.popupBg}; border: 1px solid #1e293b;`;

    return `<!-- WaCRM Premium WhatsApp Chatbot Widget -->
<div id="wacrm-chat-widget" style="position: fixed; bottom: 24px; ${positionStyle} z-index: 999999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: flex; flex-direction: column; ${alignStyle}">
  <!-- Chat Popup Window -->
  <div id="wacrm-chat-window" style="display: none; width: 330px; border-radius: 18px; overflow: hidden; box-shadow: 0 12px 30px rgba(0,0,0,0.3); ${glassStyle} margin-bottom: 16px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
    <!-- Header -->
    <div style="background: ${activeTheme === 'classic' ? selectedThemePreset.color : 'linear-gradient(135deg, ' + selectedThemePreset.color + ', #0f172a)'}; padding: 18px; color: white; display: flex; align-items: center; gap: 14px;">
      <div style="position: relative; width: 44px; height: 44px; background-color: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: bold; border: 1px solid rgba(255,255,255,0.1);">
        ${botAvatar}
        <span style="position: absolute; bottom: 0; ${avatarTranslate} width: 10px; height: 10px; background-color: #10b981; border: 2px solid ${selectedThemePreset.color}; border-radius: 50%;"></span>
      </div>
      <div>
        <h4 style="margin: 0; font-size: 15px; font-weight: 600; color: white; tracking: 0.5px;">${botName}</h4>
        <p style="margin: 2px 0 0 0; font-size: 11px; opacity: 0.85; color: #cbd5e1; display: flex; align-items: center; gap: 4px;">
          <span style="display:inline-block; width:6px; height:6px; background:#10b981; border-radius:50%"></span>
          ${botSubtitle}
        </p>
      </div>
      <button onclick="toggleWaCrmChat()" style="background: none; border: none; color: white; margin-left: auto; font-size: 22px; cursor: pointer; padding: 4px; line-height: 1; opacity: 0.8; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">×</button>
    </div>
    
    <!-- Body Content -->
    <div style="padding: 20px; max-height: 220px; overflow-y: auto; background-color: ${activeTheme === 'glass' ? 'transparent' : '#0b0f19'};">
      <div style="background-color: #1e293b; color: #f1f5f9; padding: 12px 16px; border-radius: 14px 14px 14px 0; max-width: 85%; font-size: 13px; line-height: 1.5; border: 1px solid #334155; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
        ${message}
      </div>
    </div>
    
    <!-- Action Redirect Footer -->
    <div style="padding: 14px 20px; background-color: #0f172a; border-top: 1px solid #1e293b;">
      <a href="https://wa.me/${cleanPhone}?text=${encodedMessage}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; justify-content: center; gap: 10px; background-color: #25D366; color: white; text-decoration: none; padding: 12px; border-radius: 10px; font-size: 13.5px; font-weight: 600; text-align: center; box-shadow: 0 4px 12px rgba(37,211,102,0.25); transition: all 0.2s ease;" onmouseover="this.style.backgroundColor='#20ba5a'; this.style.transform='translateY(-1px)'" onmouseout="this.style.backgroundColor='#25D366'; this.style.transform='translateY(0)'">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
        ${ctaText}
      </a>
    </div>
  </div>
  
  <!-- Floating Button -->
  <button id="wacrm-widget-btn" onclick="toggleWaCrmChat()" style="border: none; cursor: pointer; outline: none; background: ${activeTheme === 'classic' ? selectedThemePreset.color : 'linear-gradient(135deg, ' + selectedThemePreset.color + ', #0f172a)'}; color: white; border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 20px rgba(0,0,0,0.3); transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); padding: 0;" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color: white;">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
  </button>
</div>

<script>
  function toggleWaCrmChat() {
    var win = document.getElementById('wacrm-chat-window');
    var btn = document.getElementById('wacrm-widget-btn');
    if (win.style.display === 'none') {
      win.style.display = 'block';
      if (btn) btn.style.transform = 'scale(0.92) rotate(90deg)';
    } else {
      win.style.display = 'none';
      if (btn) btn.style.transform = 'scale(1) rotate(0deg)';
    }
  }
</script>`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateWidgetCode());
    setCopied(true);
    toast.success("Widget code copied successfully!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 mt-4 pb-12 max-w-7xl mx-auto px-4 md:px-0">
      
      {/* Top Heading Banner - fully responsive flex */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-br from-primary/10 to-transparent blur-3xl rounded-full" />
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-extrabold text-white tracking-tight">Floating Chatbot Widget Builder</h2>
            <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold shadow-sm">
              <Globe className="h-3 w-3" /> Fully Responsive
            </span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
            Create an interactive floating support widget for your site. Capture WhatsApp leads instantly, compatible with Coding/Custom websites, WordPress, Wix, Shopify, WooCommerce and all major CMS platforms.
          </p>
        </div>
      </div>

      {/* Main Form + Preview Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN - CUSTOMIZER (7/12 width on large screen, full on smaller) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-slate-900/30 border-slate-800 backdrop-blur-md shadow-2xl relative">
            <CardHeader className="border-b border-slate-800 pb-4">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Palette className="size-4 text-primary" />
                Customize Aesthetics & Identity
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Alter bot information, greeting defaults, color styles, and screen placements.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              
              {/* Dropdown Selector for connected WhatsApp lines */}
              <div className="space-y-1.5">
                <Label className="text-slate-300 font-medium">WhatsApp Destination Number</Label>
                {loading && lines.length === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800 px-3 py-2.5 rounded-lg border border-slate-700">
                    <Loader2 className="size-4 animate-spin" />
                    Fetching active numbers from cloud...
                  </div>
                ) : lines.length > 0 ? (
                  <select
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {lines.map((l) => (
                      <option key={l.id} value={l.phone_number.replace(/[^0-9]/g, "")}>
                        {l.verified_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 919876543210 (Include country code without +)"
                    className="bg-slate-800 border-slate-700 text-white py-5 placeholder:text-slate-500"
                  />
                )}
                <p className="text-[10px] text-slate-500 leading-normal">
                  Widget messages will route to this line. Ensure it includes country code (e.g. 91 for India, 1 for US) with no symbols.
                </p>
              </div>

              {/* Bot Identity Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-slate-300 font-medium">Chatbot Agent Name</Label>
                  <Input
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300 font-medium">Agent Avatar</Label>
                  <select
                    value={botAvatar}
                    onChange={(e) => setBotAvatar(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="🤖">🤖 Robot Bot</option>
                    <option value="🙋‍♂️">🙋‍♂️ Support Rep</option>
                    <option value="👩‍💼">👩‍💼 Sales Rep</option>
                    <option value="💬">💬 Chat Bubble</option>
                    <option value="🔥">🔥 Brand Sparkle</option>
                    <option value="💼">💼 Sales Team</option>
                  </select>
                </div>
              </div>

              {/* Status Subtitle */}
              <div className="space-y-1.5">
                <Label className="text-slate-300 font-medium">Status Text (e.g. replies instantly)</Label>
                <Input
                  value={botSubtitle}
                  onChange={(e) => setBotSubtitle(e.target.value)}
                  placeholder="Replies instantly"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              {/* Greeting welcome message */}
              <div className="space-y-1.5">
                <Label className="text-slate-300 font-medium">Default Chat Welcome Greeting</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white resize-none text-xs leading-relaxed"
                  rows={3}
                />
              </div>

              {/* CTA button redirect text */}
              <div className="space-y-1.5">
                <Label className="text-slate-300 font-medium">Call-to-Action Redirect Button Text</Label>
                <Input
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              {/* Design Preset Selectors */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <Label className="text-slate-300 font-medium block">Select Design Preset Theme</Label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {(Object.keys(THEME_PRESETS) as WidgetTheme[]).map((themeKey) => {
                    const preset = THEME_PRESETS[themeKey];
                    const active = activeTheme === themeKey;
                    return (
                      <button
                        key={themeKey}
                        type="button"
                        onClick={() => setActiveTheme(themeKey)}
                        className={`p-2 rounded-xl text-[11px] font-bold text-center border transition-all truncate flex flex-col items-center justify-center gap-1.5 ${
                          active 
                            ? 'border-white text-white bg-slate-850 shadow-[0_0_10px_rgba(255,255,255,0.05)]' 
                            : 'border-slate-800 text-slate-400 bg-slate-950/40 hover:text-white hover:bg-slate-900/60'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${preset.bgClass}`} />
                        {preset.name.split(" ")[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Placement Position */}
              <div className="space-y-1.5 pt-2">
                <Label className="text-slate-300 font-medium">Layout Position Alignment</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={position === "left" ? "default" : "outline"}
                    className={`flex-1 font-semibold ${position === "left" ? "bg-primary" : "border-slate-700 text-slate-300 bg-slate-800"}`}
                    onClick={() => setPosition("left")}
                  >
                    Bottom Left
                  </Button>
                  <Button
                    type="button"
                    variant={position === "right" ? "default" : "outline"}
                    className={`flex-1 font-semibold ${position === "right" ? "bg-primary" : "border-slate-700 text-slate-300 bg-slate-800"}`}
                    onClick={() => setPosition("right")}
                  >
                    Bottom Right
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN - PREVIEW & EMBED CODES (5/12 width, full on smaller) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Simulated Browser Frame Preview */}
          <Card className="bg-slate-900/30 border-slate-800 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col relative">
            <div className="absolute top-0 right-0 h-32 w-32 bg-primary/5 blur-3xl rounded-full" />
            
            {/* Browser Header Bar */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <div className="bg-slate-900 border border-slate-800/80 px-4 py-1 rounded-md text-[10px] text-slate-500 font-mono truncate max-w-[200px]">
                https://yourwebsite.com
              </div>
              <div className="w-12 shrink-0" />
            </div>

            {/* Canvas Area */}
            <div className="flex-1 bg-slate-950/20 relative min-h-[300px] p-6 overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:14px_14px]" />
              
              <div className="relative h-full w-full border border-dashed border-slate-800/80 rounded-xl flex items-center justify-center text-slate-600 bg-slate-900/10 min-h-[250px]">
                <span className="text-[10px] tracking-wide text-slate-500 select-none uppercase font-semibold">Web Canvas Preview</span>

                {/* Simulated popup chatbot frame */}
                {previewExpanded && (
                  <div 
                    className={`absolute bottom-16 rounded-2xl overflow-hidden shadow-2xl border bg-slate-900 w-[240px] transition-all duration-300 ease-in-out ${selectedThemePreset.borderClass}`}
                    style={{ [position]: '8px' }}
                  >
                    <div 
                      className={`p-3 text-white flex items-center gap-2.5 ${selectedThemePreset.bgClass}`}
                    >
                      <div className="size-8 bg-white/20 rounded-full flex items-center justify-center text-base border border-white/10 shrink-0">
                        {botAvatar}
                      </div>
                      <div className="min-w-0">
                        <h5 className="margin-0 text-[11px] font-bold truncate text-white leading-tight">{botName}</h5>
                        <p className="margin-0 text-[8px] opacity-85 text-slate-100 truncate flex items-center gap-1 mt-0.5">
                          <span className="size-1.5 bg-emerald-400 rounded-full inline-block"></span>
                          {botSubtitle}
                        </p>
                      </div>
                      <button 
                        onClick={() => setPreviewExpanded(false)}
                        className="text-white text-base ml-auto font-bold opacity-80 hover:opacity-100"
                      >
                        ×
                      </button>
                    </div>

                    <div className="p-3 bg-slate-950/80 min-h-[60px]">
                      <div className="bg-slate-850 text-slate-200 p-2.5 rounded-xl rounded-bl-none text-[10px] leading-relaxed border border-slate-800 shadow-lg">
                        {message}
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-900 border-t border-slate-850">
                      <div 
                        className="flex items-center justify-center gap-1.5 text-[9.5px] font-bold text-white py-2 rounded-lg cursor-pointer transition-colors shadow-lg"
                        style={{ backgroundColor: '#25D366' }}
                      >
                        <MessageCircle className="size-3.5" />
                        {ctaText}
                      </div>
                    </div>
                  </div>
                )}

                {/* Floating button element */}
                <button
                  onClick={() => setPreviewExpanded(!previewExpanded)}
                  className={`absolute bottom-4 flex items-center justify-center transition-all ${selectedThemePreset.bgClass} ${selectedThemePreset.btnGlow}`}
                  style={{
                    [position]: '8px',
                    borderRadius: '50%',
                    width: '46px',
                    height: '46px',
                    color: 'white',
                    border: 'none',
                    padding: 0
                  }}
                >
                  <MessageCircle className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Footer containing generated code output */}
            <div className="p-4 bg-slate-950 border-t border-slate-850">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <Code className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-300">Copy Widget Code snippet</span>
                </div>
                <Button size="sm" variant="secondary" onClick={handleCopy} className="h-7 text-xs gap-1.5">
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied!" : "Copy Code"}
                </Button>
              </div>
              <div className="bg-[#020617] rounded-lg p-3 max-h-[140px] overflow-y-auto border border-slate-900">
                <pre className="text-[10px] text-slate-400 whitespace-pre font-mono leading-relaxed select-all">
                  {generateWidgetCode()}
                </pre>
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* DETAILED RESPONSIVE PLATFORM INTEGRATION GUIDE */}
      <Card className="bg-slate-900/30 border-slate-800 backdrop-blur-md mt-6 shadow-2xl relative">
        <CardHeader className="border-b border-slate-800 pb-4">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Globe className="size-4 text-emerald-400" />
            Integrate on WordPress, CMS, or Custom Code Sites
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Follow our clean responsive guides to easily run your custom AI chatbot widget on any website.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Accordion>
            
            {/* Custom Code Integration */}
            <AccordionItem className="border-slate-850">
              <AccordionTrigger className="text-slate-300 hover:text-white hover:no-underline py-3">
                <span className="flex items-center gap-2">
                  <Laptop className="h-4 w-4 text-indigo-400 shrink-0" />
                  Custom Code Website (HTML, React, Vue, Next.js)
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-slate-400 text-xs leading-relaxed space-y-2.5">
                <p>Add the floating WhatsApp Chatbot Widget to your custom coding project by injecting the code block right before your closing body tags.</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>Copy the global generated code block from the preview card above.</li>
                  <li>Locate the main layout template or HTML wrapper (e.g. <code>index.html</code>, <code>layout.js</code>, or <code>App.vue</code>).</li>
                  <li>Scroll to the bottom of the document and paste the copied block right before the closing <code>&lt;/body&gt;</code> tag.</li>
                  <li>Save and deploy. The interactive floating chatbot widget will go live immediately on all pages!</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            {/* WordPress CMS Integration */}
            <AccordionItem className="border-slate-850">
              <AccordionTrigger className="text-slate-300 hover:text-white hover:no-underline py-3">
                <span className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-400 shrink-0" />
                  WordPress & CMS Platforms (Wix, Squarespace)
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-slate-400 text-xs leading-relaxed space-y-4">
                <div>
                  <h5 className="font-bold text-slate-300 mb-1.5">WordPress Integration Tutorial:</h5>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Log in to your WordPress dashboard.</li>
                    <li>Navigate to **Plugins &gt; Add New**, search for "WPCode" or "Insert Headers and Footers" and click **Install & Activate**.</li>
                    <li>Navigate to **Code Snippets &gt; Header & Footer**.</li>
                    <li>Paste the copied **Generated Widget Code** directly into the **Footer** input block.</li>
                    <li>Click **Save Changes**. Your WhatsApp Support Chatbot goes live on all pages!</li>
                  </ol>
                </div>
                <div className="pt-3 border-t border-slate-850">
                  <h5 className="font-bold text-slate-300 mb-1.5">Wix / Squarespace Integration Tutorial:</h5>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Go to your Wix/Squarespace site manager settings.</li>
                    <li>Locate **Custom Code** or **Code Injection** settings.</li>
                    <li>Create a custom block, set the placement to **Footer**, paste our generated code, and choose **Apply to all pages**.</li>
                    <li>Click Publish to push your chatbot widget live!</li>
                  </ol>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Shopify Store E-Commerce */}
            <AccordionItem className="border-slate-850">
              <AccordionTrigger className="text-slate-300 hover:text-white hover:no-underline py-3">
                <span className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-emerald-400 shrink-0" />
                  E-Commerce Stores (Shopify, WooCommerce)
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-slate-400 text-xs leading-relaxed space-y-2">
                <p>Support customer queries, order updates, and product questions directly inside your shop.</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Log in to your Shopify store admin panel.</li>
                  <li>Go to **Online Store &gt; Themes**, click the **Three Dots (...)** on your active theme and click **Edit Code**.</li>
                  <li>Locate the file <code>theme.liquid</code> under Layouts.</li>
                  <li>Scroll to the bottom of the template and find the closing <code>&lt;/body&gt;</code> tag.</li>
                  <li>Paste our generated code block right above it, and click **Save**.</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </CardContent>
      </Card>

    </div>
  );
}
