import { getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebaseAdmin';

export interface IBaseRepository<T> {
  getById(id: string): Promise<T | null>;
  save(id: string, item: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

export abstract class FirestoreRepository<T> implements IBaseRepository<T> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  protected getDb() {
    return getFirestore();
  }

  protected getCollection() {
    return this.getDb().collection(this.collectionName);
  }

  async getById(id: string): Promise<T | null> {
    const docRef = this.getCollection().doc(id);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return docSnap.data() as T;
    }
    return null;
  }

  async save(id: string, item: Partial<T>): Promise<T> {
    const docRef = this.getCollection().doc(id);
    await docRef.set(item, { merge: true });
    const updatedSnap = await docRef.get();
    return updatedSnap.data() as T;
  }

  async delete(id: string): Promise<void> {
    await this.getCollection().doc(id).delete();
  }
}
