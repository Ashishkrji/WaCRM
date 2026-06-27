import { connectToDatabase } from '@/lib/mongodb'
import type { Db } from 'mongodb'
import type { AIAgentConfig } from '@/services/ai/types'

// ============================================================
// 1. Vector Store Provider Abstraction
// ============================================================
export interface VectorStoreProvider {
  readonly name: string;
  insertKnowledgeEmbeddings(rows: any[]): Promise<void>;
  deleteKnowledgeEmbeddings(docId: string): Promise<void>;
  vectorSearchKnowledge(organizationId: string, embeddingVector: number[], topK?: number): Promise<any[]>;
  hybridSearchKnowledge(
    organizationId: string,
    embeddingVector: number[],
    keywordText: string,
    filters?: { category?: string; tags?: string[] },
    topK?: number
  ): Promise<any[]>;
}

// ============================================================
// 2. Memory Provider Abstraction
// ============================================================
export interface MemoryProvider {
  readonly name: string;
  getContactMemory(organizationId: string, contactId: string): Promise<any>;
  updateContactMemory(organizationId: string, contactId: string, updates: any): Promise<void>;
}

// ============================================================
// 3. AI Data Service Provider Abstraction
// ============================================================
export interface AIDataServiceProvider {
  readonly name: string;
  
  // Webhook, Automation, & Sentiment Logs
  logWebhook(args: {
    organizationId: string;
    direction: 'inbound' | 'outbound';
    payload: any;
    status: string;
    error?: string | null;
  }): Promise<void>;
  
  logAutomation(args: {
    organizationId: string;
    automationId: string;
    contactId: string;
    triggerType: string;
    success: boolean;
    stepsExecuted: any[];
    error?: string | null;
  }): Promise<void>;

  logPrompt(args: {
    organizationId: string;
    messages: any[];
    systemPrompt?: string | null;
    reply: string;
    provider: string;
    model: string;
    tokensUsed: number;
    latencyMs: number;
  }): Promise<void>;

  logSentimentAnalysis(args: {
    organizationId: string;
    contactId: string;
    conversationId: string;
    text: string;
    intent: string;
    sentiment: string;
    language: string;
    wantsHuman: boolean;
  }): Promise<void>;

  // AI Usage & cost telemetry logs
  logAIUsage(log: {
    organizationId: string;
    operation: string;
    provider: string;
    model: string;
    totalTokens: number;
    confidence?: number | null;
    finishReason?: string | null;
  }): Promise<void>;

  listAIUsageLogs(organizationId: string, limit?: number): Promise<any[]>;

  // Auth Events and Users sync
  logAuthEvent(args: {
    organizationId: string | null;
    email: string;
    eventType: string;
    status: string;
    ipAddress: string;
    userAgent: string;
    errorMessage?: string | null;
  }): Promise<void>;

  upsertUser(organizationId: string, data: { email: string; fullName?: string | null }): Promise<void>;

  // AI Conversations State
  getAIConversation(conversationId: string): Promise<any>;
  upsertAIConversation(
    conversationId: string,
    updates: {
      organizationId: string;
      totalAiMessages?: number;
      aiActive?: boolean;
      handedOffAt?: Date | null;
      provider?: string;
      model?: string;
    }
  ): Promise<void>;
  listAIConversationsByUser(organizationId: string): Promise<any[]>;

  // Conversation Summaries
  getSummary(conversationId: string): Promise<any>;
  upsertSummary(
    conversationId: string,
    args: {
      organizationId: string;
      summary: string;
      messageCountAtSummary: number;
      provider: string;
      model: string;
      tokensUsed: number;
    }
  ): Promise<void>;

  // Prompt Templates
  listPromptTemplates(organizationId: string): Promise<any[]>;
  unsetDefaultPromptTemplates(organizationId: string): Promise<void>;
  upsertPromptTemplate(
    organizationId: string,
    templateId: string,
    data: {
      name: string;
      description?: string | null;
      content: string;
      is_default: boolean;
      intent_filter?: string[];
    }
  ): Promise<void>;
  deletePromptTemplate(organizationId: string, templateId: string): Promise<void>;

