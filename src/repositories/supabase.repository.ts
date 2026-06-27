import { SupabaseClient } from '@supabase/supabase-js';
import { IRepository } from './base.repository';

export class SupabaseRepository<T> implements IRepository<T> {
  protected client: SupabaseClient;
  protected tableName: string;

  constructor(client: SupabaseClient, tableName: string) {
    this.client = client;
    this.tableName = tableName;
  }

  async findById(id: string): Promise<T | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`[SupabaseRepository] findById error on ${this.tableName}:`, error);
      return null;
    }
    return data as T;
  }

  async findMany(filter?: Record<string, any>): Promise<T[]> {
    let query = this.client.from(this.tableName).select('*');
    
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    const { data, error } = await query;
    
    if (error) {
      console.error(`[SupabaseRepository] findMany error on ${this.tableName}:`, error);
      return [];
    }
    return data as T[];
  }

  async create(data: Partial<T>): Promise<T> {
    const { data: createdData, error } = await this.client
      .from(this.tableName)
      .insert(data as any)
      .select()
      .single();

    if (error) {
      console.error(`[SupabaseRepository] create error on ${this.tableName}:`, error);
      throw error;
    }
    return createdData as T;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const { data: updatedData, error } = await this.client
      .from(this.tableName)
      .update(data as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`[SupabaseRepository] update error on ${this.tableName}:`, error);
      throw error;
    }
    return updatedData as T;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`[SupabaseRepository] delete error on ${this.tableName}:`, error);
      return false;
    }
    return true;
  }
}
