"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Code, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function WidgetManager() {
  const [phoneNumber, setPhoneNumber] = useState("1234567890");
  const [message, setMessage] = useState("Hi! I have a question about your services.");
  const [position, setPosition] = useState<"right" | "left">("right");
  const [color, setColor] = useState("#25D366"); // Official WhatsApp Green
  const [copied, setCopied] = useState(false);

  const generateWidgetCode = () => {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
    const encodedMessage = encodeURIComponent(message);
    const positionStyle = position === "right" ? "right: 20px;" : "left: 20px;";
    
    return `<!-- WaCRM WhatsApp Widget -->
<a href="https://wa.me/${cleanPhone}?text=${encodedMessage}" target="_blank" rel="noopener noreferrer" style="position: fixed; bottom: 20px; ${positionStyle} background-color: ${color}; color: white; border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); z-index: 9999; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
  </svg>
</a>`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateWidgetCode());
    setCopied(true);
    toast.success("Widget code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Website Chat Widget</h2>
          <p className="text-sm text-slate-400 mt-1">
            Generate a WhatsApp floating button for your website to instantly capture leads.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Configuration Form */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="font-semibold text-white mb-6">Widget Settings</h3>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-slate-300">WhatsApp Phone Number</Label>
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 1234567890 (Include country code)"
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <p className="text-xs text-slate-500">Must include country code without + or 00.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Pre-filled Message</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hi! I want to know more about..."
                  className="bg-slate-800 border-slate-700 text-white resize-none"
                  rows={3}
                />
                <p className="text-xs text-slate-500">The message the customer will send you by default.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Position</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={position === "left" ? "default" : "outline"}
                      className={`flex-1 ${position === "left" ? "bg-primary" : "border-slate-700 text-slate-300 bg-slate-800"}`}
                      onClick={() => setPosition("left")}
                    >
                      Left
                    </Button>
                    <Button
                      type="button"
                      variant={position === "right" ? "default" : "outline"}
                      className={`flex-1 ${position === "right" ? "bg-primary" : "border-slate-700 text-slate-300 bg-slate-800"}`}
                      onClick={() => setPosition("right")}
                    >
                      Right
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Button Color</Label>
                  <div className="flex gap-2">
                    {["#25D366", "#3b82f6", "#f97316", "#8b5cf6", "#14b8a6"].map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? "border-white" : "border-transparent"}`}
                        style={{ backgroundColor: c }}
                        aria-label={`Select color ${c}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview & Code */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden relative flex flex-col h-full">
            <div className="p-4 border-b border-slate-800 bg-slate-950/50">
              <h3 className="font-semibold text-white">Live Preview</h3>
            </div>
            
            <div className="flex-1 bg-slate-800/30 relative min-h-[250px] p-6 overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:16px_16px]" />
              
              <div className="relative h-full w-full border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center text-slate-500 bg-slate-900/50">
                <p className="text-sm">Your website content goes here</p>
                
                {/* Simulated Widget */}
                <div
                  className="absolute bottom-4 flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer"
                  style={{
                    backgroundColor: color,
                    [position]: '16px',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    color: 'white',
                  }}
                >
                  <MessageCircle className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">Embed Code</span>
                </div>
                <Button size="sm" variant="secondary" onClick={handleCopy} className="h-8 gap-1.5">
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy Code"}
                </Button>
              </div>
              <div className="bg-[#020617] rounded-lg p-3 overflow-x-auto border border-slate-800">
                <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono">
                  {generateWidgetCode()}
                </pre>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Paste this code right before the closing &lt;/body&gt; tag of your website.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