  // Knowledge Base document management
  listKnowledgeBase(organizationId: string): Promise<any[]>;
  getKnowledgeDoc(organizationId: string, docId: string): Promise<any>;
  insertKnowledgeDoc(doc: Record<string, any>): Promise<void>;
  updateKnowledgeDoc(docId: string, updates: Record<string, any>): Promise<void>;
  deleteKnowledgeDoc(docId: string): Promise<void>;
  getKnowledgeDocTitles(kbIds: string[]): Promise<any[]>;

  // Knowledge Analytics Logs
  logKnowledgeSearch(organizationId: string, query: string, hitCount: number, latencyMs: number, success: boolean): Promise<void>;
  logKnowledgeUsage(organizationId: string, docId: string): Promise<void>;
  getKnowledgeAnalytics(organizationId: string): Promise<any>;

  // AI Agent Management
  listAIAgents(organizationId: string): Promise<AIAgentConfig[]>;
  getAIAgent(organizationId: string, agentId: string): Promise<AIAgentConfig | null>;
  upsertAIAgent(organizationId: string, agentId: string, data: Partial<AIAgentConfig>): Promise<void>;
  deleteAIAgent(organizationId: string, agentId: string): Promise<void>;

  // Sales Intelligence MongoDB operations
  saveLeadAnalysis(contactId: string, organizationId: string, data: any): Promise<void>;
  getLeadAnalysis(contactId: string): Promise<any>;
  saveSalesPredictions(contactId: string, organizationId: string, data: any): Promise<void>;
  getSalesPredictions(contactId: string): Promise<any>;
  saveAIRecommendations(contactId: string, organizationId: string, data: any): Promise<void>;
  getAIRecommendations(contactId: string): Promise<any>;
  
  // Proposals & Quotations Drafts
  saveProposalDraft(contactId: string, organizationId: string, data: any): Promise<void>;
  getProposalDraft(contactId: string): Promise<any>;
  saveQuotationDraft(contactId: string, organizationId: string, data: any): Promise<void>;
  getQuotationDraft(contactId: string): Promise<any>;

  // Meeting Summaries
  saveMeetingSummary(meetingId: string, organizationId: string, summary: any): Promise<void>;
  getMeetingSummary(meetingId: string): Promise<any>;

  // Marketing Automation Extensions
  saveCampaignStrategy(campaignId: string, organizationId: string, data: any): Promise<void>;
  getCampaignStrategy(campaignId: string): Promise<any>;
  saveAudienceBehavior(contactId: string, organizationId: string, data: any): Promise<void>;
  saveSocialSync(channel: string, payload: any): Promise<void>;
  saveMarketingPredictions(campaignId: string, predictions: any): Promise<void>;
}

// ============================================================
// Concrete Implementation: MongoDB Atlas Vector Store Provider
// ============================================================
export class MongoVectorStoreProvider implements VectorStoreProvider {
  readonly name = 'mongodb-atlas';

  private async getDb(): Promise<Db> {
    const { db } = await connectToDatabase();
    return db;
  }

  async insertKnowledgeEmbeddings(rows: any[]) {
    const db = await this.getDb();
    await db.collection('knowledge_embeddings').insertMany(rows);
  }

  async deleteKnowledgeEmbeddings(docId: string) {
    const db = await this.getDb();
    await db.collection('knowledge_embeddings').deleteMany({ knowledge_base_id: docId });
  }

