import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseRepository } from '../supabase.repository';
import { Conversation } from '@/types';

export class ConversationRepository extends SupabaseRepository<Conversation> {
  constructor(client: SupabaseClient) {
    super(client, 'conversations');
  }

  async findByContact(userId: string, contactId: string): Promise<Conversation | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .eq('contact_id', contactId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error(`[ConversationRepository] findByContact failed:`, error);
      throw error;
    }
    return data as Conversation || null;
  }

  async findByIds(conversationIds: string[]): Promise<any[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(`
        id,
        last_message_text,
        last_message_at,
        contacts (
          id,
          name,
          phone
        )
      `)
      .in('id', conversationIds);

    if (error) {
      console.error(`[ConversationRepository] findByIds failed:`, error);
      throw error;
    }
    return data || [];
  }
}
