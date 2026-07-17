import { IBaseRepository } from '@/shared/infrastructure/repositories/baseRepository';

export interface ResumeData {
  uid: string;
  filename?: string;
  resumeText?: string;
  updatedAt?: string;
}

export interface IResumeRepository extends IBaseRepository<ResumeData> {
  getResumeByUid(uid: string): Promise<ResumeData | null>;
}

export class ResumeRepository implements IResumeRepository {
  async getById(id: string): Promise<ResumeData | null> {
    return this.getResumeByUid(id);
  }

  async getResumeByUid(uid: string): Promise<ResumeData | null> {
    const { getFirestore } = await import('firebase-admin/firestore');
    const db = getFirestore();
    const docRef = db.collection('users').doc(uid);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      const data = docSnap.data();
      if (data?.currentResumeText) {
        return {
          uid,
          filename: data.currentResumeFilename,
          resumeText: data.currentResumeText,
          updatedAt: data.updatedAt
        };
      }
    }
    return null;
  }

  async save(uid: string, data: Partial<ResumeData>): Promise<ResumeData> {
    const { getFirestore } = await import('firebase-admin/firestore');
    const db = getFirestore();
    const docRef = db.collection('users').doc(uid);
    
    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };
    if (data.filename !== undefined) {
      updateData.currentResumeFilename = data.filename;
    }
    if (data.resumeText !== undefined) {
      updateData.currentResumeText = data.resumeText;
    }

    await docRef.set(updateData, { merge: true });
    
    return {
      uid,
      filename: data.filename,
      resumeText: data.resumeText,
      updatedAt: updateData.updatedAt
    };
  }

  async delete(uid: string): Promise<void> {
    const { getFirestore } = await import('firebase-admin/firestore');
    const db = getFirestore();
    const docRef = db.collection('users').doc(uid);
    await docRef.update({
      currentResumeFilename: null,
      currentResumeText: null
    });
  }
}

export const resumeRepository: IResumeRepository = new ResumeRepository();
export default resumeRepository;