  async vectorSearchKnowledge(organizationId: string, embeddingVector: number[], topK = 5) {
    const db = await this.getDb();
    return db
      .collection('knowledge_embeddings')
      .aggregate([
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: embeddingVector,
            numCandidates: 100,
            limit: topK,
            filter: { user_id: organizationId },
          },
        },
        {
          $project: {
            _id: 1,
            knowledge_base_id: 1,
            content: 1,
            similarity: { $meta: 'vectorSearchScore' },
          },
        },
      ])
      .toArray();
  }

  async hybridSearchKnowledge(
    organizationId: string,
    embeddingVector: number[],
    keywordText: string,
    filters: { category?: string; tags?: string[] } = {},
    topK = 5
  ) {
    const db = await this.getDb();
    
    // 1. Vector Search Stage
    const vectorFilter: Record<string, any> = { user_id: organizationId };
    if (filters.category) {
      vectorFilter.category = filters.category;
    }
    if (filters.tags && filters.tags.length > 0) {
      vectorFilter.tags = { $in: filters.tags };
    }

    let vectorResults: any[] = [];
    try {
      vectorResults = await db
        .collection('knowledge_embeddings')
        .aggregate([
          {
            $vectorSearch: {
              index: 'vector_index',
              path: 'embedding',
              queryVector: embeddingVector,
              numCandidates: 100,
              limit: topK * 2,
              filter: vectorFilter,
            },
          },
          {
            $project: {
              _id: 1,
              knowledge_base_id: 1,
              content: 1,
              category: 1,
              tags: 1,
              source_url: 1,
              similarity: { $meta: 'vectorSearchScore' },
            },
          },
        ])
        .toArray();
    } catch (err) {
      console.warn('[MongoVectorStoreProvider] Vector Search failed or index not configured:', err);
    }

    // 2. Keyword Search Pipeline (Option A: fallback regex match)
    const keywordFilter: Record<string, any> = { user_id: organizationId };
    if (filters.category) {
      keywordFilter.category = filters.category;
    }
    if (filters.tags && filters.tags.length > 0) {
      keywordFilter.tags = { $in: filters.tags };
    }

    if (keywordText) {
      keywordFilter.content = { $regex: keywordText, $options: 'i' };
    }

    const keywordResults = await db
      .collection('knowledge_embeddings')
      .find(keywordFilter)
      .limit(topK * 2)
      .project({
        _id: 1,
        knowledge_base_id: 1,
        content: 1,
        category: 1,
        tags: 1,
        source_url: 1,
      })
      .toArray();

    // 3. Simple merging & ranking
    const combinedMap = new Map<string, any>();

    // Add vector results
    vectorResults.forEach((doc, rank) => {
      const idStr = doc._id.toString();
      combinedMap.set(idStr, {
        ...doc,
        vectorRank: rank + 1,
        keywordRank: null,
        score: doc.similarity, // Use cosine similarity as base score
      });
    });

    // Add/merge keyword results
    keywordResults.forEach((doc, rank) => {
      const idStr = doc._id.toString();
      const existing = combinedMap.get(idStr);
      if (existing) {
        existing.keywordRank = rank + 1;
        // Boost score if match is found in both vector and keyword search
        existing.score = existing.score + 0.5;
      } else {
        combinedMap.set(idStr, {
          ...doc,
          vectorRank: null,
          keywordRank: rank + 1,
          score: 0.5 - (rank * 0.05), // lower starting score for pure keyword matches
        });
      }
    });

    // Sort by combined score descending
    const merged = Array.from(combinedMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    // Map output to align with existing vector search format
    return merged.map(item => ({
      _id: item._id,
      knowledge_base_id: item.knowledge_base_id,
      content: item.content,
      category: item.category,
      tags: item.tags,
      source_url: item.source_url,
      similarity: item.similarity || item.score,
    }));
  }
}

// ============================================================
// Concrete Implementation: MongoDB Atlas Memory Provider
// ============================================================
export class MongoMemoryProvider implements MemoryProvider {
  readonly name = 'mongodb-atlas';

  private async getDb(): Promise<Db> {
    const { db } = await connectToDatabase();
    return db;
  }

  async getContactMemory(organizationId: string, contactId: string) {
    const db = await this.getDb();
    const data = await db.collection('ai_memory').findOne({
      user_id: organizationId,
      contact_id: contactId,
    });

    if (!data) return null;

    return {
      organizationId: data.user_id,
      contactId: data.contact_id,
      facts: data.facts || {},
      lastIntent: data.last_intent || null,
      lastLanguage: data.last_language,
      lastSentiment: data.last_sentiment,
      totalInteractions: data.total_interactions || 0,
      updatedAt: data.updated_at ? new Date(data.updated_at).toISOString() : new Date().toISOString(),
    };
  }

