import {
  VectorStoreProvider,
  MemoryProvider,
  AIDataServiceProvider,
  MongoVectorStoreProvider,
  MongoMemoryProvider,
  MongoAIDataServiceProvider,
} from './providers'
import type { AIAgentConfig } from '@/lib/ai/types'

export class AIService {
  private vectorStore: VectorStoreProvider
  private memory: MemoryProvider
  private aiData: AIDataServiceProvider

  constructor() {
    // Abstracted database provider instances. Can be configured dynamically
    // in the future by checking an environment variable (e.g., process.env.VECTOR_STORE_PROVIDER)
    const activeProvider = process.env.DATABASE_AI_PROVIDER || 'mongodb-atlas'

    if (activeProvider === 'mongodb-atlas') {
      this.vectorStore = new MongoVectorStoreProvider()
      this.memory = new MongoMemoryProvider()
      this.aiData = new MongoAIDataServiceProvider()
    } else {
      // Default fallback
      this.vectorStore = new MongoVectorStoreProvider()
      this.memory = new MongoMemoryProvider()
      this.aiData = new MongoAIDataServiceProvider()
    }
  }

  // ==========================================
  // Webhook, Automation, & Sentiment Logs
  // ==========================================

  async logWebhook(args: {
    userId: string
    direction: 'inbound' | 'outbound'
    payload: any
    status: string
    error?: string | null
  }) {
    await this.aiData.logWebhook(args)
  }

  async logAutomation(args: {
    userId: string
    automationId: string
    contactId: string
    triggerType: string
    success: boolean
    stepsExecuted: any[]
    error?: string | null
  }) {
    await this.aiData.logAutomation(args)
  }

  async logPrompt(args: {
    userId: string
    messages: any[]
    systemPrompt?: string | null
    reply: string
    provider: string
    model: string
    tokensUsed: number
    latencyMs: number
  }) {
    await this.aiData.logPrompt(args)
  }

  async logSentimentAnalysis(args: {
    userId: string
    contactId: string
    conversationId: string
    text: string
    intent: string
    sentiment: string
    language: string
    wantsHuman: boolean
  }) {
    await this.aiData.logSentimentAnalysis(args)
  }

  // ==========================================
  // AI Memory
  // ==========================================

  async getContactMemory(userId: string, contactId: string) {
    return this.memory.getContactMemory(userId, contactId)
  }

  async updateContactMemory(
    userId: string,
    contactId: string,
    updates: {
      facts?: Record<string, string>
      lastIntent?: any
      lastLanguage?: string
      lastSentiment?: string
      totalInteractions?: number
    }
  ) {
    await this.memory.updateContactMemory(userId, contactId, updates)
  }

  // ==========================================
  // AI Conversations State
  // ==========================================

  async getAIConversation(conversationId: string) {
    return this.aiData.getAIConversation(conversationId)
  }

  async upsertAIConversation(
    conversationId: string,
    updates: {
      userId: string
      totalAiMessages?: number
      aiActive?: boolean
      handedOffAt?: Date | null
      provider?: string
      model?: string
    }
  ) {
    await this.aiData.upsertAIConversation(conversationId, updates)
  }

  async listAIConversationsByUser(userId: string) {
    return this.aiData.listAIConversationsByUser(userId)
  }

  // ==========================================
  // Conversation Summaries
  // ==========================================

  async getSummary(conversationId: string) {
    return this.aiData.getSummary(conversationId)
  }

  async upsertSummary(
    conversationId: string,
    args: {
      userId: string
      summary: string
      messageCountAtSummary: number
      provider: string
      model: string
      tokensUsed: number
    }
  ) {
    await this.aiData.upsertSummary(conversationId, args)
  }

  // ==========================================
  // Prompt Templates
  // ==========================================

  async listPromptTemplates(userId: string) {
    return this.aiData.listPromptTemplates(userId)
  }

  async unsetDefaultPromptTemplates(userId: string) {
    await this.aiData.unsetDefaultPromptTemplates(userId)
  }

  async upsertPromptTemplate(
    userId: string,
    templateId: string,
    data: {
      name: string
      description?: string | null
      content: string
      is_default: boolean
      intent_filter?: string[]
    }
  ) {
    await this.aiData.upsertPromptTemplate(userId, templateId, data)
  }

  async deletePromptTemplate(userId: string, templateId: string) {
    await this.aiData.deletePromptTemplate(userId, templateId)
  }

  // ==========================================
  // Auth Events and Users
  // ==========================================

  async logAuthEvent(args: {
    userId: string | null
    email: string
    eventType: string
    status: string
    ipAddress: string
    userAgent: string
    errorMessage?: string | null
  }) {
    await this.aiData.logAuthEvent(args)
  }

  async upsertUser(userId: string, data: { email: string; fullName?: string | null }) {
    await this.aiData.upsertUser(userId, data)
  }

  // ==========================================
  // AI Usage Logs
  // ==========================================

  async logAIUsage(log: {
    userId: string
    operation: string
    provider: string
    model: string
    totalTokens: number
    confidence?: number | null
    finishReason?: string | null
  }) {
    await this.aiData.logAIUsage(log)
  }

  async listAIUsageLogs(userId: string, limit = 100) {
    return this.aiData.listAIUsageLogs(userId, limit)
  }

