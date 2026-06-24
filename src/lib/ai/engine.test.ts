import { describe, it, expect, vi, beforeEach } from "vitest";
import { dispatchAIReply } from "./engine";
import { tryGetAIProvider } from "./provider-factory";

// Create a builder for Supabase query chaining
const createMockChain = (resolvedValue: any) => {
  const chain: any = {
    select: vi.fn().mockImplementation(() => chain),
    insert: vi.fn().mockImplementation(() => chain),
    update: vi.fn().mockImplementation(() => chain),
    upsert: vi.fn().mockImplementation(() => chain),
    eq: vi.fn().mockImplementation(() => chain),
    not: vi.fn().mockImplementation(() => chain),
    order: vi.fn().mockImplementation(() => chain),
    limit: vi.fn().mockImplementation(() => chain),
    single: vi.fn().mockResolvedValue(resolvedValue),
    maybeSingle: vi.fn().mockResolvedValue(resolvedValue),
    then: (resolve: any) => Promise.resolve(resolve(resolvedValue)),
  };
  return chain;
};

// Set up mock responses for different tables/queries
const mockSupabaseClient = {
  from: vi.fn().mockImplementation((table) => {
    if (table === "ai_router_config") {
      return createMockChain({
        data: {
          enabled: true,
          auto_reply: true,
          ai_provider: "gemini",
          confidence_threshold: 0.5,
          system_prompt: "Sales Rep prompt",
        },
        error: null,
      });
    }
    if (table === "messages" || table === "conversations") {
      return createMockChain({
        data: [],
        error: null,
      });
    }
    // For inserts like meeting_bookings, proposal_requests, quotation_requests
    return createMockChain({
      data: { id: "mock-new-id-999" },
      error: null,
    });
  }),
};

vi.mock("@/services/db", () => {
  return {
    dbService: {
      business: {
        getAIRouterConfig: vi.fn().mockResolvedValue({
          enabled: true,
          auto_reply: true,
          ai_provider: "gemini",
          confidence_threshold: 0.5,
          system_prompt: "Sales Rep prompt",
        }),
        getRecentMessages: vi.fn().mockResolvedValue([]),
        createMessage: vi.fn().mockResolvedValue({}),
        updateConversation: vi.fn().mockResolvedValue({}),
        findConversationById: vi.fn().mockResolvedValue({ contact_id: "contact-456" }),
        createMeetingBooking: vi.fn().mockResolvedValue("mock-new-id-999"),
        createQuotationRequest: vi.fn().mockResolvedValue("mock-new-id-999"),
        createProposalRequest: vi.fn().mockResolvedValue("mock-new-id-999"),
        countTotalMessages: vi.fn().mockResolvedValue(10),
        countCustomerMessages: vi.fn().mockResolvedValue(5),
        updateContact: vi.fn().mockResolvedValue({}),
        upsertLeadScore: vi.fn().mockResolvedValue({}),
      },
      ai: {
        getAIConversation: vi.fn().mockResolvedValue(null),
        upsertAIConversation: vi.fn().mockResolvedValue({}),
        logAIUsage: vi.fn().mockResolvedValue({}),
        getAIAgent: vi.fn().mockResolvedValue(null),
      },
    },
  };
});

vi.mock("./mongodb-logger", () => {
  return {
    logPrompt: vi.fn().mockResolvedValue(undefined),
    logSentimentAnalysis: vi.fn().mockResolvedValue(undefined),
  };
});

// Mock other dependencies of the engine
vi.mock("./provider-factory", () => {
  return {
    tryGetAIProvider: vi.fn(),
  };
});


vi.mock("./knowledge/embeddings", () => {
  return {
    searchKnowledge: vi.fn().mockResolvedValue([]),
    formatKnowledgeForPrompt: vi.fn().mockReturnValue(""),
  };
});

vi.mock("./memory", () => {
  return {
    getContactMemory: vi.fn().mockResolvedValue(null),
    formatMemoryForPrompt: vi.fn().mockReturnValue(""),
    updateContactMemory: vi.fn().mockResolvedValue(null),
    getUnifiedMemoryContext: vi.fn().mockResolvedValue(""),
  };
});

vi.mock("./intent", () => {
  return {
    analyzeIntent: vi.fn().mockResolvedValue({
      intent: "pricing",
      sentiment: "positive",
      language: "en",
      wantsHuman: false,
    }),
    quickHumanRequestCheck: vi.fn().mockReturnValue(false),
  };
});

vi.mock("@/lib/automations/meta-send", () => {
  return {
    engineSendText: vi.fn().mockResolvedValue({ success: true }),
  };
});

describe("AI Engine Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SITE_URL = "https://crm.maajanki.com";
  });

  it("should parse BOOK_MEETING action tag and append checkout details", async () => {
    // Setup mock AI provider response
    const mockProvider = {
      name: "gemini",
      chat: vi.fn().mockResolvedValue({
        content: "Let's schedule a meeting! [ACTION: BOOK_MEETING: {\"title\": \"MaaJanki SEO Strategy\", \"time\": \"2026-06-25T11:00:00Z\"}]",
        confidence: 0.9,
        tokensUsed: 150,
        model: "gemini-1.5-flash",
        finishReason: "stop",
      }),
    };
    vi.mocked(tryGetAIProvider).mockReturnValue(mockProvider as any);

    // Run dispatch
    const result = await dispatchAIReply({
      userId: "user-123",
      contactId: "contact-456",
      conversationId: "conversation-789",
      inboundText: "I want to schedule an SEO consultation",
      messageType: "text",
    });

    expect(result.replied).toBe(true);
    expect(result.replyContent).toContain("Let's schedule a meeting!");
    expect(result.replyContent).toContain("📅 *Meeting Scheduled:*");
    // Ensure raw action tag is stripped
    expect(result.replyContent).not.toContain("[ACTION: BOOK_MEETING:");
  });

  it("should parse CREATE_QUOTE action tag and generate clean payment checkout link", async () => {
    const mockProvider = {
      name: "gemini",
      chat: vi.fn().mockResolvedValue({
        content: "Here is your quotation. [ACTION: CREATE_QUOTE: {\"service\": \"Website Development\", \"items\": [{\"desc\": \"WordPress Site Development\", \"price\": 25000}]}]",
        confidence: 0.9,
        tokensUsed: 150,
        model: "gemini-1.5-flash",
        finishReason: "stop",
      }),
    };
    vi.mocked(tryGetAIProvider).mockReturnValue(mockProvider as any);

    const result = await dispatchAIReply({
      userId: "user-123",
      contactId: "contact-456",
      conversationId: "conversation-789",
      inboundText: "How much for a WordPress site?",
      messageType: "text",
    });

    expect(result.replied).toBe(true);
    expect(result.replyContent).toContain("Here is your quotation.");
    expect(result.replyContent).toContain("📄 *Quotation Generated:*");
    expect(result.replyContent).toContain("https://crm.maajanki.com/public/quote/mock-new-id-999");
    expect(result.replyContent).not.toContain("[ACTION: CREATE_QUOTE:");
  });
});