  async updateContactMemory(organizationId: string, contactId: string, updates: any) {
    const db = await this.getDb();

    const existing = await db.collection('ai_memory').findOne({
      user_id: organizationId,
      contact_id: contactId,
    });

    const mergedFacts = {
      ...(existing?.facts || {}),
      ...(updates.facts || {}),
    };

    await db.collection('ai_memory').updateOne(
      {
        user_id: organizationId,
        contact_id: contactId,
      },
      {
        $set: {
          facts: mergedFacts,
          last_intent: updates.lastIntent ?? existing?.last_intent ?? null,
          last_language: updates.lastLanguage ?? existing?.last_language ?? 'en',
          last_sentiment: updates.lastSentiment ?? existing?.last_sentiment ?? 'neutral',
          total_interactions:
            (existing?.total_interactions || 0) + (updates.totalInteractions || 0),
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        },
      },
      { upsert: true }
    );
  }
}

// ============================================================
// Concrete Implementation: MongoDB Atlas AI Data Service Provider
// ============================================================
export class MongoAIDataServiceProvider implements AIDataServiceProvider {
  readonly name = 'mongodb-atlas';

  private async getDb(): Promise<Db> {
    const { db } = await connectToDatabase();
    return db;
  }

  async logWebhook(args: any) {
    const db = await this.getDb();
    await db.collection('webhook_logs').insertOne({
      user_id: args.organizationId,
      direction: args.direction,
      payload: args.payload,
      status: args.status,
      error: args.error || null,
      created_at: new Date(),
    });
  }

  async logAutomation(args: any) {
    const db = await this.getDb();
    await db.collection('automation_logs').insertOne({
      user_id: args.organizationId,
      automation_id: args.automationId,
      contact_id: args.contactId,
      trigger_type: args.triggerType,
      success: args.success,
      steps_executed: args.stepsExecuted,
      error: args.error || null,
      created_at: new Date(),
    });
  }

  async logPrompt(args: any) {
    const db = await this.getDb();
    await db.collection('prompt_history').insertOne({
      user_id: args.organizationId,
      messages: args.messages,
      system_prompt: args.systemPrompt || null,
      reply: args.reply,
      provider: args.provider,
      model: args.model,
      tokens_used: args.tokensUsed,
      latency_ms: args.latencyMs,
      created_at: new Date(),
    });
  }

  async logSentimentAnalysis(args: any) {
    const db = await this.getDb();
    await db.collection('sentiment_analysis_logs').insertOne({
      user_id: args.organizationId,
      contact_id: args.contactId,
      conversation_id: args.conversationId,
      text: args.text,
      intent: args.intent,
      sentiment: args.sentiment,
      language: args.language,
      wants_human: args.wantsHuman,
      created_at: new Date(),
    });
  }

  async logAIUsage(log: any) {
    const db = await this.getDb();
    await db.collection('ai_usage_logs').insertOne({
      user_id: log.organizationId,
      operation: log.operation,
      provider: log.provider,
      model: log.model,
      total_tokens: log.totalTokens,
      confidence: log.confidence ?? null,
      finish_reason: log.finishReason ?? null,
      created_at: new Date(),
    });
  }

  async listAIUsageLogs(organizationId: string, limit = 100) {
    const db = await this.getDb();
    return db
      .collection('ai_usage_logs')
      .find({ user_id: organizationId })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();
  }

  async logAuthEvent(args: any) {
    const db = await this.getDb();
    await db.collection('auth_events').insertOne({
      user_id: args.organizationId || null,
      email: args.email,
      event_type: args.eventType,
      status: args.status,
      ip_address: args.ipAddress,
      user_agent: args.userAgent,
      error_message: args.errorMessage || null,
      created_at: new Date(),
    });
  }

  async upsertUser(organizationId: string, data: any) {
    const db = await this.getDb();
    const userDoc: Record<string, any> = {
      id: organizationId,
      email: data.email,
      updated_at: new Date(),
    };
    if (data.fullName) {
      userDoc.full_name = data.fullName;
    }
    await db.collection('users').updateOne(
      { id: organizationId },
      {
        $set: userDoc,
        $setOnInsert: {
          created_at: new Date(),
        },
      },
      { upsert: true }
    );
  }

  async getAIConversation(conversationId: string) {
    const db = await this.getDb();
    return db.collection('ai_conversations').findOne({ conversation_id: conversationId });
  }

