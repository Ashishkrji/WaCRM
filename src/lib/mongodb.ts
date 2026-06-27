import { MongoClient, Db } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let indexesEnsured = false;

/**
 * Ensures indexes exist in the MongoDB collections.
 * Runs once per process lifetime when the database connects.
 */
async function ensureIndexes(db: Db): Promise<void> {
  if (indexesEnsured) return;

  try {
    // Indexes on knowledge_base
    await db.collection('knowledge_base').createIndex({ organization_id: 1 });
    await db.collection('knowledge_base').createIndex({ status: 1 });

    // Indexes on knowledge_embeddings
    await db.collection('knowledge_embeddings').createIndex({ organization_id: 1 });
    await db.collection('knowledge_embeddings').createIndex({ knowledge_base_id: 1 });

    // Indexes on ai_conversations
    await db.collection('ai_conversations').createIndex({ conversation_id: 1 }, { unique: true });
    await db.collection('ai_conversations').createIndex({ organization_id: 1 });

    // Indexes on conversation_memory (Enterprise Architecture)
    await db.collection('conversation_memory').createIndex({ organization_id: 1, customer_id: 1 });

    // Indexes on conversation_summaries
    await db.collection('conversation_summaries').createIndex({ conversation_id: 1 }, { unique: true });

    // Indexes on prompt_templates / prompt_logs
    await db.collection('prompt_templates').createIndex({ organization_id: 1 });
    await db.collection('prompt_logs').createIndex({ organization_id: 1 });
    
    // Workflow Intelligence
    await db.collection('workflow_intelligence').createIndex({ organization_id: 1 });

    // Indexes on ai_logs (Replaces usage_logs)
    await db.collection('ai_logs').createIndex({ organization_id: 1 });
    await db.collection('ai_logs').createIndex({ created_at: -1 });

    // Log-specific indexes
    await db.collection('webhook_logs').createIndex({ organization_id: 1 });
    await db.collection('webhook_logs').createIndex({ created_at: -1 });
    await db.collection('automation_logs').createIndex({ organization_id: 1 });
    await db.collection('automation_logs').createIndex({ created_at: -1 });

    indexesEnsured = true;
    console.log('[MongoDB] Enterprise SaaS Database collections indexes ensured.');
  } catch (error) {
    console.error('[MongoDB] Failed to ensure indexes:', error);
  }
}

/**
 * Connects to MongoDB Atlas and returns client & db instances.
 * Caches connections globally to optimize serverless performance.
 */
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  const dbName = process.env.MONGODB_DATABASE || process.env.MONGODB_DB_NAME || 'wacrm';

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 2,
  });

  await client.connect();
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  // Run index configuration
  await ensureIndexes(db);

  return { client, db };
}
