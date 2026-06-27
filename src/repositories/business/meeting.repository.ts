import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseRepository } from '../supabase.repository';

export class MeetingRepository extends SupabaseRepository<any> {
  constructor(client: SupabaseClient) { super(client, 'meeting_bookings'); }
  async getRecentMeetingBookings(contactId: string, limit = 3) {
    const { data } = await this.client.from(this.tableName).select('*').eq('contact_id', contactId).order('created_at', { ascending: false }).limit(limit);
    return data || [];
  }
  async createMeetingBooking(userId: string, contactId: string, conversationId: string, title: string, startTime: string, endTime: string, meetingLink: string) {
    const { data } = await this.client.from(this.tableName).insert({ user_id: userId, contact_id: contactId, conversation_id: conversationId, title, start_time: startTime, end_time: endTime, meeting_link: meetingLink, status: 'scheduled' }).select('id').single();
    return data?.id || null;
  }
}