  async upsertAIConversation(conversationId: string, updates: any) {
    const db = await this.getDb();
    const setFields: Record<string, any> = {
      updated_at: new Date(),
    };

    if (updates.totalAiMessages !== undefined) setFields.total_ai_messages = updates.totalAiMessages;
    if (updates.aiActive !== undefined) setFields.ai_active = updates.aiActive;
    if (updates.handedOffAt !== undefined) setFields.handed_off_at = updates.handedOffAt;
    if (updates.provider !== undefined) setFields.provider = updates.provider;
    if (updates.model !== undefined) setFields.model = updates.model;

    await db.collection('ai_conversations').updateOne(
      { conversation_id: conversationId },
      {
        $set: setFields,
        $setOnInsert: {
          user_id: updates.organizationId,
          created_at: new Date(),
        },
      },
      { upsert: true }
    );
  }

  async listAIConversationsByUser(organizationId: string) {
    const db = await this.getDb();
    return db
      .collection('ai_conversations')
      .find({ user_id: organizationId })
      .sort({ updated_at: -1 })
      .toArray();
  }

  async getSummary(conversationId: string) {
    const db = await this.getDb();
    return db
      .collection('conversation_summaries')
      .findOne({ conversation_id: conversationId }, { sort: { created_at: -1 } });
  }

  async upsertSummary(conversationId: string, args: any) {
    const db = await this.getDb();
    await db.collection('conversation_summaries').updateOne(
      { conversation_id: conversationId },
      {
        $set: {
          user_id: args.organizationId,
          summary: args.summary,
          message_count_at_summary: args.messageCountAtSummary,
          provider: args.provider,
          model: args.model,
          tokens_used: args.tokensUsed,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        },
      },
      { upsert: true }
    );
  }

  async listPromptTemplates(organizationId: string) {
    const db = await this.getDb();
    return db
      .collection('prompt_templates')
      .find({ user_id: organizationId })
      .sort({ created_at: -1 })
      .toArray();
  }

  async unsetDefaultPromptTemplates(organizationId: string) {
    const db = await this.getDb();
    await db.collection('prompt_templates').updateMany(
      { user_id: organizationId },
      { $set: { is_default: false, updated_at: new Date() } }
    );
  }

  async upsertPromptTemplate(organizationId: string, templateId: string, data: any) {
    const db = await this.getDb();
    await db.collection('prompt_templates').updateOne(
      { id: templateId, user_id: organizationId },
      {
        $set: {
          name: data.name,
          description: data.description || null,
          content: data.content,
          is_default: data.is_default,
          intent_filter: data.intent_filter || [],
          updated_at: new Date(),
        },
        $setOnInsert: {
          id: templateId,
          user_id: organizationId,
          created_at: new Date(),
        },
      },
      { upsert: true }
    );
  }

  async deletePromptTemplate(organizationId: string, templateId: string) {
    const db = await this.getDb();
    await db.collection('prompt_templates').deleteOne({
      id: templateId,
      user_id: organizationId,
    });
  }

  async listKnowledgeBase(organizationId: string) {
    const db = await this.getDb();
    return db
      .collection('knowledge_base')
      .find({ user_id: organizationId })
      .sort({ created_at: -1 })
      .toArray();
  }

  async getKnowledgeDoc(organizationId: string, docId: string) {
    const db = await this.getDb();
    return db.collection('knowledge_base').findOne({ id: docId, user_id: organizationId });
  }

  async insertKnowledgeDoc(doc: Record<string, any>) {
    const db = await this.getDb();
    await db.collection('knowledge_base').insertOne({
      ...doc,
      created_at: new Date(),
    });
  }

  async updateKnowledgeDoc(docId: string, updates: Record<string, any>) {
    const db = await this.getDb();
    await db.collection('knowledge_base').updateOne(
      { id: docId },
      { $set: { ...updates, updated_at: new Date() } }
    );
  }

  async deleteKnowledgeDoc(docId: string) {
    const db = await this.getDb();
    await db.collection('knowledge_base').deleteOne({ id: docId });
  }

  async getKnowledgeDocTitles(kbIds: string[]) {
    const db = await this.getDb();
    return db
      .collection('knowledge_base')
      .find({ id: { $in: kbIds } })
      .project({ id: 1, title: 1 })
      .toArray();
  }

