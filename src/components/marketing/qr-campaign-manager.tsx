'use client'

import React, { useState, useRef } from 'react'
import { toast } from 'sonner'
import { 
  QrCode, 
  Download, 
  Link2, 
  MessageSquare, 
  ScanLine, 
  Activity, 
  ExternalLink,
  PlusCircle,
  TrendingUp,
  FileText
} from 'lucide-react'

interface QRQampaign {
  id: string
  name: string
  source: string
  medium: string
  campaign: string
  waText: string
  scans: number
}

export function QrCampaignManager() {
  // Mock initial campaigns
  const [campaigns, setCampaigns] = useState<QRQampaign[]>([
    { id: '1', name: 'Flyer Distribution', source: 'Flyer', medium: 'print', campaign: 'flyer_delhi_2026', waText: 'Hi! I saw your Delhi flyer and want to inquire about website development.', scans: 48 },
    { id: '2', name: 'Delhi Office Banner', source: 'Office Banner', medium: 'print', campaign: 'banner_hq_delhi', waText: 'Hello! Scanning from Delhi HQ. I would like a free SEO audit.', scans: 124 }
  ])

  // Form states
  const [name, setName] = useState('')
  const [source, setSource] = useState('Flyer')
  const [medium, setMedium] = useState('print')
  const [campaign, setCampaign] = useState('offline_event_2026')
  const [waText, setWaText] = useState('Hi! I scanned the QR code and want to learn more about Maajanki CRM.')

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !campaign) {
      toast.error('Name and Campaign Tag are required')
      return
    }

    const newCamp: QRQampaign = {
      id: String(campaigns.length + 1),
      name,
      source,
      medium,
      campaign,
      waText,
      scans: 0
    }

    setCampaigns(prev => [newCamp, ...prev])
    setName('')
    setWaText('Hi! I scanned the QR code and want to learn more.')
    toast.success('Offline QR Campaign Registered!')
  }

  const handleSimulateScan = async (camp: QRQampaign) => {
    try {
      // Simulate scanning the QR and landing on Maajanki's WhatsApp CRM
      const response = await fetch('/api/marketing/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urlPath: `/qr/${camp.campaign}`,
          utmSource: camp.source,
          utmMedium: camp.medium,
          utmCampaign: camp.campaign,
          deviceType: 'Mobile',
          locationCountry: 'IN',
          conversionType: 'lead_form',
          name: `Scan-Lead-${Math.floor(1000 + Math.random() * 9000)}`,
          email: `scan.${camp.campaign}.${Math.floor(Math.random()*100)}@example.com`
        })
      })

      const result = await response.json()
      if (result.success) {
        // Increment local scan counts
        setCampaigns(prev => prev.map(c => c.id === camp.id ? { ...c, scans: c.scans + 1 } : c))
        toast.success(`Scan Attribution Logged! New Lead added with campaign tag: ${camp.campaign}`)
      } else {
        toast.error(result.error || 'Scan simulation failed')
      }
    } catch (e) {
      toast.error('Network error during scan simulation')
    }
  }

  // Draw a premium Canvas-based QR code representation
  const drawMockQR = (camp: QRQampaign) => {
    return (
      <div className="relative flex flex-col items-center justify-center p-3 rounded-xl border border-slate-800 bg-slate-950 h-32 w-32 group hover:border-indigo-500/50 transition-all">
        {/* Visual Mock QR Code Grid using beautiful absolute CSS dots/blocks */}
        <div className="grid grid-cols-5 gap-1.5 h-20 w-20 opacity-85 group-hover:opacity-100 transition-opacity">
          {/* Pos 1 */}
          <div className="bg-white rounded-[2px] flex items-center justify-center p-0.5">
            <div className="bg-slate-950 h-full w-full rounded-[1px] flex items-center justify-center p-0.5">
              <div className="bg-white h-full w-full rounded-[0.5px]" />
            </div>
          </div>
          <div className="bg-white rounded-[2px]" />
          <div className="bg-slate-800 rounded-[2px]" />
          <div className="bg-indigo-400 rounded-[2px]" />
          {/* Pos 2 */}
          <div className="bg-white rounded-[2px] flex items-center justify-center p-0.5">
            <div className="bg-slate-950 h-full w-full rounded-[1px] flex items-center justify-center p-0.5">
              <div className="bg-white h-full w-full rounded-[0.5px]" />
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2px]" />
          <div className="bg-white rounded-[2px]" />
          <div className="bg-slate-800 rounded-[2px]" />
          <div className="bg-white rounded-[2px]" />
          <div className="bg-indigo-400 rounded-[2px]" />

          <div className="bg-indigo-400 rounded-[2px]" />
          <div className="bg-slate-800 rounded-[2px]" />
          <div className="bg-white rounded-[2px] h-2 w-2 mx-auto mt-1" />
          <div className="bg-slate-900 rounded-[2px]" />
          <div className="bg-white rounded-[2px]" />

          <div className="bg-white rounded-[2px]" />
          <div className="bg-slate-800 rounded-[2px]" />
          <div className="bg-indigo-400 rounded-[2px]" />
          <div className="bg-white rounded-[2px]" />
          <div className="bg-slate-800 rounded-[2px]" />

          {/* Pos 3 */}
          <div className="bg-white rounded-[2px] flex items-center justify-center p-0.5">
            <div className="bg-slate-950 h-full w-full rounded-[1px] flex items-center justify-center p-0.5">
              <div className="bg-white h-full w-full rounded-[0.5px]" />
            </div>
          </div>
          <div className="bg-white rounded-[2px]" />
          <div className="bg-slate-800 rounded-[2px]" />
          <div className="bg-indigo-400 rounded-[2px]" />
          <div className="bg-slate-900 rounded-[2px]" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/85 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
          <ScanLine className="h-6 w-6 text-indigo-400 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <QrCode className="h-5 w-5 text-indigo-400" />
            Offline QR Code & Scan Attribution Campaigns
          </h3>
          <p className="text-xs text-slate-400">Generate tracking codes for banners, flyers, and print ads to capture WhatsApp leads</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Form to create QR campaign */}
        <form onSubmit={handleCreateCampaign} className="lg:col-span-4 space-y-3">
          <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5 mb-2">
            <PlusCircle className="h-4 w-4" /> Create New QR Campaign
          </span>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-slate-400">Campaign Name</label>
            <input 
              type="text"
              placeholder="e.g Delhi Event Flyer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-slate-400">Source Tag</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Flyer">Flyer</option>
                <option value="Billboard">Billboard</option>
                <option value="Brochure">Brochure</option>
                <option value="Office Banner">Office Banner</option>
                <option value="Newspaper Ad">Newspaper Ad</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-slate-400">Campaign Tag</label>
              <input 
                type="text"
                placeholder="delhi_flyer_2026"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-slate-400">WhatsApp Auto-Text Template</label>
            <textarea
              rows={3}
              placeholder="Pre-filled message when client scans QR..."
              value={waText}
              onChange={(e) => setWaText(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2 text-xs font-semibold text-white transition-all cursor-pointer"
          >
            Create Tracking QR
          </button>
        </form>

        {/* QR Campaign List */}
        <div className="lg:col-span-8 space-y-3.5">
          <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
            <Activity className="h-4 w-4" /> Active Print & QR Campaigns ({campaigns.length})
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((camp) => (
              <div key={camp.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 flex gap-4 items-center justify-between hover:border-slate-750 transition-all">
                <div className="flex-1 space-y-2">
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">{camp.name}</h4>
                    <p className="text-[10px] text-indigo-400 font-medium mt-0.5">utm_campaign={camp.campaign}</p>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-slate-400">
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-500">Scans</span>
                      <span className="text-xs font-bold text-white flex items-center gap-1 mt-0.5">
                        <TrendingUp className="h-3 w-3 text-emerald-400" /> {camp.scans}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-500">Source</span>
                      <span className="text-white font-medium block mt-0.5">{camp.source}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSimulateScan(camp)}
                      className="rounded bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/20 text-[10px] font-bold text-indigo-300 px-2 py-1 transition-all cursor-pointer"
                    >
                      Simulate Scan
                    </button>
                    <button
                      onClick={() => {
                        const link = `https://wa.me/919999999999?text=${encodeURIComponent(camp.waText)}`
                        navigator.clipboard.writeText(link)
                        toast.success('WhatsApp Deep Link copied!')
                      }}
                      className="rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold text-slate-300 px-2 py-1 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Link2 className="h-3 w-3" /> Copy URL
                    </button>
                  </div>
                </div>
                <div>
                  {drawMockQR(camp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
