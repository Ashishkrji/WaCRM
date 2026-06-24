import { BusinessService } from './business.service'
import { AIService } from './ai.service'
import { SyncService } from './sync.service'

class DatabaseService {
  public business: BusinessService
  public ai: AIService
  public sync: SyncService

  constructor() {
    this.business = new BusinessService()
    this.ai = new AIService()
    this.sync = new SyncService(this.business, this.ai)
  }
}

export const dbService = new DatabaseService()
export { BusinessService, AIService, SyncService }
export * from './types'