  async logKnowledgeSearch(organizationId: string, query: string, hitCount: number, latencyMs: number, success: boolean) {
    const db = await this.getDb();
    await db.collection('knowledge_search_logs').insertOne({
      user_id: organizationId,
      query,
      hit_count: hitCount,
      latency_ms: latencyMs,
      success,
      created_at: new Date(),
    });
  }

  async logKnowledgeUsage(organizationId: string, docId: string) {
    const db = await this.getDb();
    await db.collection('knowledge_usage_stats').updateOne(
      { user_id: organizationId, knowledge_base_id: docId },
      {
        $inc: { usage_count: 1 },
        $set: { updated_at: new Date() },
        $setOnInsert: { created_at: new Date() },
      },
      { upsert: true }
    );
  }

  async getKnowledgeAnalytics(organizationId: string) {
    const db = await this.getDb();
    const searchLogs = await db
      .collection('knowledge_search_logs')
      .find({ user_id: organizationId })
      .sort({ created_at: -1 })
      .limit(100)
      .toArray();

    const usageStats = await db
      .collection('knowledge_usage_stats')
      .find({ user_id: organizationId })
      .sort({ usage_count: -1 })
      .limit(20)
      .toArray();

    return {
      searchLogs,
      usageStats,
    };
  }

  async listAIAgents(organizationId: string): Promise<AIAgentConfig[]> {
    const db = await this.getDb();
    const docs = await db
      .collection('ai_agent_configs')
      .find({ user_id: organizationId })
      .toArray();
    return docs.map(doc => ({
      organizationId: doc.user_id,
      agentId: doc.agent_id,
      enabled: doc.enabled,
      name: doc.name,
      description: doc.description,
      systemPrompt: doc.system_prompt,
      provider: doc.provider,
      model: doc.model,
      temperature: doc.temperature,
      priority: doc.priority,
      tools: doc.tools || [],
      updatedAt: doc.updated_at ? doc.updated_at.toISOString() : new Date().toISOString(),
    })) as AIAgentConfig[];
  }

  async getAIAgent(organizationId: string, agentId: string): Promise<AIAgentConfig | null> {
    const db = await this.getDb();
    const doc = await db.collection('ai_agent_configs').findOne({ user_id: organizationId, agent_id: agentId });
    if (!doc) return null;
    return {
      organizationId: doc.user_id,
      agentId: doc.agent_id,
      enabled: doc.enabled,
      name: doc.name,
      description: doc.description,
      systemPrompt: doc.system_prompt,
      provider: doc.provider,
      model: doc.model,
      temperature: doc.temperature,
      priority: doc.priority,
      tools: doc.tools || [],
      updatedAt: doc.updated_at ? doc.updated_at.toISOString() : new Date().toISOString(),
    } as AIAgentConfig;
  }

  async upsertAIAgent(organizationId: string, agentId: string, data: Partial<AIAgentConfig>) {
    const db = await this.getDb();
    const updates: Record<string, any> = {
      updated_at: new Date(),
    };
    if (data.enabled !== undefined) updates.enabled = data.enabled;
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.systemPrompt !== undefined) updates.system_prompt = data.systemPrompt;
    if (data.provider !== undefined) updates.provider = data.provider;
    if (data.model !== undefined) updates.model = data.model;
    if (data.temperature !== undefined) updates.temperature = data.temperature;
    if (data.priority !== undefined) updates.priority = data.priority;
    if (data.tools !== undefined) updates.tools = data.tools;

