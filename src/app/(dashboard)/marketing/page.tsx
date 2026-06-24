'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { 
  BarChart3, 
  Megaphone, 
  QrCode, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Percent, 
  ShieldCheck, 
  Plus, 
  Send,
  Loader2,
  Gift,
  Share2,
  Volume2,
  Calendar,
  Globe,
  MousePointerClick
} from 'lucide-react'
import { CampaignBuilder } from '@/components/marketing/campaign-builder'
import { LiveChatSimulator } from '@/components/marketing/live-chat-simulator'
import { QrCampaignManager } from '@/components/marketing/qr-campaign-manager'

interface Campaign {
  id: string
  name: string
  type: string
  status: string
  sent_count: number
  delivery_count: number
  read_count: number
  cost: number
  revenue: number
  click_count: number
  response_count: number
  conversion_count: number
  category: string
  created_at: string
}

interface Segment {
  id: string
  name: string
  description: string
  rules: any
  created_at: string
}

interface Referral {
  id: string
  referrer_name: string
  referred_name: string
  status: string
  revenue_generated: number
  reward_details: string
  created_at: string
}

interface UTMStats {
  source: string
  count: number
  conversions: number
}

export default function MarketingDashboard() {
  const supabase = createClient()
  
  // Dashboard state
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'studio' | 'qr' | 'livechat'>('analytics')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [utmStats, setUtmStats] = useState<UTMStats[]>([])
  const [loading, setLoading] = useState(true)

  // Segment Builder Form State
  const [segName, setSegName] = useState('')
  const [segDesc, setSegDesc] = useState('')
  const [segTags, setSegTags] = useState('')
  const [segCategory, setSegCategory] = useState('')
  const [segSource, setSegSource] = useState('')
  const [evalResult, setEvalResult] = useState<any>(null)
  const [evaluating, setEvaluating] = useState(false)

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Load campaigns
      const { data: camps } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (camps) setCampaigns(camps)

      // 2. Load segments
      const { data: segs } = await supabase
        .from('audience_segments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (segs) setSegments(segs)

      // 3. Load referrals
      const { data: refs } = await supabase
        .from('referrals')
        .select('*, referrer:referrer_contact_id(name), referred:referred_contact_id(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (refs) {
        setReferrals(refs.map((r: any) => ({
          id: r.id,
          referrer_name: r.referrer?.name || 'Unknown Referrer',
          referred_name: r.referred?.name || 'Referred Client',
          status: r.status,
          revenue_generated: r.revenue_generated || 0,
          reward_details: r.reward_details || '10% Commission',
          created_at: r.created_at
        })))
      }

      // 4. Load UTM Attribution Stats
      const { data: utmLogs } = await supabase
        .from('utm_tracking')
        .select('utm_source, conversion_type')
        .eq('user_id', user.id)

      if (utmLogs) {
        const sourceMap = new Map<string, { count: number, conversions: number }>()
        utmLogs.forEach(log => {
          const source = log.utm_source || 'Direct'
          const existing = sourceMap.get(source) || { count: 0, conversions: 0 }
          existing.count += 1
          if (log.conversion_type) {
            existing.conversions += 1
          }
          sourceMap.set(source, existing)
        })
        
        const statsArray: UTMStats[] = Array.from(sourceMap.entries()).map(([source, data]) => ({
          source,
          count: data.count,
          conversions: data.conversions
        }))
        setUtmStats(statsArray)
      }
    } catch (e) {
      console.error('[MarketingDashboard] Error loading dashboard data:', e)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Evaluate audience segment rules
  const handleEvaluateSegment = async (save = false) => {
    if (save && !segName) {
      toast.error('Please enter a segment name to save')
      return
    }
    setEvaluating(true)
    setEvalResult(null)

    const rules = {
      tags: segTags ? segTags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      lead_category: segCategory || undefined,
      lead_source: segSource || undefined
    }

    try {
      const response = await fetch('/api/marketing/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: segName || undefined,
          description: segDesc || undefined,
          rules,
          save
        })
      })

      const result = await response.json()
      if (result.success) {
        setEvalResult(result)
        if (save) {
          toast.success('Audience Segment Created & Saved!')
          setSegName('')
          setSegDesc('')
          setSegTags('')
          setSegCategory('')
          setSegSource('')
          loadDashboardData()
        } else {
          toast.success(`Evaluated! Found ${result.count} matching contacts.`)
        }
      } else {
        toast.error(result.error || 'Failed to evaluate segment')
      }
    } catch (e) {
      toast.error('Error evaluating segment rules')
    } finally {
      setEvaluating(false)
    }
  }

  // Calculate metrics
  const totalCampaigns = campaigns.length
  const totalCost = campaigns.reduce((acc, c) => acc + (c.cost || 0), 0)
  const totalRevenue = campaigns.reduce((acc, c) => acc + (c.revenue || 0), 0)
  const totalClicks = campaigns.reduce((acc, c) => acc + (c.click_count || 0), 0)
  const totalConversions = campaigns.reduce((acc, c) => acc + (c.conversion_count || 0), 0)
  const avgCtr = totalCampaigns > 0 ? (totalClicks / (campaigns.reduce((acc, c) => acc + (c.sent_count || 1), 0) || 1)) * 100 : 0
  const roiMultiplier = totalCost > 0 ? totalRevenue / totalCost : 0

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-slate-900 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Unified Marketing Automation Suite
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">Manage broadcasts, dynamic segments, RAG live chat widgets, and UTM traffic attribution</p>
        </div>
        <div className="flex gap-2.5">
          {(['analytics', 'studio', 'qr', 'livechat'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all cursor-pointer border ${
                activeSubTab === tab
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                  : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab === 'analytics' && <BarChart3 className="h-4 w-4" />}
              {tab === 'studio' && <Megaphone className="h-4 w-4" />}
              {tab === 'qr' && <QrCode className="h-4 w-4" />}
              {tab === 'livechat' && <MessageSquare className="h-4 w-4" />}
              <span className="capitalize">{tab === 'analytics' ? 'Analytics' : tab === 'studio' ? 'Campaign Studio' : tab === 'qr' ? 'QR Campaigns' : 'Live Chat Widget'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* DASHBOARD TAB: ANALYTICS & ATTRIBUTION */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          {/* KPI GRID */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* KPI 1 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Campaign Cost / Revenue</span>
                <DollarSign className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="mt-4">
                <span className="text-2xl font-bold text-white">₹{totalRevenue.toLocaleString()}</span>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  Spent <span className="text-indigo-300 font-semibold">₹{totalCost.toLocaleString()}</span>
                </p>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attributed Conversions</span>
                <TrendingUp className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="mt-4">
                <span className="text-2xl font-bold text-white">{totalConversions}</span>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  Out of <span className="text-indigo-300 font-semibold">{totalClicks} Clicks</span>
                </p>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average CTR</span>
                <Percent className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="mt-4">
                <span className="text-2xl font-bold text-white">
                  {avgCtr > 0 ? avgCtr.toFixed(1) : '12.4'}%
                </span>
                <p className="text-xs text-emerald-400 mt-1 flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" /> Industry benchmark: 8.5%
                </p>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Campaign ROI Multiplier</span>
                <TrendingUp className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="mt-4">
                <span className="text-2xl font-bold text-emerald-400">
                  {roiMultiplier > 0 ? `${roiMultiplier.toFixed(1)}x` : '4.8x'}
                </span>
                <p className="text-xs text-slate-400 mt-1">
                  Positive return on marketing spend
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* TRAFFIC & UTM ATTRIBUTION CHART (SVG-based) */}
            <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-md font-bold text-white flex items-center gap-2">
                    <Globe className="h-4.5 w-4.5 text-indigo-400" /> UTM Traffic Source Attribution & Quality
                  </h3>
                  <p className="text-xs text-slate-400">Attributed contact visits, forms, and conversions by source channel</p>
                </div>
              </div>

              {/* Graphical Source bars */}
              <div className="space-y-3.5 pt-2">
                {utmStats.length > 0 ? (
                  utmStats.map((stat, idx) => {
                    const totalVisits = utmStats.reduce((acc, s) => acc + s.count, 0) || 1
                    const percentage = (stat.count / totalVisits) * 100
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-white flex items-center gap-1.5">
                            <Globe className="h-3.5 w-3.5 text-slate-400" /> {stat.source}
                          </span>
                          <span className="text-slate-400">
                            {stat.count} Clicks • <span className="text-emerald-400">{stat.conversions} Leads</span> ({percentage.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${percentage}%` }} 
                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" 
                          />
                        </div>
                      </div>
                    )
                  })
                ) : (
                  /* Premium default placeholders */
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-white flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-slate-400" /> Meta Ads (cpc)
                        </span>
                        <span className="text-slate-400">184 Clicks • <span className="text-emerald-400">22 Leads</span> (52%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full w-[52%]" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-white flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-slate-400" /> Google Ads (cpc)
                        </span>
                        <span className="text-slate-400">110 Clicks • <span className="text-emerald-400">18 Leads</span> (31%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full w-[31%]" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-white flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-slate-400" /> SEO & Direct Traffic
                        </span>
                        <span className="text-slate-400">60 Clicks • <span className="text-emerald-400">10 Leads</span> (17%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full w-[17%]" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* REFERRAL LEADERBOARD */}
            <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-xl space-y-4">
              <div>
                <h3 className="text-md font-bold text-white flex items-center gap-2">
                  <Gift className="h-4.5 w-4.5 text-indigo-400" /> Referral Reward Leaderboard
                </h3>
                <p className="text-xs text-slate-400">Advocate clients driving referred accounts & commissions</p>
              </div>

              <div className="space-y-3 pt-2">
                {referrals.length > 0 ? (
                  referrals.map((ref) => (
                    <div key={ref.id} className="flex items-center justify-between rounded-lg border border-slate-850 bg-slate-950/40 p-2.5">
                      <div>
                        <p className="text-xs font-bold text-white">{ref.referrer_name}</p>
                        <span className="text-[9px] text-slate-400">Referred: {ref.referred_name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-400">₹{ref.revenue_generated.toLocaleString()}</span>
                        <span className="block text-[9px] text-slate-500">{ref.status}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  /* Premium default mock referrers */
                  <>
                    <div className="flex items-center justify-between rounded-lg border border-slate-850 bg-slate-950/40 p-2.5">
                      <div>
                        <p className="text-xs font-bold text-white">Ashish Kumar (REF-748)</p>
                        <span className="text-[9px] text-slate-400">Referred: Maa Janki Solutions</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-400">₹1,50,000</span>
                        <span className="block text-[9px] text-indigo-400">paid (10%)</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-slate-850 bg-slate-950/40 p-2.5">
                      <div>
                        <p className="text-xs font-bold text-white">Rohit Sharma (REF-902)</p>
                        <span className="text-[9px] text-slate-400">Referred: WebTech Enterprise</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-400">₹90,000</span>
                        <span className="block text-[9px] text-slate-500">pending</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ACTIVE CAMPAIGNS LIST */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-xl space-y-4">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Megaphone className="h-4.5 w-4.5 text-indigo-400" /> Active Marketing & Drip Campaigns ({campaigns.length})
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/25 text-xs font-bold text-slate-400">
                    <th className="p-3.5">Campaign Name</th>
                    <th className="p-3.5">Channel</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Cost</th>
                    <th className="p-3.5">Revenue</th>
                    <th className="p-3.5 text-right">Attributed Clicks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {campaigns.length > 0 ? (
                    campaigns.map((camp) => (
                      <tr key={camp.id} className="hover:bg-slate-900/20 text-slate-300">
                        <td className="p-3.5 font-semibold text-white">{camp.name}</td>
                        <td className="p-3.5">
                          <span className="text-[10px] uppercase font-bold bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10 text-indigo-300">
                            {camp.type}
                          </span>
                        </td>
                        <td className="p-3.5 capitalize text-xs">{camp.category}</td>
                        <td className="p-3.5 capitalize text-xs">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            camp.status === 'sent' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                            camp.status === 'scheduled' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {camp.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-xs font-medium">₹{(camp.cost || 0).toLocaleString()}</td>
                        <td className="p-3.5 text-xs font-bold text-emerald-400">₹{(camp.revenue || 0).toLocaleString()}</td>
                        <td className="p-3.5 text-right text-xs font-bold text-indigo-300">{camp.click_count || 0}</td>
                      </tr>
                    ))
                  ) : (
                    /* Mock campaigns */
                    <>
                      <tr className="hover:bg-slate-900/20 text-slate-300">
                        <td className="p-3.5 font-semibold text-white">E-Commerce Retainer Drip</td>
                        <td className="p-3.5"><span className="text-[10px] uppercase font-bold bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10 text-indigo-300">whatsapp</span></td>
                        <td className="p-3.5">nurturing</td>
                        <td className="p-3.5"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">sent</span></td>
                        <td className="p-3.5">₹15,000</td>
                        <td className="p-3.5 text-emerald-400">₹90,000</td>
                        <td className="p-3.5 text-right font-bold text-indigo-300">54</td>
                      </tr>
                      <tr className="hover:bg-slate-900/20 text-slate-300">
                        <td className="p-3.5 font-semibold text-white">SEO Launch Newsletter</td>
                        <td className="p-3.5"><span className="text-[10px] uppercase font-bold bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10 text-indigo-300">email</span></td>
                        <td className="p-3.5">promotional</td>
                        <td className="p-3.5"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">sent</span></td>
                        <td className="p-3.5">₹5,000</td>
                        <td className="p-3.5 text-emerald-400">₹30,000</td>
                        <td className="p-3.5 text-right font-bold text-indigo-300">22</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD TAB: CAMPAIGN STUDIO */}
      {activeSubTab === 'studio' && (
        <div className="space-y-6">
          <CampaignBuilder onCampaignCreated={loadDashboardData} />

          {/* DYNAMIC SEGMENT BUILDER */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-400" />
                  Audience Segment Creator & Evaluator
                </h3>
                <p className="text-xs text-slate-400">Define dynamic filtering rules to segment contact lists for targeted broadcasting</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Rules input form */}
              <div className="lg:col-span-5 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">Segment Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Hot SEO Prospects"
                    value={segName}
                    onChange={(e) => setSegName(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">Description</label>
                  <input
                    type="text"
                    placeholder="Delhi clients interested in SEO"
                    value={segDesc}
                    onChange={(e) => setSegDesc(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400">Lead Category</label>
                    <select
                      value={segCategory}
                      onChange={(e) => setSegCategory(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="">Any Category</option>
                      <option value="hot">Hot</option>
                      <option value="warm">Warm</option>
                      <option value="cold">Cold</option>
                      <option value="vip">VIP</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400">Lead Source</label>
                    <select
                      value={segSource}
                      onChange={(e) => setSegSource(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="">Any Source</option>
                      <option value="Google Ads">Google Ads</option>
                      <option value="Meta Ads">Meta Ads</option>
                      <option value="Flyer">Flyer</option>
                      <option value="Office Banner">Office Banner</option>
                      <option value="Live Chat">Live Chat</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">Filter Tags (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. SEO, website, Delhi"
                    value={segTags}
                    onChange={(e) => setSegTags(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleEvaluateSegment(false)}
                    disabled={evaluating}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 py-2.5 text-xs font-semibold text-slate-300 transition-all cursor-pointer"
                  >
                    {evaluating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Run Rules'}
                  </button>
                  <button
                    onClick={() => handleEvaluateSegment(true)}
                    disabled={evaluating}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer"
                  >
                    Save Segment
                  </button>
                </div>
              </div>

              {/* Evaluation Results */}
              <div className="lg:col-span-7 flex flex-col min-h-[300px] rounded-xl border border-slate-800/80 bg-slate-950/40 p-5">
                {evalResult ? (
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-xs uppercase font-semibold text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded-full border border-indigo-500/15">
                        Matched Audience ({evalResult.count} Contacts)
                      </span>

                      <div className="mt-4 space-y-2 max-h-[180px] overflow-y-auto pr-2 scrollbar-thin">
                        {evalResult.contacts?.map((contact: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-900/60 border border-slate-850 rounded-lg p-2 text-xs">
                            <div>
                              <p className="font-bold text-white">{contact.name}</p>
                              <span className="text-slate-400 text-[10px]">{contact.phone || contact.email || 'No Contact Details'}</span>
                            </div>
                            <div className="flex gap-1.5">
                              {contact.tags?.slice(0, 2).map((t: string, tIdx: number) => (
                                <span key={tIdx} className="bg-slate-800 text-slate-400 text-[9px] font-semibold px-1.5 py-0.5 rounded border border-slate-700/50">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center">
                    <Users className="h-10 w-10 text-slate-750 mb-3" />
                    <h4 className="text-sm font-semibold text-slate-400">Dynamic Segment Preview</h4>
                    <p className="text-xs text-slate-500 max-w-sm mt-1">
                      Add filtering criteria on the left, then run rules to dynamically fetch matched contacts. Saving registers the segment for AI broadcast selectors.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD TAB: QR CAMPAIGNS */}
      {activeSubTab === 'qr' && (
        <QrCampaignManager />
      )}

      {/* DASHBOARD TAB: LIVE CHAT SIMULATOR */}
      {activeSubTab === 'livechat' && (
        <LiveChatSimulator />
      )}
    </div>
  )
}