  // ==========================================
  // Knowledge Base & Embeddings
  // ==========================================

  async listKnowledgeBase(userId: string) {
    return this.aiData.listKnowledgeBase(userId)
  }

  async getKnowledgeDoc(userId: string, docId: string) {
    return this.aiData.getKnowledgeDoc(userId, docId)
  }

  async insertKnowledgeDoc(doc: Record<string, any>) {
    await this.aiData.insertKnowledgeDoc(doc)
  }

  async updateKnowledgeDoc(docId: string, updates: Record<string, any>) {
    await this.aiData.updateKnowledgeDoc(docId, updates)
  }

  async deleteKnowledgeDoc(docId: string) {
    await this.aiData.deleteKnowledgeDoc(docId)
  }

  async deleteKnowledgeEmbeddings(docId: string) {
    await this.vectorStore.deleteKnowledgeEmbeddings(docId)
  }

  async insertKnowledgeEmbeddings(rows: any[]) {
    await this.vectorStore.insertKnowledgeEmbeddings(rows)
  }

  async getKnowledgeDocTitles(kbIds: string[]) {
    return this.aiData.getKnowledgeDocTitles(kbIds)
  }

  async vectorSearchKnowledge(userId: string, embeddingVector: number[], topK = 5) {
    return this.vectorStore.vectorSearchKnowledge(userId, embeddingVector, topK)
  }

  async hybridSearchKnowledge(
    userId: string,
    embeddingVector: number[],
    keywordText: string,
    filters: { category?: string; tags?: string[] } = {},
    topK = 5
  ) {
    return this.vectorStore.hybridSearchKnowledge(userId, embeddingVector, keywordText, filters, topK)
  }

  async logKnowledgeSearch(userId: string, query: string, hitCount: number, latencyMs: number, success: boolean) {
    await this.aiData.logKnowledgeSearch(userId, query, hitCount, latencyMs, success)
  }

  async logKnowledgeUsage(userId: string, docId: string) {
    await this.aiData.logKnowledgeUsage(userId, docId)
  }

  async getKnowledgeAnalytics(userId: string) {
    return this.aiData.getKnowledgeAnalytics(userId)
  }

  // ==========================================
  // AI Agent Management
  // ==========================================

  async listAIAgents(userId: string): Promise<AIAgentConfig[]> {
    return this.aiData.listAIAgents(userId)
  }

  async getAIAgent(userId: string, agentId: string): Promise<AIAgentConfig | null> {
    return this.aiData.getAIAgent(userId, agentId)
  }

  async upsertAIAgent(userId: string, agentId: string, data: Partial<AIAgentConfig>) {
    await this.aiData.upsertAIAgent(userId, agentId, data)
  }

  async deleteAIAgent(userId: string, agentId: string) {
    await this.aiData.deleteAIAgent(userId, agentId)
  }

  // Sales Intelligence MongoDB operations
  async saveLeadAnalysis(contactId: string, userId: string, data: any) {
    await this.aiData.saveLeadAnalysis(contactId, userId, data)
  }

  async getLeadAnalysis(contactId: string) {
    return this.aiData.getLeadAnalysis(contactId)
  }

  async saveSalesPredictions(contactId: string, userId: string, data: any) {
    await this.aiData.saveSalesPredictions(contactId, userId, data)
  }

  async getSalesPredictions(contactId: string) {
    return this.aiData.getSalesPredictions(contactId)
  }

  async saveAIRecommendations(contactId: string, userId: string, data: any) {
    await this.aiData.saveAIRecommendations(contactId, userId, data)
  }

  async getAIRecommendations(contactId: string) {
    return this.aiData.getAIRecommendations(contactId)
  }

  async saveProposalDraft(contactId: string, userId: string, data: any) {
    await this.aiData.saveProposalDraft(contactId, userId, data)
  }

  async getProposalDraft(contactId: string) {
    return this.aiData.getProposalDraft(contactId)
  }

  async saveQuotationDraft(contactId: string, userId: string, data: any) {
    await this.aiData.saveQuotationDraft(contactId, userId, data)
  }

  async getQuotationDraft(contactId: string) {
    return this.aiData.getQuotationDraft(contactId)
  }

  async saveMeetingSummary(meetingId: string, userId: string, summary: any) {
    await this.aiData.saveMeetingSummary(meetingId, userId, summary)
  }

  async getMeetingSummary(meetingId: string) {
    return this.aiData.getMeetingSummary(meetingId)
  }

  // Marketing Automation Extensions
  async saveCampaignStrategy(campaignId: string, userId: string, data: any) {
    await this.aiData.saveCampaignStrategy(campaignId, userId, data)
  }

  async getCampaignStrategy(campaignId: string) {
    return this.aiData.getCampaignStrategy(campaignId)
  }

  async saveAudienceBehavior(contactId: string, userId: string, data: any) {
    await this.aiData.saveAudienceBehavior(contactId, userId, data)
  }

  async saveSocialSync(channel: string, payload: any) {
    await this.aiData.saveSocialSync(channel, payload)
  }

  async saveMarketingPredictions(campaignId: string, predictions: any) {
    await this.aiData.saveMarketingPredictions(campaignId, predictions)
  }
}
