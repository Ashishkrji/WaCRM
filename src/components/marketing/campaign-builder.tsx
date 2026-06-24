'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { 
  Sparkles, 
  Send, 
  Calendar, 
  Mail, 
  MessageSquare, 
  Layers, 
  TrendingUp, 
  Clock, 
  ArrowRight, 
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  UserCheck
} from 'lucide-react'

interface Segment {
  id: string
  name: string
  description: string
}

interface CampaignBuilderProps {
  onCampaignCreated?: () => void
}

export function CampaignBuilder({ onCampaignCreated }: CampaignBuilderProps) {
  const supabase = createClient()
  const [segments, setSegments] = useState<Segment[]>([])
  
  // Inputs
  const [name, setName] = useState('')
  const [objective, setObjective] = useState('')
  const [category, setCategory] = useState('promotional')
  const [segmentId, setSegmentId] = useState('')
  const [mediaPreference, setMediaPreference] = useState('none')
  const [offerDetails, setOfferDetails] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [cost, setCost] = useState('0')

  // AI Generation State
  const [generating, setGenerating] = useState(false)
  const [genStep, setGenStep] = useState(0)
  const [generatedStrategy, setGeneratedStrategy] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email' | 'landing' | 'drip'>('whatsapp')
  const [saving, setSaving] = useState(false)

  // Load segments
  useEffect(() => {
    async function loadSegments() {
      const { data } = await supabase
        .from('audience_segments')
        .select('id, name, description')
        .order('name')
      if (data) setSegments(data)
    }
    loadSegments()
  }, [supabase])

  const steps = [
    'Analyzing target segment behavioral profile...',
    'Invoking NVIDIA NIM AI to write high-conversion copy...',
    'Formulating automated multi-day drip timelines...',
    'Calibrating engagement CTR and ROI estimations...'
  ]

  const handleGenerateAI = async () => {
    if (!objective) {
      toast.error('Please specify a campaign objective')
      return
    }
    setGenerating(true)
    setGenStep(0)
    setGeneratedStrategy(null)

    // Simulate step progress for premium UX
    const interval = setInterval(() => {
      setGenStep((prev) => {
        if (prev < steps.length - 1) return prev + 1
        clearInterval(interval)
        return prev
      })
    }, 1200)

    try {
      const response = await fetch('/api/marketing/campaigns/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objective,
          category,
          targetAudience: segments.find(s => s.id === segmentId)?.name || 'All Contacts',
          mediaPreference,
          offerDetails
        })
      })

      const result = await response.json()
      clearInterval(interval)

      if (result.success) {
        setGeneratedStrategy(result.strategy)
        if (!name) {
          setName(result.strategy.strategyName || `AI-Generated ${category}`)
        }
        toast.success('AI Campaign Copy & Strategy Drafted!')
      } else {
        toast.error(result.error || 'Failed to generate campaign')
      }
    } catch (e) {
      clearInterval(interval)
      toast.error('Network error during AI generation')
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveCampaign = async () => {
    if (!name) {
      toast.error('Please enter a campaign name')
      return
    }
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Save base campaign
      const { data: campaign, error: campErr } = await supabase
        .from('campaigns')
        .insert({
          user_id: user.id,
          name,
          type: activeTab === 'email' ? 'email' : 'whatsapp',
          status: scheduledAt ? 'scheduled' : 'draft',
          audience_segment_id: segmentId || null,
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          cost: parseFloat(cost) || 0,
          category,
          media_url: mediaPreference !== 'none' ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800' : null,
          details: generatedStrategy || {
            whatsappCopy: `Exciting update! ${objective}`,
            offerDetails
          }
        })
        .select()
        .single()

      if (campErr) throw campErr

      // If Email type, also insert into email_campaigns
      if (activeTab === 'email' && generatedStrategy) {
        const { error: emailErr } = await supabase
          .from('email_campaigns')
          .insert({
            campaign_id: campaign.id,
            user_id: user.id,
            subject: generatedStrategy.emailSubject || `Update on ${name}`,
            body_html: `<div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>${generatedStrategy.landingHeadline || name}</h2>
              <p>${generatedStrategy.emailCopy}</p>
              <br/>
              <a href="#" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                ${generatedStrategy.callToAction || 'Get Started'}
              </a>
            </div>`,
            sender_email: 'marketing@maajankicrm.com'
          })

        if (emailErr) throw emailErr
      }

      toast.success(scheduledAt ? 'Campaign Scheduled Successfully!' : 'Campaign Saved as Draft!')
      
      // Clear inputs
      setName('')
      setObjective('')
      setOfferDetails('')
      setGeneratedStrategy(null)
      if (onCampaignCreated) onCampaignCreated()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save campaign')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
            AI Campaign Studio & Builder
          </h2>
          <p className="text-sm text-slate-400">Generate high-converting multi-channel campaigns powered by NVIDIA AI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* INPUT PANEL */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Layers className="h-4 w-4 text-slate-400" /> Configure Strategy Inputs
          </h3>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">Campaign Name (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. Summer Web Design Launch" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">Campaign Objective <span className="text-rose-500">*</span></label>
            <textarea 
              rows={3}
              placeholder="Describe what you want to achieve (e.g., pitch customized SEO packages to high budget website design clients who had a meeting but haven't signed up yet)" 
              value={objective} 
              onChange={(e) => setObjective(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Campaign Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="promotional">Promotional</option>
                <option value="nurturing">Lead Nurturing</option>
                <option value="follow-up">Follow-up</option>
                <option value="reminder">Payment/Meeting</option>
                <option value="reactivation">Reactivation</option>
                <option value="survey">Feedback/Survey</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Target Segment</label>
              <select
                value={segmentId}
                onChange={(e) => setSegmentId(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="">All Contacts (No Filter)</option>
                {segments.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Media Attachment</label>
              <select
                value={mediaPreference}
                onChange={(e) => setMediaPreference(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="none">No Media (Text Only)</option>
                <option value="image">Image Asset</option>
                <option value="pdf">Document / PDF</option>
                <option value="video">Video Teaser</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Campaign Cost (₹)</label>
              <input 
                type="number" 
                value={cost} 
                onChange={(e) => setCost(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">Offer / Discount Details (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. 15% discount for early bird signups this week" 
              value={offerDetails} 
              onChange={(e) => setOfferDetails(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleGenerateAI}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition-all shadow-lg shadow-indigo-500/15 disabled:opacity-50 cursor-pointer"
            >
              {generating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating Strategy...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate AI Campaign Strategy
                </>
              )}
            </button>
          </div>
        </div>

        {/* OUTPUT & PREVIEW PANEL */}
        <div className="lg:col-span-7 flex flex-col min-h-[420px] rounded-xl border border-slate-800/80 bg-slate-950/40 p-5">
          {generating ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 text-center">
              <div className="relative flex items-center justify-center">
                <div className="absolute h-16 w-16 animate-ping rounded-full bg-indigo-500/10" />
                <div className="relative h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              </div>
              <div className="space-y-2">
                <h4 className="text-md font-semibold text-white">NVIDIA NIM Coprocessor at Work</h4>
                <p className="text-sm text-indigo-400 font-medium animate-pulse">{steps[genStep]}</p>
              </div>
            </div>
          ) : generatedStrategy ? (
            <div className="flex-1 flex flex-col">
              {/* Strategy Header */}
              <div className="mb-4 flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs uppercase font-semibold text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded-full border border-indigo-500/15">
                    AI Strategic Draft
                  </span>
                  <h4 className="text-md font-bold text-white mt-1.5">{generatedStrategy.strategyName}</h4>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Best Sent</span>
                  <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" /> {generatedStrategy.bestSendingTime}
                  </p>
                </div>
              </div>

              {/* Forecast Metrics Bar */}
              <div className="mb-4 grid grid-cols-3 gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-2.5">
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Predicted CTR</span>
                  <p className="text-sm font-bold text-white flex items-center justify-center gap-0.5 mt-0.5">
                    <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
                    {generatedStrategy.expectedEngagement?.ctrPercent}%
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Opt-Out Risk</span>
                  <p className="text-sm font-bold text-white flex items-center justify-center gap-0.5 mt-0.5">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                    {generatedStrategy.expectedEngagement?.optOutPercent}%
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Target ROI</span>
                  <p className="text-sm font-bold text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                    {generatedStrategy.expectedEngagement?.estimatedRoiMultiplier}x
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="mb-4 flex border-b border-slate-800">
                {(['whatsapp', 'email', 'landing', 'drip'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`border-b-2 px-4 py-2 text-xs font-semibold capitalize transition-all cursor-pointer ${
                      activeTab === tab
                        ? 'border-indigo-500 text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab === 'whatsapp' && <span className="flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> WhatsApp</span>}
                    {tab === 'email' && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</span>}
                    {tab === 'landing' && <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Landing Copy</span>}
                    {tab === 'drip' && <span className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> Drip Flow</span>}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-y-auto max-h-[220px] rounded-lg bg-slate-950/50 p-4 border border-slate-850 text-slate-300 text-sm scrollbar-thin">
                {activeTab === 'whatsapp' && (
                  <div className="space-y-2">
                    <p className="font-semibold text-slate-400 text-xs">WhatsApp Broadcast Template:</p>
                    <div className="rounded-lg bg-emerald-950/20 border border-emerald-500/10 p-3 text-emerald-100 whitespace-pre-wrap leading-relaxed">
                      {generatedStrategy.whatsappCopy}
                    </div>
                  </div>
                )}

                {activeTab === 'email' && (
                  <div className="space-y-3">
                    <div>
                      <span className="text-slate-500 font-medium text-xs">Subject:</span>
                      <p className="font-bold text-white">{generatedStrategy.emailSubject}</p>
                    </div>
                    <div className="border-t border-slate-900 pt-2.5">
                      <p className="font-semibold text-slate-400 text-xs mb-1">Email Body Draft:</p>
                      <div className="whitespace-pre-wrap text-slate-300 leading-relaxed bg-slate-900/30 p-2.5 rounded border border-slate-900">
                        {generatedStrategy.emailCopy}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'landing' && (
                  <div className="space-y-3">
                    <div>
                      <span className="text-slate-500 font-medium text-xs">Headline:</span>
                      <p className="font-bold text-indigo-300 text-md">{generatedStrategy.landingHeadline}</p>
                    </div>
                    <div className="border-t border-slate-900 pt-2.5">
                      <span className="text-slate-500 font-medium text-xs">Benefit Statement:</span>
                      <p className="leading-relaxed mt-1">{generatedStrategy.landingBody}</p>
                    </div>
                  </div>
                )}

                {activeTab === 'drip' && (
                  <div className="space-y-4">
                    <p className="font-semibold text-slate-400 text-xs">AI-Nurtured Drip Campaign Sequence:</p>
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
                      {generatedStrategy.dripSequence?.map((step: any, idx: number) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[22px] top-1.5 h-3 w-3 rounded-full bg-indigo-500 border border-slate-950" />
                          <div className="rounded-lg bg-slate-900/60 border border-slate-800/80 p-2.5">
                            <span className="text-[10px] uppercase font-bold text-indigo-400">Day {step.day}</span>
                            <h5 className="font-semibold text-white text-xs mt-0.5">{step.subject}</h5>
                            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{step.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Schedule & Action Bar */}
              <div className="mt-4 border-t border-slate-800 pt-4 grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-indigo-400" /> Set Broadcast Time (Optional)
                  </label>
                  <input 
                    type="datetime-local" 
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setGeneratedStrategy(null)}
                    className="flex-1 rounded-lg border border-slate-800 hover:bg-slate-900 py-2 text-xs font-semibold text-slate-300 transition-all cursor-pointer"
                  >
                    Reset Draft
                  </button>
                  <button
                    onClick={handleSaveCampaign}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2 text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                    {scheduledAt ? 'Schedule' : 'Save Draft'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <Sparkles className="h-10 w-10 text-slate-750 mb-3 animate-pulse" />
              <h4 className="text-sm font-semibold text-slate-400">Draft Your Perfect Campaign Strategy</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Enter your objective and criteria on the left, then click generate. NVIDIA AI will synthesize your copy, email, and workflow instantly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
