"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { 
  Building2, 
  Globe, 
  Mail, 
  Palette, 
  UploadCloud, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Loader2,
  RefreshCw,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function WorkspaceBranding() {
  const { user, profile } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWsId, setSelectedWsId] = useState<string>("");

  // Current workspace settings fields
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [whiteLabelEnabled, setWhiteLabelEnabled] = useState(false);
  const [brandColor, setBrandColor] = useState("#6366f1");

  const loadWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      if (!user) return;

      const { data, error } = await supabase
        .from("business_workspaces")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setWorkspaces(data);
        
        // Match active workspace from localStorage or default to first
        const activeId = localStorage.getItem("wacrm_active_workspace_id") || data[0].id;
        setSelectedWsId(activeId);

        const currentWs = data.find((ws) => ws.id === activeId) || data[0];
        setName(currentWs.name || "");
        setLogoUrl(currentWs.logo_url || "");
        setCustomDomain(currentWs.custom_domain || "");
        setSupportEmail(currentWs.support_email || "");
        setWhiteLabelEnabled(currentWs.white_label_enabled || false);
        setBrandColor(currentWs.brand_color || "#6366f1");
      }
    } catch (err: any) {
      console.error("[workspace-branding] load error:", err.message);
      toast.error("Failed to load business workspaces");
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    loadWorkspaces();
    
    // Listen for changes from header workspace updates
    const handleWsChangedEvent = () => {
      loadWorkspaces();
    };
    window.addEventListener("wacrm_workspace_changed", handleWsChangedEvent);
    return () => {
      window.removeEventListener("wacrm_workspace_changed", handleWsChangedEvent);
    };
  }, [loadWorkspaces]);

  const handleSelectWorkspace = (wsId: string) => {
    setSelectedWsId(wsId);
    localStorage.setItem("wacrm_active_workspace_id", wsId);
    
    const currentWs = workspaces.find((ws) => ws.id === wsId);
    if (currentWs) {
      setName(currentWs.name || "");
      setLogoUrl(currentWs.logo_url || "");
      setCustomDomain(currentWs.custom_domain || "");
      setSupportEmail(currentWs.support_email || "");
      setWhiteLabelEnabled(currentWs.white_label_enabled || false);
      setBrandColor(currentWs.brand_color || "#6366f1");
    }
    
    // Notify header to reload active workspace
    window.dispatchEvent(new Event("wacrm_workspace_changed"));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWsId) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("business_workspaces")
        .update({
          name: name.trim(),
          logo_url: logoUrl.trim() || null,
          custom_domain: customDomain.trim() || null,
          support_email: supportEmail.trim() || null,
          white_label_enabled: whiteLabelEnabled,
          brand_color: brandColor,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedWsId);

      if (error) throw error;

      toast.success("Workspace branding configurations successfully updated!");
      
      // Reload workspace list
      await loadWorkspaces();
      
      // Dispatch event to trigger workspace switcher name sync
      window.dispatchEvent(new Event("wacrm_workspace_changed"));
    } catch (err: any) {
      console.error("[workspace-branding] save error:", err.message);
      toast.error("Failed to save branding configurations: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-900/10 border border-slate-800 rounded-xl">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-slate-400 text-sm">Loading business profile configuration...</p>
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <Card className="border-slate-850 bg-slate-900/40 p-6 text-center text-slate-400">
        <Building2 className="h-10 w-10 text-slate-600 mx-auto mb-3" />
        <p className="text-sm font-semibold">No workspaces found</p>
        <p className="text-xs text-slate-500 mt-1">Please create a workspace in the top header switcher.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selector */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Label className="text-slate-300 font-bold block mb-1.5">Selected Workspace</Label>
            <p className="text-xs text-slate-400">Configure branding and white label settings for this specific workspace identity.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={selectedWsId}
              onChange={(e) => handleSelectWorkspace(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none min-w-[200px]"
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>{ws.name}</option>
              ))}
            </select>
            <Button size="icon" variant="outline" onClick={loadWorkspaces} className="border-slate-850 hover:bg-slate-800 text-slate-400">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Config Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-800 bg-slate-900/30">
            <CardHeader className="p-5 border-b border-slate-850 bg-slate-950/20">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Building2 className="h-4.5 w-4.5 text-indigo-400" />
                Workspace Identity Settings
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Update the display name, custom logotype assets, and support contact coordinates.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="ws-name" className="text-slate-300 text-xs">Company/Workspace Name</Label>
                <Input
                  id="ws-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Agency Ltd."
                  className="bg-slate-950 border-slate-800 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ws-logo" className="text-slate-300 text-xs">Custom Logo URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="ws-logo"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://yourdomain.com/assets/logo.png"
                    className="bg-slate-950 border-slate-800 text-white font-mono text-xs"
                  />
                  <Button type="button" variant="outline" className="border-slate-850 text-slate-400 hover:text-white gap-1 bg-slate-950 text-xs">
                    <UploadCloud className="h-3.5 w-3.5" />
                    Browse
                  </Button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Recommended size: 256x256px square PNG, SVG, or WebP.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ws-support" className="text-slate-300 text-xs">Support Contact Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <Input
                    id="ws-support"
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="support@company.com"
                    className="bg-slate-950 border-slate-800 text-white pl-9"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  Automatically embedded into proposals, invoices, and quotations sent to WhatsApp clients.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* White Label Panel */}
          <Card className="border-slate-800 bg-slate-900/30">
            <CardHeader className="p-5 border-b border-slate-850 bg-slate-950/20">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Globe className="h-4.5 w-4.5 text-indigo-400" />
                White Label Configurations
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Configure custom domains and theme settings to match your enterprise SaaS branding.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between bg-slate-950/40 border border-slate-850/60 p-4 rounded-xl">
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-slate-200 block">Enable White-Labeling</span>
                  <span className="text-[11px] text-slate-500">Strip WaCRM brand mentions from client-facing portals</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={whiteLabelEnabled}
                  onClick={() => setWhiteLabelEnabled(!whiteLabelEnabled)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    whiteLabelEnabled ? "bg-indigo-600 shadow-[0_0_8px_rgba(99,102,241,0.3)]" : "bg-slate-700"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ease-in-out",
                      whiteLabelEnabled ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              <div className={cn("space-y-4 transition-all duration-300", !whiteLabelEnabled && "opacity-40 pointer-events-none filter grayscale-[20%]")}>
                <div className="space-y-2">
                  <Label htmlFor="ws-domain" className="text-slate-300 text-xs">Custom Domain / Domain Alias</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <Input
                      id="ws-domain"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      placeholder="e.g. crm.yourbrand.com"
                      className="bg-slate-950 border-slate-800 text-white pl-9 font-mono text-xs"
                      disabled={!whiteLabelEnabled}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Point a CNAME record from your domain to `cname.wacrm.tech` to activate this domain.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <Label className="text-slate-300 text-xs flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5 text-slate-500" />
                    Branding Accent Color
                  </Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="h-10 w-10 bg-slate-950 border border-slate-800 rounded cursor-pointer"
                      disabled={!whiteLabelEnabled}
                    />
                    <Input
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      placeholder="#6366f1"
                      className="bg-slate-950 border-slate-800 text-white font-mono text-xs w-28 uppercase"
                      disabled={!whiteLabelEnabled}
                    />
                    <span className="text-[10px] text-slate-500">
                      Overrides the primary app accent color on client invoices, payment links, and quote approval forms.
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Branding Preview Sidebar */}
        <div className="space-y-6">
          <Card className="border-slate-800 bg-slate-900/20 overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-850 bg-slate-950/40">
              <CardTitle className="text-xs uppercase tracking-wider font-extrabold text-slate-400">
                Portal Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              {/* Simulated Client Portal Card */}
              <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <div className="flex items-center gap-2">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="h-6 w-6 object-contain rounded" onError={(e) => { (e.target as any).style.display = 'none' }} />
                    ) : (
                      <div className="h-6 w-6 bg-slate-800 rounded flex items-center justify-center text-[10px] font-bold" style={{ color: brandColor }}>
                        {name?.charAt(0) || "B"}
                      </div>
                    )}
                    <span className="text-xs font-bold text-white truncate max-w-[120px]">{name || "Brand Name"}</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 uppercase font-mono font-bold">
                    Active
                  </span>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="p-3 bg-slate-900/40 rounded border border-slate-850/60">
                    <p className="text-slate-400">Proposal for: Website Development</p>
                    <p className="text-slate-200 mt-1 font-bold">Total: ₹45,000</p>
                  </div>

                  <div className="flex gap-2 pt-1.5">
                    <Button 
                      type="button" 
                      size="sm" 
                      className="w-full text-[10px] font-bold text-white shadow-md border-0 transition-colors"
                      style={{ backgroundColor: brandColor }}
                    >
                      Digitally Sign Proposal
                    </Button>
                  </div>
                </div>

                {!whiteLabelEnabled && (
                  <div className="text-center pt-2 border-t border-slate-850">
                    <span className="text-[8px] text-slate-600 block">Powered by WaCRM Enterprise</span>
                  </div>
                )}
              </div>

              <div className="bg-indigo-500/5 border border-indigo-500/15 p-4 rounded-xl flex items-start gap-2.5 text-xs text-indigo-300">
                <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-indigo-400" />
                <p className="leading-relaxed">
                  White-labeling hides the footer and branding logs, routing your clients to a clean portal configured under your custom domain alias.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-primary hover:bg-primary/95 text-white font-semibold shadow-md flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Save Branding Config
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
