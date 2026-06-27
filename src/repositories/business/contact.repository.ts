import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseRepository } from '../supabase.repository';
import { Contact } from '@/types';
import { phonesMatch } from '@/lib/whatsapp/phone-utils';

export class ContactRepository extends SupabaseRepository<Contact> {
  constructor(client: SupabaseClient) {
    super(client, 'contacts');
  }

  async findByPhone(userId: string, phone: string): Promise<Contact | null> {
    const { data: contacts, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error(`[ContactRepository] findByPhone failed:`, error);
      throw error;
    }

    return contacts?.find((c) => phonesMatch(c.phone, phone)) as Contact || null;
  }
}
