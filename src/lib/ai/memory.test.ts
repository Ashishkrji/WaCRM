import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUnifiedMemoryContext, formatMemoryForPrompt } from './memory'
import { dbService } from '@/services/db'
import type { ContactMemory } from './types'

vi.mock('@/services/db', () => {
  return {
    dbService: {
      ai: {
        getContactMemory: vi.fn(),
      },
      business: {
        getRecentDeals: vi.fn(),
        getRecentMeetingBookings: vi.fn(),
        getRecentQuotationRequests: vi.fn(),
        getRecentProposalRequests: vi.fn(),
      },
    },
  }
})

describe('Memory Broker - formatMemoryForPrompt', () => {
  it('should format long term memory facts correctly', () => {
    const mockMemory: ContactMemory = {
      userId: 'user-1',
      contactId: 'contact-1',
      facts: {
        industry: 'Dental Clinic',
        budget: 'INR 50,000',
        location: 'Delhi',
      },
      lastLanguage: 'en',
      lastIntent: 'pricing',
      lastSentiment: 'neutral',
      totalInteractions: 5,
      updatedAt: new Date().toISOString(),
    }

    const formatted = formatMemoryForPrompt(mockMemory)
    expect(formatted).toContain('--- CUSTOMER CONTEXT ---')
    expect(formatted).toContain('- industry: Dental Clinic')
    expect(formatted).toContain('- budget: INR 50,000')
    expect(formatted).toContain('- location: Delhi')
    expect(formatted).toContain('Previous AI interactions: 5')
  })

  it('should include customer language preference if it is non-english', () => {
    const mockMemory: ContactMemory = {
      userId: 'user-1',
      contactId: 'contact-1',
      facts: {},
      lastLanguage: 'hi',
      lastIntent: 'greeting',
      lastSentiment: 'positive',
      totalInteractions: 1,
      updatedAt: new Date().toISOString(),
    }

    const formatted = formatMemoryForPrompt(mockMemory)
    expect(formatted).toContain("Customer's preferred language: hi")
  })
})

describe('Memory Broker - getUnifiedMemoryContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should retrieve and compile short, medium, and long term layers into unified string', async () => {
    const userId = 'user-1'
    const contactId = 'contact-1'

    // Mock Long Term Memory from MongoDB
    const mockMemory: ContactMemory = {
      userId,
      contactId,
      facts: {
        goals: 'Improve SEO',
        website: 'https://mysite.com',
      },
      lastLanguage: 'en',
      lastIntent: 'booking',
      lastSentiment: 'positive',
      totalInteractions: 8,
      updatedAt: new Date().toISOString(),
    }
    vi.mocked(dbService.ai.getContactMemory).mockResolvedValue(mockMemory)

    // Mock Medium Term CRM details from Postgres
    const mockDeals = [
      { title: 'SEO Optimization Deal', value: 15000, currency: 'INR', status: 'Proposal Sent', created_at: '2026-06-15T10:00:00Z' },
    ]
    const mockBookings = [
      { title: 'SEO Intake Call', start_time: '2026-06-22T11:00:00Z', status: 'confirmed' },
    ]
    const mockQuotes = [
      { service_required: 'SEO Packages', total_amount: 15000, status: 'pending' },
    ]
    const mockProposals = [
      { service_required: 'SEO & Content Writing', status: 'draft' },
    ]

    vi.mocked(dbService.business.getRecentDeals).mockResolvedValue(mockDeals)
    vi.mocked(dbService.business.getRecentMeetingBookings).mockResolvedValue(mockBookings)
    vi.mocked(dbService.business.getRecentQuotationRequests).mockResolvedValue(mockQuotes)
    vi.mocked(dbService.business.getRecentProposalRequests).mockResolvedValue(mockProposals)

    const context = await getUnifiedMemoryContext(userId, contactId)

    // Verify database calls
    expect(dbService.ai.getContactMemory).toHaveBeenCalledWith(userId, contactId)
    expect(dbService.business.getRecentDeals).toHaveBeenCalledWith(contactId, 3)
    expect(dbService.business.getRecentMeetingBookings).toHaveBeenCalledWith(contactId, 3)

    // Verify formatted sections
    expect(context).toContain('--- UNIFIED CUSTOMER CONTEXT & CRM MEMORY ---')
    expect(context).toContain('### LONG-TERM CUSTOMER FACTS & PREFERENCES:')
    expect(context).toContain('- goals: Improve SEO')
    expect(context).toContain('- website: https://mysite.com')

    expect(context).toContain('### SHORT-TERM CONTEXT & METRICS:')
    expect(context).toContain('- Preferred Language: en')
    expect(context).toContain('- Last Message Intent: booking')
    expect(context).toContain('- Total AI Interactions: 8')

    expect(context).toContain('### MEDIUM-TERM CRM HISTORY:')
    expect(context).toContain('- Deal: "SEO Optimization Deal" | Value: INR 15000 | Status: Proposal Sent')
    expect(context).toContain('- Scheduled Meeting: "SEO Intake Call"')
    expect(context).toContain('- Quotation Request: "SEO Packages" | Total: INR 15000')
    expect(context).toContain('- Proposal Request: "SEO & Content Writing"')
  })

  it('should build fallback gracefully when some or all queries return empty or fail', async () => {
    vi.mocked(dbService.ai.getContactMemory).mockResolvedValue(null)
    vi.mocked(dbService.business.getRecentDeals).mockRejectedValue(new Error('Postgres query timeout'))
    vi.mocked(dbService.business.getRecentMeetingBookings).mockResolvedValue([])
    vi.mocked(dbService.business.getRecentQuotationRequests).mockResolvedValue([])
    vi.mocked(dbService.business.getRecentProposalRequests).mockResolvedValue([])

    const context = await getUnifiedMemoryContext('user-1', 'contact-1')
    expect(context).toBe('')
  })
})
