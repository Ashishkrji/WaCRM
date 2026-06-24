'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Search,
  User,
  MessageSquare,
  Receipt,
  CheckSquare,
  X,
  Command,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResults {
  contacts: any[];
  messages: any[];
  invoices: any[];
  tasks: any[];
}

export function GlobalSearchModal({ isOpen, onOpenChange }: GlobalSearchModalProps) {
  const router = useRouter();
  const supabase = createClient();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({
    contacts: [],
    messages: [],
    invoices: [],
    tasks: [],
  });
  const [searching, setSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle modal with Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!isOpen);
      }
      if (e.key === 'Escape' && isOpen) {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onOpenChange]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults({ contacts: [], messages: [], invoices: [], tasks: [] });
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Flattened results for keyboard navigation
  const flatResults = useMemo(() => {
    const list: { id: string; type: 'contact' | 'message' | 'invoice' | 'task'; title: string; subtitle: string; url: string }[] = [];
    
    results.contacts.forEach(c => {
      list.push({
        id: c.id,
        type: 'contact',
        title: c.name || 'Unknown Contact',
        subtitle: `Phone: ${c.phone} ${c.company ? `| Company: ${c.company}` : ''} ${c.industry ? `| ${c.industry}` : ''}`,
        url: `/contacts/${c.id}`,
      });
    });

    results.messages.forEach(m => {
      list.push({
        id: m.id,
        type: 'message',
        title: m.conversations?.contacts?.name || 'WhatsApp Chat',
        subtitle: `Message: "${m.content_text || ''}"`,
        url: `/inbox?contact=${m.conversations?.contact_id}`,
      });
    });

    results.invoices.forEach(inv => {
      list.push({
        id: inv.id,
        type: 'invoice',
        title: `Invoice #${inv.invoice_number}`,
        subtitle: `Amount: $${inv.amount.toLocaleString()} | Client: ${inv.contacts?.name || 'Unknown'} | Status: ${inv.status.toUpperCase()}`,
        url: `/contacts/${inv.contact_id}`,
      });
    });

    results.tasks.forEach(t => {
      list.push({
        id: t.id,
        type: 'task',
        title: t.title,
        subtitle: `Task | Priority: ${t.priority.toUpperCase()} | Client: ${t.contacts?.name || 'Unknown'}`,
        url: `/contacts/${t.contact_id}`,
      });
    });

    return list;
  }, [results]);

  // Perform multi-table parallel search
  const performSearch = useCallback(async (val: string) => {
    if (!val.trim()) {
      setResults({ contacts: [], messages: [], invoices: [], tasks: [] });
      return;
    }
    setSearching(true);
    const likeTerm = `%${val.trim()}%`;

    try {
      const [contactsRes, messagesRes, invoicesRes, tasksRes] = await Promise.all([
        supabase
          .from('contacts')
          .select('*')
          .or(`name.ilike.${likeTerm},phone.ilike.${likeTerm},email.ilike.${likeTerm},company.ilike.${likeTerm},industry.ilike.${likeTerm}`)
          .limit(4),
        supabase
          .from('messages')
          .select('*, conversations(contact_id, contacts(name))')
          .ilike('content_text', likeTerm)
          .limit(4),
        supabase
          .from('invoices')
          .select('*, contacts(name)')
          .ilike('invoice_number', likeTerm)
          .limit(3),
        supabase
          .from('tasks')
          .select('*, contacts(name)')
          .or(`title.ilike.${likeTerm},description.ilike.${likeTerm}`)
          .limit(3),
      ]);

      setResults({
        contacts: contactsRes.data || [],
        messages: messagesRes.data || [],
        invoices: invoicesRes.data || [],
        tasks: tasksRes.data || [],
      });
      setSelectedIndex(0);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  }, [supabase]);

  // Debounce search input
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query) performSearch(query);
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [query, performSearch]);

  // Keyboard controls for Spotlight list
  const handleListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(flatResults.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + flatResults.length) % Math.max(flatResults.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatResults[selectedIndex]) {
        handleNavigate(flatResults[selectedIndex].url);
      }
    }
  };

  const handleNavigate = (url: string) => {
    onOpenChange(false);
    router.push(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/85 backdrop-blur-sm p-4 pt-[12vh]">
      {/* Backdrop click closer */}
      <div className="fixed inset-0" onClick={() => onOpenChange(false)} />

      {/* Main Command Box */}
      <div
        ref={modalRef}
        onKeyDown={handleListKeyDown}
        className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl overflow-hidden flex flex-col max-h-[70vh] animate-in fade-in-50 zoom-in-95 duration-150"
      >
        {/* Input Bar */}
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3.5 bg-slate-950/20">
          <Search className="size-5 text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type to search contacts, chats, billing invoices, tasks..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-slate-550 outline-none border-0 focus:ring-0"
          />
          {searching ? (
            <Loader2 className="size-4 animate-spin text-primary shrink-0" />
          ) : (
            <kbd className="hidden sm:flex h-5 items-center gap-0.5 rounded border border-slate-800 bg-slate-950 px-1.5 font-mono text-[9px] font-bold text-slate-500 shrink-0">
              <Command className="h-2.5 w-2.5" />
              <span>K</span>
            </kbd>
          )}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-slate-550 hover:text-white shrink-0 outline-none"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* Results Pane */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
          {query.trim() === '' ? (
            <div className="text-center py-10 text-slate-500 text-xs space-y-2">
              <Command className="size-6 text-slate-700 mx-auto" />
              <p className="font-bold text-slate-400">Enterprise AI Omni-Search</p>
              <p className="text-[10px] text-slate-600">Search for customers, billing data, private discussions or action tasks.</p>
            </div>
          ) : flatResults.length === 0 && !searching ? (
            <div className="text-center py-10 text-slate-550 text-xs">
              No matching records found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="space-y-1">
              {flatResults.map((item, idx) => {
                const isActive = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.url)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      'w-full flex items-start gap-3 text-left px-3.5 py-3 rounded-xl transition-all cursor-pointer border border-transparent',
                      isActive
                        ? 'bg-slate-800/80 border-slate-700/50'
                        : 'hover:bg-slate-800/30'
                    )}
                  >
                    {/* Bullet icon by category */}
                    <div className={cn(
                      'size-7 rounded-lg flex items-center justify-center shrink-0 border',
                      item.type === 'contact' ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-450' :
                      item.type === 'message' ? 'bg-sky-950/40 border-sky-500/20 text-sky-450' :
                      item.type === 'invoice' ? 'bg-amber-955/40 border-amber-500/20 text-amber-500' :
                      'bg-rose-955/40 border-rose-500/20 text-rose-450'
                    )}>
                      {item.type === 'contact' && <User className="size-4" />}
                      {item.type === 'message' && <MessageSquare className="size-4" />}
                      {item.type === 'invoice' && <Receipt className="size-4" />}
                      {item.type === 'task' && <CheckSquare className="size-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={cn(
                          'text-xs font-bold truncate',
                          isActive ? 'text-primary' : 'text-white'
                        )}>
                          {item.title}
                        </p>
                        <span className="text-[9px] uppercase font-extrabold text-slate-500 tracking-wider font-mono">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-450 mt-0.5 truncate leading-relaxed">
                        {item.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="border-t border-slate-800 px-4 py-2 bg-slate-950/50 flex items-center justify-between text-[10px] text-slate-650 font-semibold font-sans">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to open</span>
          </div>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}

// Custom hook helper to import flatResults useMemo
import { useMemo } from 'react';
