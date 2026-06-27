export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findMany(filter?: Record<string, any>): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}
