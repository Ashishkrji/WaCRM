'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  Video,
  Plus,
  Sparkles,
  FileText,
  CheckCircle,
  Loader2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Meeting {
  id: string;
  title: string;
  start_time: string;
  platform: 'google_meet' | 'zoom' | 'teams' | 'other';
  meeting_link?: string;
  agenda?: string;
  notes?: string;
  summary?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface MeetingSchedulerProps {
  contactId: string;
  meetings: Meeting[];
  onRefresh: () => void;
}

export function MeetingScheduler({ contactId, meetings = [], onRefresh }: MeetingSchedulerProps) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'summarize'>('schedule');
  
  // Schedule Form State
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [platform, setPlatform] = useState<'google_meet' | 'zoom' | 'teams' | 'other'>('google_meet');
  const [meetingLink, setMeetingLink] = useState('');
  const [agenda, setAgenda] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Summarizer State
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
  const [transcript, setTranscript] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summarizeError, setSummarizeError] = useState<string | null>(null);
  const [summarizeSuccess, setSummarizeSuccess] = useState(false);

  // Expansion of meetings list
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime) {
      setScheduleError('Please fill in the meeting title and start time.');
      return;
    }

    setIsSubmitting(true);
    setScheduleError(null);

    try {
      const response = await fetch(`/api/contacts/${contactId}/meetings/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          startTime,
          platform,
          meetingLink,
          agenda,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to schedule meeting');
      }

      // Reset form
      setTitle('');
      setStartTime('');
      setPlatform('google_meet');
      setMeetingLink('');
      setAgenda('');
      onRefresh();
    } catch (err: any) {
      setScheduleError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSummarize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeetingId || !transcript.trim()) {
      setSummarizeError('Please select a meeting and paste the transcript/notes.');
      return;
    }

    setIsSummarizing(true);
    setSummarizeError(null);
    setSummarizeSuccess(false);

    try {
      const response = await fetch(`/api/contacts/${contactId}/meetings/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId: selectedMeetingId,
          transcript,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to summarize meeting');
      }

      setSummarizeSuccess(true);
      setTranscript('');
      setSelectedMeetingId('');
      onRefresh();
    } catch (err: any) {
      setSummarizeError(err.message || 'Summary generation failed.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const getPlatformIcon = (plt: Meeting['platform']) => {
    switch (plt) {
      case 'google_meet':
      case 'zoom':
      case 'teams':
        return <Video className="size-3.5 text-indigo-400" />;
      default:
        return <Calendar className="size-3.5 text-slate-400" />;
    }
  };

  const getPlatformLabel = (plt: Meeting['platform']) => {
    if (plt === 'google_meet') return 'Google Meet';
    if (plt === 'zoom') return 'Zoom';
    if (plt === 'teams') return 'MS Teams';
    return 'Other/Call';
  };

  return (
    <div className="bg-slate-950 border border-slate-850 rounded-2xl shadow-xl overflow-hidden">
      {/* Header Tabs */}
      <div className="flex border-b border-slate-850 bg-slate-900/40">
        <button
          onClick={() => setActiveTab('schedule')}
          className={cn(
            'flex-1 py-3.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2',
            activeTab === 'schedule'
              ? 'border-primary text-white bg-slate-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          )}
        >
          <Calendar className="size-4" />
          Schedule Consultation
        </button>
        <button
          onClick={() => setActiveTab('summarize')}
          className={cn(
            'flex-1 py-3.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2',
            activeTab === 'summarize'
              ? 'border-primary text-white bg-slate-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          )}
        >
          <Sparkles className="size-4 text-indigo-450" />
          AI Meeting Summarizer
        </button>
      </div>

      <div className="p-5">
        {/* Tab 1: Schedule Form */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <form onSubmit={handleSchedule} className="space-y-4">
              {scheduleError && (
                <div className="bg-rose-950/20 border border-rose-500/20 p-3 rounded-xl flex items-center gap-2.5 text-rose-400 text-xs">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{scheduleError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Meeting Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Requirements Kickoff Call"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full h-9 bg-slate-900/50 border border-slate-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full h-9 bg-slate-900/50 border border-slate-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Platform</label>
                  <select
                    value={platform}
                    onChange={e => setPlatform(e.target.value as any)}
                    className="w-full h-9 bg-slate-900/50 border border-slate-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-primary transition-all"
                  >
                    <option value="google_meet">Google Meet</option>
                    <option value="zoom">Zoom Video</option>
                    <option value="teams">Microsoft Teams</option>
                    <option value="other">Phone Call / Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Meeting Link (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={meetingLink}
                    onChange={e => setMeetingLink(e.target.value)}
                    className="w-full h-9 bg-slate-900/50 border border-slate-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Consultation Agenda</label>
                <textarea
                  placeholder="Describe the objective and topics to be discussed..."
                  rows={2}
                  value={agenda}
                  onChange={e => setAgenda(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-primary transition-all resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-9 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Plus className="size-3.5" />
                    Book Consultation Meeting
                  </>
                )}
              </Button>
            </form>

            {/* Meetings List */}
            <div className="border-t border-slate-850 pt-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 tracking-wide">Upcoming & Past Meetings ({meetings.length})</h4>
              {meetings.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">No consultations scheduled yet.</p>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {meetings.map(m => {
                    const isNotesExpanded = !!expandedNotes[m.id];
                    return (
                      <div
                        key={m.id}
                        className="bg-slate-900/20 border border-slate-850 p-3 rounded-xl space-y-2 hover:bg-slate-900/40 transition-all"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg">
                              {getPlatformIcon(m.platform)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white leading-tight">{m.title}</p>
                              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Clock className="size-2.5" />
                                {format(new Date(m.start_time), 'MMM dd, yyyy HH:mm')}
                              </span>
                            </div>
                          </div>
                          <Badge className={cn(
                            'text-[9px] font-bold border uppercase',
                            m.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' :
                            m.status === 'cancelled' ? 'bg-slate-900 text-slate-500 border-slate-800' :
                            'bg-indigo-500/10 text-indigo-400 border-indigo-500/25 animate-pulse'
                          )}>
                            {m.status}
                          </Badge>
                        </div>

                        {m.agenda && <p className="text-[11px] text-slate-400 italic line-clamp-1">Agenda: {m.agenda}</p>}
                        
                        {m.meeting_link && (
                          <a
                            href={m.meeting_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-sky-400 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <ExternalLink className="size-2.5" />
                            Join {getPlatformLabel(m.platform)}
                          </a>
                        )}

                        {m.summary && (
                          <div className="mt-1 pt-1.5 border-t border-slate-850/50 space-y-1">
                            <button
                              onClick={() => setExpandedNotes(prev => ({ ...prev, [m.id]: !isNotesExpanded }))}
                              className="text-[9px] font-bold text-indigo-450 hover:text-indigo-400 uppercase tracking-wider flex items-center gap-0.5"
                            >
                              {isNotesExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                              AI Meeting Intelligence
                            </button>
                            {isNotesExpanded && (
                              <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/40 p-2 rounded border border-slate-850 font-sans mt-1">
                                {m.summary}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Summarizer Form */}
        {activeTab === 'summarize' && (
          <form onSubmit={handleSummarize} className="space-y-4">
            {summarizeError && (
              <div className="bg-rose-950/20 border border-rose-500/20 p-3 rounded-xl flex items-center gap-2.5 text-rose-400 text-xs">
                <AlertCircle className="size-4 shrink-0" />
                <span>{summarizeError}</span>
              </div>
            )}

            {summarizeSuccess && (
              <div className="bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-2.5 text-emerald-400 text-xs">
                <CheckCircle className="size-4 shrink-0" />
                <span>AI successfully analyzed the meeting. Summary stored and follow-up tasks inserted into CRM!</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Scheduled Meeting</label>
              <select
                required
                value={selectedMeetingId}
                onChange={e => setSelectedMeetingId(e.target.value)}
                className="w-full h-9 bg-slate-900/50 border border-slate-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-primary transition-all"
              >
                <option value="">-- Choose a scheduled meeting --</option>
                {meetings
                  .filter(m => m.status !== 'cancelled')
                  .map(m => (
                    <option key={m.id} value={m.id}>
                      [{format(new Date(m.start_time), 'MMM dd')}] {m.title} ({getPlatformLabel(m.platform)})
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Meeting Transcript or Call Notes</label>
                <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[9px] uppercase px-1.5 py-0.5">
                  Premium NVIDIA AI
                </Badge>
              </div>
              <textarea
                required
                placeholder="Paste the zoom transcript, chat logs, or detailed meeting notes here. Our AI will analyze requirements, draft a summary, and auto-populate your CRM task pipeline..."
                rows={6}
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-primary transition-all font-mono leading-relaxed"
              />
            </div>

            <Button
              type="submit"
              disabled={isSummarizing || !selectedMeetingId || !transcript}
              className="w-full h-9 bg-indigo-650 hover:bg-indigo-600 disabled:bg-indigo-950/35 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/30"
            >
              {isSummarizing ? (
                <>
                  <Loader2 className="size-3.5 animate-spin text-white" />
                  AI Writing Summary & Extracting Actions...
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5 text-amber-400" />
                  Run AI Meeting Analysis
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
