'use client'

import React, { useState } from 'react'
import { toast } from 'sonner'
import { 
  MessageSquare, 
  Send, 
  User, 
  Mail, 
  Phone, 
  ChevronDown, 
  ChevronUp, 
  UserCheck, 
  Activity,
  Globe,
  MapPin,
  Sparkles,
  RefreshCw
} from 'lucide-react'

export function LiveChatSimulator() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'landing' | 'chat'>('landing')
  
  // UTM & Attribution Simulator Inputs
  const [utmSource, setUtmSource] = useState('Meta Ads')
  const [utmMedium, setUtmMedium] = useState('cpc')
  const [utmCampaign, setUtmCampaign] = useState('summer_accelerate_seo')
  const [deviceType, setDeviceType] = useState('Mobile')
  const [location, setLocation] = useState('India')
  
  // Lead Details
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [contactId, setContactId] = useState<string | null>(null)
  
  // Chat Messages
  const [messages, setMessages] = useState<Array<{ sender: 'visitor' | 'bot' | 'system', text: string }>>([
    { sender: 'bot', text: '👋 Hello! I am Maajanki AI. Ask me anything about our services, package rates, or business registration options!' }
  ])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [handedOff, setHandedOff] = useState(false)

  const handleSimulateVisit = async () => {
    try {
      const response = await fetch('/api/marketing/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || undefined,
          email: email || undefined,
          phone: phone || undefined,
          urlPath: '/services/seo-optimization',
          utmSource,
          utmMedium,
          utmCampaign,
          deviceType,
          locationCountry: location,
          conversionType: name || email ? 'lead_form' : undefined
        })
      })

      const result = await response.json()
      if (result.success) {
        setContactId(result.contactId)
        toast.success(`Attribution Logged! Lead Linked (ID: ${result.contactId.slice(0, 8)}...)`)
        setActiveTab('chat')
        // Append system log to chat
        setMessages(prev => [
          ...prev,
          { sender: 'system', text: `Attribution tracked: Source = ${utmSource}, Campaign = ${utmCampaign}. Lead profile established.` }
        ])
      } else {
        toast.error(result.error || 'Tracking failed')
      }
    } catch (e) {
      toast.error('Network error during attribution tracking')
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || loading || handedOff) return

    const visitorText = inputText
    setInputText('')
    setMessages(prev => [...prev, { sender: 'visitor', text: visitorText }])
    setLoading(true)

    try {
      const response = await fetch('/api/marketing/livechat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: contactId || undefined,
          name: name || undefined,
          email: email || undefined,
          phone: phone || undefined,
          message: visitorText
        })
      })

      const result = await response.json()
      if (result.success) {
        if (result.contactId && !contactId) {
          setContactId(result.contactId)
        }
        setMessages(prev => [...prev, { sender: 'bot', text: result.reply }])
      } else {
        toast.error(result.error || 'Failed to get chat reply')
      }
    } catch (err) {
      toast.error('Error connecting to chat provider')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestHandoff = async () => {
    if (handedOff) return
    setLoading(true)

    try {
      const response = await fetch('/api/marketing/livechat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: contactId || undefined,
          wantsHuman: true
        })
      })

      const result = await response.json()
      if (result.success) {
        setHandedOff(true)
        setMessages(prev => [
          ...prev,
          { sender: 'bot', text: result.reply },
          { sender: 'system', text: 'Human takeover activated. Conversation status: pending agent response.' }
        ])
        toast.info('Human support representative paged.')
      } else {
        toast.error(result.error || 'Takeover request failed')
      }
    } catch (e) {
      toast.error('Error request takeover')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setName('')
    setEmail('')
    setPhone('')
    setContactId(null)
    setHandedOff(false)
    setMessages([
      { sender: 'bot', text: '👋 Hello! I am Maajanki AI. Ask me anything about our services, package rates, or business registration options!' }
    ])
    setActiveTab('landing')
    toast.success('Simulation cleared. Ready for fresh test.')
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl flex flex-col justify-between">
      <div>
        <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-400" />
              UTM, Attribution & Live Chat Simulator
            </h3>
            <p className="text-xs text-slate-400">Test how marketing campaign clicks capture leads and trigger RAG answers</p>
          </div>
          {contactId && (
            <button 
              onClick={handleReset}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white border border-slate-800 rounded-lg px-2 py-1 bg-slate-950 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" /> Reset
            </button>
          )}
        </div>

        {/* Tab Selection */}
        <div className="mb-4 flex rounded-lg bg-slate-950 p-1 border border-slate-900">
          <button
            onClick={() => setActiveTab('landing')}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'landing' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Simulate Landing UTM Visit
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'chat' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Live Chat Simulator
          </button>
        </div>

        {/* TAB 1: LANDING PAGE & UTM PARAMETERS */}
        {activeTab === 'landing' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">UTM Source</label>
                <select
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Google Ads">Google Ads</option>
                  <option value="Meta Ads">Meta Ads</option>
                  <option value="SEO Newsletter">SEO Newsletter</option>
                  <option value="YouTube Blog">YouTube Video</option>
                  <option value="LinkedIn Post">LinkedIn Post</option>
                  <option value="Referral Code">Referral System</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">UTM Medium</label>
                <input 
                  type="text" 
                  value={utmMedium} 
                  onChange={(e) => setUtmMedium(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">UTM Campaign</label>
                <input 
                  type="text" 
                  value={utmCampaign} 
                  onChange={(e) => setUtmCampaign(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5">
                <Globe className="h-4 w-4 text-indigo-400" />
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Device</span>
                  <select 
                    value={deviceType} 
                    onChange={(e) => setDeviceType(e.target.value)}
                    className="bg-transparent text-xs text-white border-none focus:outline-none p-0 cursor-pointer"
                  >
                    <option value="Mobile">Mobile (iOS)</option>
                    <option value="Desktop">Desktop (Chrome)</option>
                    <option value="Tablet">Tablet (iPad)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5">
                <MapPin className="h-4 w-4 text-indigo-400" />
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Location</span>
                  <select 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)}
                    className="bg-transparent text-xs text-white border-none focus:outline-none p-0 cursor-pointer"
                  >
                    <option value="India">India (IN)</option>
                    <option value="United States">United States (US)</option>
                    <option value="United Arab Emirates">Dubai (AE)</option>
                    <option value="United Kingdom">London (UK)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Optional Lead Form Submission */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 space-y-3">
              <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5" /> Lead Form Capture (Simulate Form Submission)
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-650" />
                  <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-650" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-650" />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSimulateVisit}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-sm font-semibold text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10"
            >
              <Globe className="h-4 w-4" /> Simulate Campaign Click & Page Visit
            </button>
          </div>
        )}

        {/* TAB 2: LIVE CHAT WINDOW */}
        {activeTab === 'chat' && (
          <div className="space-y-3 flex flex-col">
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 h-[240px] overflow-y-auto flex flex-col gap-2.5 scrollbar-thin">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${
                    msg.sender === 'visitor' 
                      ? 'justify-end' 
                      : msg.sender === 'system'
                      ? 'justify-center'
                      : 'justify-start'
                  }`}
                >
                  {msg.sender === 'system' ? (
                    <div className="rounded bg-slate-900 border border-slate-800 px-2 py-1 text-[10px] font-medium text-slate-400 max-w-[90%] text-center">
                      {msg.text}
                    </div>
                  ) : (
                    <div 
                      className={`rounded-xl px-3 py-2 text-xs max-w-[80%] leading-relaxed ${
                        msg.sender === 'visitor'
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-xl px-3 py-2 text-xs bg-slate-900 border border-slate-800 text-slate-400 rounded-tl-none flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-spin" />
                    Maajanki AI is looking up rates...
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
              <input
                type="text"
                placeholder={handedOff ? 'Live support requested...' : 'Ask catalog prices (e.g. Price of E-commerce portal?)'}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={loading || handedOff}
                className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || handedOff || !inputText.trim()}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 p-2 text-white disabled:opacity-40 transition-all cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>

            <div className="flex items-center justify-between border-t border-slate-850 pt-2 text-[10px]">
              <span className="text-slate-500 flex items-center gap-1">
                <MessageSquare className="h-3 w-3" /> Simulated channel: Website Live Chat
              </span>
              <button
                type="button"
                onClick={handleRequestHandoff}
                disabled={loading || handedOff}
                className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer disabled:opacity-50"
              >
                {handedOff ? '✓ Takeover Pending' : '⚠️ Request Agent Handoff'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
