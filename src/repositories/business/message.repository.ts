import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseRepository } from '../supabase.repository';
import { Message } from '@/types';

export class MessageRepository extends SupabaseRepository<Message> {
  constructor(client: SupabaseClient) {
    super(client, 'messages');
  }

  async updateStatus(messageId: string, status: string): Promise<Message | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .update({ status } as any)
      .eq('message_id', messageId)
      .select()
      .maybeSingle();

    if (error) {
      console.error(`[MessageRepository] updateStatus failed:`, error);
      throw error;
    }
    return data as Message;
  }

  async countCustomerMessages(conversationId: string): Promise<number> {
    const { count, error } = await this.client
      .from(this.tableName)
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .eq('sender_type', 'customer');

    if (error) {
      console.error(`[MessageRepository] countCustomerMessages failed:`, error);
      throw error;
    }
    return count ?? 0;
  }

  async countTotalMessages(conversationId: string): Promise<number> {
    const { count, error } = await this.client
      .from(this.tableName)
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conversationId);

    if (error) {
      console.error(`[MessageRepository] countTotalMessages failed:`, error);
      throw error;
    }
    return count ?? 0;
  }

  async getRecentMessages(conversationId: string, limit = 20): Promise<any[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('sender_type, content_text, created_at')
      .eq('conversation_id', conversationId)
      .not('content_text', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error(`[MessageRepository] getRecentMessages failed:`, error);
      throw error;
    }
    return data || [];
  }

  async findByWhatsAppId(whatsappMessageId: string): Promise<Message | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('whatsapp_message_id', whatsappMessageId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error(`[MessageRepository] findByWhatsAppId failed:`, error);
      throw error;
    }
    return data as Message || null;
  }
}
