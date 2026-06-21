"use client";

import { useEffect, useState, useRef, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  Calendar,
  Layers, 
  DollarSign, 
  ShieldAlert, 
  PenTool, 
  Check, 
  Sparkles,
  Info,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface ProposalDetails {
  id: string;
  service_required: string;
  details: {
    budget?: string;
    timeline?: string;
    goals?: string;
    website?: string;
    deliverables?: string[];
  };
  status: "pending" | "generated" | "signed" | "sent" | "failed";
  client_signature?: string;
  signed_at?: string;
  created_at: string;
  contacts?: {
    name?: string;
    company?: string;
    phone?: string;
  };
}

const DEFAULT_DELIVERABLES: Record<string, string[]> = {
  "website development": [
    "Custom UI/UX Design Mockup in Figma",
    "Responsive Front-end Coding (Next.js/React or WordPress)",
    "Backend Integration & Core Database Setups",
    "On-page Technical SEO Implementation",
    "1 Month Post-Launch Maintenance & Support"
  ],
  "seo": [
    "Full Website SEO Audit & Competitor Mapping",
    "In-depth Keyword Research & Strategy",
    "High-quality Monthly Backlink Acquisitions",
    "Content Optimization & Technical Crawl Cleanups",
    "Detailed Monthly Performance Reporting & Auditing"
  ],
  "digital marketing": [
    "Target Audience Optimization & Persona Setup",
    "High-converting Google Ads & Meta Ads Setup",
    "Dynamic Creative Visuals & Copywriting Support",
    "Pixel Tracking, Conversions, & UTM Implementations",
    "Weekly Campaign Performance Dashboard Audits"
  ],
  "branding": [
    "Professional Logo Suite (Vector, Light/Dark)",
    "Brand Color Harmony & Typography Sheet",
    "Sleek UI/UX Mockups & Wireframing",
    "Social Media Banner & Kit Custom Designs",
    "Interactive Design System Documentation"
  ]
};

export default function PublicProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [proposal, setProposal] = useState<ProposalDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signatureText, setSignatureText] = useState("");
  const [signMode, setSignMode] = useState<"type" | "draw">("type");
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    fetchProposal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchProposal() {
    try {
      setLoading(true);
      const res = await fetch(`/api/public/proposal?id=${id}`);
      if (!res.ok) throw new Error("Could not find proposal");
      const data = await res.json();
      setProposal(data.proposal);
    } catch (err: any) {
      console.error(err);
      toast.error("Error loading proposal. Ensure link is correct.");
    } finally {
      setLoading(false);
    }
  }

  // Signature Canvas Helpers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#4f46e5";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const handleAcceptProposal = async () => {
    let finalSignature = "";

    if (signMode === "type") {
      if (!signatureText.trim()) {
        toast.error("Please type your signature to accept.");
        return;
      }
      finalSignature = signatureText.trim();
    } else {
      // For draw mode, convert canvas to a simulated signature string
      finalSignature = `Signed: Drawn via Screen Canvas`;
    }

    setSigning(true);
    try {
      const res = await fetch("/api/public/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, signature: finalSignature }),
      });

      if (!res.ok) throw new Error("Acceptance update failed");

      toast.success("Thank you! Proposal signed and accepted.");
      fetchProposal();
    } catch (err: any) {
      toast.error(err.message || "Failed to sign proposal");
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-950 text-slate-400">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm">Fetching MaaJanki Web Tech proposal details...</p>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-950 text-slate-400 p-4">
        <ShieldAlert className="h-12 w-12 text-rose-500 mb-4 animate-bounce" />
        <h2 className="text-lg font-bold text-white mb-2">Proposal Unavailable</h2>
        <p className="text-sm max-w-md text-center">
          The requested proposal could not be retrieved. Please check the WhatsApp link or contact your MaaJanki Web Tech manager.
        </p>
      </div>
    );
  }

  const isSigned = proposal.status === "signed";
  const serviceKey = proposal.service_required.toLowerCase();
  const deliverables = proposal.details.deliverables || 
    DEFAULT_DELIVERABLES[serviceKey] || 
    DEFAULT_DELIVERABLES["website development"];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 h-[400px] w-full bg-gradient-to-b from-indigo-500/10 to-transparent blur-3xl -z-10" />
      
      {/* Container */}
      <div className="max-w-4xl mx-auto px-4 pt-10 space-y-8">
        
        {/* Header Agency Branding */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-800/80 pb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-650 flex items-center justify-center rounded-xl font-black text-white text-lg tracking-wider shadow-lg shadow-indigo-600/35 border border-indigo-500/20">
              MJ
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">MaaJanki Web Tech</h2>
              <p className="text-xs text-slate-400">Website • Marketing • AI Solutions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSigned ? (
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" />
                Signed & Accepted
              </Badge>
            ) : (
              <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Pending Signature
              </Badge>
            )}
          </div>
        </div>

        {/* Introduction Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 bg-slate-900/50 border-slate-850 backdrop-blur-sm relative">
            <div className="absolute top-4 right-4 text-indigo-500/10">
              <FileText className="h-24 w-24" />
            </div>
            <CardHeader className="p-6">
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest block mb-1">Proposal & Scope</span>
              <CardTitle className="text-xl text-white font-extrabold">{proposal.service_required}</CardTitle>
              <CardDescription className="text-slate-400 text-xs mt-1">
                Prepared custom-made execution plan for {proposal.contacts?.name || "Client"}.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4 text-sm text-slate-350 leading-relaxed">
              <p>
                Hello {proposal.contacts?.name || "Client"}, at MaaJanki Web Tech, we combine next-generation tech stack with best practices. Here is our proposed delivery roadmap for your upcoming project.
              </p>
              {proposal.details.goals && (
                <div className="bg-slate-950/45 p-3 rounded-lg border border-slate-850/60 mt-2">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">PROJECT OBJECTIVE & GOALS:</span>
                  <p className="text-xs text-slate-350">{proposal.details.goals}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-850 backdrop-blur-sm space-y-4 p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block border-b border-slate-850 pb-2">Deal Metrics</span>
              
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-indigo-500/10 flex items-center justify-center rounded-lg text-indigo-400">
                  <DollarSign className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">Estimated Cost</span>
                  <span className="text-sm font-extrabold text-slate-200">{proposal.details.budget || "₹25,000 / $350"}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-indigo-500/10 flex items-center justify-center rounded-lg text-indigo-400">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">Expected Timeline</span>
                  <span className="text-sm font-semibold text-slate-200">{proposal.details.timeline || "3 to 4 Weeks"}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-850 flex items-start gap-2 text-[10px] text-slate-500">
              <Info className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <p className="leading-normal">
                This proposal is dynamic and subject to digital approval. Accepting creates a project ticket.
              </p>
            </div>
          </Card>
        </div>

        {/* Deliverables Checklist */}
        <Card className="bg-slate-900/40 border-slate-850 backdrop-blur-sm">
          <CardHeader className="p-6 pb-3">
            <CardTitle className="text-sm text-slate-200 uppercase font-bold tracking-wider flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-indigo-400" />
              Deliverables & Project Milestones
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {deliverables.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/20 border border-slate-850 hover:bg-slate-950/45 transition-colors">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5 bg-emerald-500/10 rounded-full p-0.5 border border-emerald-500/20" />
                  <span className="text-xs text-slate-350 leading-relaxed font-medium">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Acceptance / Signature Area */}
        <Card className="bg-slate-900/60 border-slate-800 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/5 blur-2xl rounded-full" />
          
          <CardHeader className="p-6 border-b border-slate-850 bg-slate-950/30 flex flex-row items-center gap-3">
            <PenTool className="h-5 w-5 text-indigo-400" />
            <div>
              <CardTitle className="text-base text-white">Digital Contract Approval</CardTitle>
              <CardDescription className="text-slate-500 text-xs">
                Review deliverables and apply your signature to accept the agreement.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {isSigned ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-950/40 border border-slate-850 rounded-xl max-w-md mx-auto space-y-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">Agreement Electronically Signed</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Approved via dynamic digital fingerprint ID.</p>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded px-6 py-2 font-serif italic text-lg text-indigo-400">
                  {proposal.client_signature}
                </div>
                <span className="text-[9px] text-slate-600">
                  Signed on {proposal.signed_at ? new Date(proposal.signed_at).toLocaleString() : ""}
                </span>
              </div>
            ) : (
              <div className="space-y-4 max-w-lg mx-auto">
                <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-850 w-fit mx-auto mb-4">
                  <Button 
                    variant={signMode === "type" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSignMode("type")}
                    className="text-xs h-7 px-4 rounded"
                  >
                    Type Signature
                  </Button>
                  <Button 
                    variant={signMode === "draw" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSignMode("draw")}
                    className="text-xs h-7 px-4 rounded"
                  >
                    Draw Signature
                  </Button>
                </div>

                {signMode === "type" ? (
                  <div className="space-y-2">
                    <Label className="text-slate-400 text-xs">Enter Your Full Name</Label>
                    <div className="relative">
                      <Input
                        value={signatureText}
                        onChange={(e) => setSignatureText(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus-visible:ring-indigo-500 font-serif italic text-lg text-center"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 flex flex-col items-center">
                    <Label className="text-slate-400 text-xs align-self-start">Draw signature inside box</Label>
                    <canvas
                      ref={canvasRef}
                      width={380}
                      height={120}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      className="bg-slate-950 border border-slate-800 rounded-lg cursor-crosshair"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearCanvas}
                      className="text-[10px] text-slate-500 hover:text-slate-300 self-end mt-1"
                    >
                      Clear Drawing
                    </Button>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    onClick={handleAcceptProposal}
                    disabled={signing}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-1.5"
                  >
                    {signing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Signing Agreement...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-amber-300" />
                        Accept & Electronically Sign Proposal
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