    await db.collection('ai_agent_configs').updateOne(
      { user_id: organizationId, agent_id: agentId },
      {
        $set: updates,
        $setOnInsert: {
          user_id: organizationId,
          agent_id: agentId,
          created_at: new Date(),
        },
      },
      { upsert: true }
    );
  }

  async deleteAIAgent(organizationId: string, agentId: string) {
    const db = await this.getDb();
    await db.collection('ai_agent_configs').deleteOne({ user_id: organizationId, agent_id: agentId });
  }

  // Sales Intelligence MongoDB implementations
  async saveLeadAnalysis(contactId: string, organizationId: string, data: any) {
    const db = await this.getDb();
    await db.collection('ai_lead_analysis').updateOne(
      { contact_id: contactId },
      {
        $set: {
          user_id: organizationId,
          analysis: data,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        }
      },
      { upsert: true }
    );
  }

  async getLeadAnalysis(contactId: string) {
    const db = await this.getDb();
    const doc = await db.collection('ai_lead_analysis').findOne({ contact_id: contactId });
    return doc ? doc.analysis : null;
  }

  async saveSalesPredictions(contactId: string, organizationId: string, data: any) {
    const db = await this.getDb();
    await db.collection('sales_predictions').updateOne(
      { contact_id: contactId },
      {
        $set: {
          user_id: organizationId,
          predictions: data,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        }
      },
      { upsert: true }
    );
  }

  async getSalesPredictions(contactId: string) {
    const db = await this.getDb();
    const doc = await db.collection('sales_predictions').findOne({ contact_id: contactId });
    return doc ? doc.predictions : null;
  }

  async saveAIRecommendations(contactId: string, organizationId: string, data: any) {
    const db = await this.getDb();
    await db.collection('ai_recommendations').updateOne(
      { contact_id: contactId },
      {
        $set: {
          user_id: organizationId,
          recommendations: data,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        }
      },
      { upsert: true }
    );
  }

  async getAIRecommendations(contactId: string) {
    const db = await this.getDb();
    const doc = await db.collection('ai_recommendations').findOne({ contact_id: contactId });
    return doc ? doc.recommendations : null;
  }

  async saveProposalDraft(contactId: string, organizationId: string, data: any) {
    const db = await this.getDb();
    await db.collection('proposal_drafts').updateOne(
      { contact_id: contactId },
      {
        $set: {
          user_id: organizationId,
          draft: data,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        }
      },
      { upsert: true }
    );
  }

  async getProposalDraft(contactId: string) {
    const db = await this.getDb();
    const doc = await db.collection('proposal_drafts').findOne({ contact_id: contactId });
    return doc ? doc.draft : null;
  }

  async saveQuotationDraft(contactId: string, organizationId: string, data: any) {
    const db = await this.getDb();
    await db.collection('quotation_drafts').updateOne(
      { contact_id: contactId },
      {
        $set: {
          user_id: organizationId,
          draft: data,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        }
      },
      { upsert: true }
    );
  }

  async getQuotationDraft(contactId: string) {
    const db = await this.getDb();
    const doc = await db.collection('quotation_drafts').findOne({ contact_id: contactId });
    return doc ? doc.draft : null;
  }

  async saveMeetingSummary(meetingId: string, organizationId: string, summary: any) {
    const db = await this.getDb();
    await db.collection('meeting_summaries').updateOne(
      { meeting_id: meetingId },
      {
        $set: {
          user_id: organizationId,
          summary: summary,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        }
      },
      { upsert: true }
    );
  }

  async getMeetingSummary(meetingId: string) {
    const db = await this.getDb();
    const doc = await db.collection('meeting_summaries').findOne({ meeting_id: meetingId });
    return doc ? doc.summary : null;
  }

  // Marketing Automation Extensions
  async saveCampaignStrategy(campaignId: string, organizationId: string, data: any) {
    const db = await this.getDb();
    await db.collection('campaign_strategies').updateOne(
      { campaign_id: campaignId },
      {
        $set: {
          user_id: organizationId,
          strategy: data,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        }
      },
      { upsert: true }
    );
  }

  async getCampaignStrategy(campaignId: string) {
    const db = await this.getDb();
    const doc = await db.collection('campaign_strategies').findOne({ campaign_id: campaignId });
    return doc ? doc.strategy : null;
  }

  async saveAudienceBehavior(contactId: string, organizationId: string, data: any) {
    const db = await this.getDb();
    await db.collection('audience_behavior').updateOne(
      { contact_id: contactId },
      {
        $set: {
          user_id: organizationId,
          behavior: data,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        }
      },
      { upsert: true }
    );
  }

  async saveSocialSync(channel: string, payload: any) {
    const db = await this.getDb();
    await db.collection('social_sync_logs').insertOne({
      channel,
      payload,
      created_at: new Date(),
    });
  }

  async saveMarketingPredictions(campaignId: string, predictions: any) {
    const db = await this.getDb();
    await db.collection('marketing_predictions').updateOne(
      { campaign_id: campaignId },
      {
        $set: {
          predictions,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        }
      },
      { upsert: true }
    );
  }
}
