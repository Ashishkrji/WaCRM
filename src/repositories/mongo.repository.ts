import { Db, Collection, ObjectId, Filter, Document } from 'mongodb';
import { IRepository } from './base.repository';
import { connectToDatabase } from '../lib/mongodb';

export class MongoRepository<T extends Document> implements IRepository<T> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  protected async getCollection(): Promise<Collection<T>> {
    const { db } = await connectToDatabase();
    return db.collection<T>(this.collectionName);
  }

  async findById(id: string): Promise<T | null> {
    try {
      const collection = await this.getCollection();
      const result = await collection.findOne({ _id: new ObjectId(id) } as Filter<T>);
      return result as T | null;
    } catch (error) {
      console.error(`[MongoRepository] findById error on ${this.collectionName}:`, error);
      return null;
    }
  }

  async findMany(filter?: Record<string, any>): Promise<T[]> {
    try {
      const collection = await this.getCollection();
      const cursor = collection.find((filter || {}) as Filter<T>);
      const results = await cursor.toArray();
      return results as T[];
    } catch (error) {
      console.error(`[MongoRepository] findMany error on ${this.collectionName}:`, error);
      return [];
    }
  }

  async create(data: Partial<T>): Promise<T> {
    try {
      const collection = await this.getCollection();
      const result = await collection.insertOne(data as any);
      return { ...data, _id: result.insertedId } as unknown as T;
    } catch (error) {
      console.error(`[MongoRepository] create error on ${this.collectionName}:`, error);
      throw error;
    }
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    try {
      const collection = await this.getCollection();
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) } as Filter<T>,
        { $set: data },
        { returnDocument: 'after' }
      );
      return result as T | null;
    } catch (error) {
      console.error(`[MongoRepository] update error on ${this.collectionName}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) } as Filter<T>);
      return result.deletedCount === 1;
    } catch (error) {
      console.error(`[MongoRepository] delete error on ${this.collectionName}:`, error);
      return false;
    }
  }
}
