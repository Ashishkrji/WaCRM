import { describe, it, expect, vi, beforeEach } from 'vitest'
import { chunkText, ingestText, fetchWebsiteContent } from './ingest'
import { dbService } from '@/services/db'
import { generateEmbedding } from './embeddings'

vi.mock('@/services/db', () => {
  return {
    dbService: {
      ai: {
        updateKnowledgeDoc: vi.fn().mockResolvedValue({}),
        deleteKnowledgeEmbeddings: vi.fn().mockResolvedValue({}),
        insertKnowledgeEmbeddings: vi.fn().mockResolvedValue({}),
      },
    },
  }
})

vi.mock('./embeddings', () => {
  return {
    generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
  }
})

describe('Knowledge Ingestion - chunkText', () => {
  it('should return a single chunk if text is smaller than chunk size', () => {
    const text = 'Short text content.'
    const chunks = chunkText(text, 50, 5)
    expect(chunks).toEqual(['Short text content.'])
  })

  it('should split text into chunks using overlapping window', () => {
    const text = 'This is a long piece of text that will be split into multiple pieces.'
    // Chunk size 20, overlap 5
    const chunks = chunkText(text, 20, 5)
    expect(chunks.length).toBeGreaterThan(1)
    
    // Ensure all chunks are smaller or equal to chunk size limits (when not forced by word lengths)
    chunks.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(25) // allowing boundary adjustment
    })
  })

  it('should prefer sentence boundaries for splitting', () => {
    const text = 'First sentence here. Second sentence starts here.'
    // If chunk size is 30 and overlap is 0, it should split cleanly at the period
    const chunks = chunkText(text, 30, 0)
    expect(chunks[0]).toBe('First sentence here.')
    expect(chunks[1]).toBe('Second sentence starts here.')
  })
})

describe('Knowledge Ingestion - ingestText Pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should process text, call embeddings generator, and store to database', async () => {
    const userId = 'user-123'
    const knowledgeBaseId = 'kb-abc'
    const content = 'This is content to ingest. It has multiple sentences to chunk.'

    const result = await ingestText({
      userId,
      knowledgeBaseId,
      content,
    })

    expect(result).toBeGreaterThan(0)
    expect(dbService.ai.updateKnowledgeDoc).toHaveBeenNthCalledWith(1, knowledgeBaseId, {
      status: 'processing',
    })
    expect(generateEmbedding).toHaveBeenCalled()
    expect(dbService.ai.deleteKnowledgeEmbeddings).toHaveBeenCalledWith(knowledgeBaseId)
    expect(dbService.ai.insertKnowledgeEmbeddings).toHaveBeenCalled()
    expect(dbService.ai.updateKnowledgeDoc).toHaveBeenNthCalledWith(2, knowledgeBaseId, {
      status: 'ready',
      chunk_count: result,
      embedding_model: 'nvidia/nv-embed-v2',
    })
  })

  it('should update document to failed status if ingestion throws an error', async () => {
    vi.mocked(generateEmbedding).mockRejectedValueOnce(new Error('Embedding API failed'))

    const result = await ingestText({
      userId: 'user-123',
      knowledgeBaseId: 'kb-abc',
      content: 'Trigger failure.',
    })

    expect(result).toBe(-1)
    expect(dbService.ai.updateKnowledgeDoc).toHaveBeenCalledWith('kb-abc', {
      status: 'failed',
      error_message: 'Embedding API failed',
    })
  })
})

describe('Knowledge Ingestion - fetchWebsiteContent', () => {
  it('should fetch URL and parse clean text from HTML, removing style & scripts', async () => {
    const mockHtml = `
      <html>
        <head>
          <style>body { color: red; }</style>
          <script>console.log("hello");</script>
        </head>
        <body>
          <h1>Agency Website</h1>
          <p>We provide Next.js web applications.</p>
          <p>Price starting at &amp; ₹15,000 &nbsp; only.</p>
        </body>
      </html>
    `

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockHtml,
    }))

    const text = await fetchWebsiteContent('https://example.com')
    vi.unstubAllGlobals()

    expect(text).toContain('Agency Website')
    expect(text).toContain('We provide Next.js web applications.')
    expect(text).toContain('Price starting at & ₹15,000 only.')
    
    // Ensure scripts/styles are stripped
    expect(text).not.toContain('color: red')
    expect(text).not.toContain('console.log')
  })
})
