/**
 * Resume Intelligence — Version Manager
 *
 * Compares current profile data against new extractions, calculates diff logs
 * (added skills, removed skills, company updates, score differences),
 * persists versions in Firestore subcollections, and handles rollbacks.
 */

import { getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebaseAdmin';
import { logger } from '@/services/logger';
import type {
  UnifiedCareerProfile,
  ProfileVersionEntry,
} from './types';

function getDb() {
  return getFirestore();
}

export class ProfileVersionManager {
  /**
   * Compares the new parsed profile against the existing active profile
   * and builds a detailed version difference log.
   */
  buildDiffLog(
    oldProfile: any | null,
    newProfile: Omit<UnifiedCareerProfile, 'profileVersion' | 'profileHash' | 'completeness' | 'validation' | 'careerProfile'>,
    newScore: number
  ): Omit<ProfileVersionEntry, 'versionNumber' | 'uploadTime' | 'fileHash' | 'profileHash'> {
    const changedFields: string[] = [];
    const addedSkills: string[] = [];
    const removedSkills: string[] = [];
    const updatedExperience: string[] = [];

    const oldScore = oldProfile?.completeness?.overallScore ?? 0;
    const completenessScoreDifference = newScore - oldScore;

    if (!oldProfile) {
      // First version
      changedFields.push('Profile Initialized');
      return {
        changedFields,
        addedSkills,
        removedSkills,
        updatedExperience,
        completenessScoreDifference,
      };
    }

    // Helper to extract a string value safely from a field that may be wrapped ({ value: '...' }) or raw string ('...')
    const getVal = (field: any): string => {
      if (field === null || field === undefined) return '';
      if (typeof field === 'string') return field.trim();
      if (typeof field === 'object' && field.value !== undefined) {
        return String(field.value || '').trim();
      }
      return String(field).trim();
    };

    // 1. Compare Personal / Contact Info
    const oldContact = oldProfile.contact || oldProfile.personalInfo || {};
    const newContact = newProfile.contact || {};

    const contactKeys: Array<keyof typeof newContact> = ['fullName', 'email', 'city', 'country', 'github', 'linkedin'];
    contactKeys.forEach((key) => {
      const oldVal = getVal(oldContact[key] || (key === 'city' ? oldContact.location : undefined));
      const newVal = getVal(newContact[key]);
      if (oldVal !== newVal) {
        changedFields.push(`contact.${String(key)}`);
      }
    });

    // 2. Compare Skills
    const getFlattenedSkills = (prof: any): string[] => {
      if (!prof || !prof.skills) return [];
      
      if (Array.isArray(prof.skills)) {
        return prof.skills.map((s: any) => getVal(s).toLowerCase()).filter(Boolean);
      }
      
      if (typeof prof.skills === 'object') {
        const flatList: string[] = [];
        const categories = Object.values(prof.skills);
        for (const cat of categories) {
          if (Array.isArray(cat)) {
            for (const item of cat) {
              const v = getVal(item).toLowerCase();
              if (v) flatList.push(v);
            }
          }
        }
        return flatList;
      }
      return [];
    };

    const oldFlattened = getFlattenedSkills(oldProfile);
    const newFlattened = getFlattenedSkills(newProfile);

    // Added
    newFlattened.forEach((s) => {
      if (!oldFlattened.includes(s)) {
        const categories = Object.values(newProfile.skills || {});
        let display = s;
        for (const cat of categories) {
          if (Array.isArray(cat)) {
            const found = cat.find((item) => getVal(item).toLowerCase() === s);
            if (found) {
              display = getVal(found);
              break;
            }
          }
        }
        addedSkills.push(display);
      }
    });

    // Removed
    oldFlattened.forEach((s) => {
      if (!newFlattened.includes(s)) {
        let display = s;
        if (oldProfile.skills) {
          if (Array.isArray(oldProfile.skills)) {
            const found = oldProfile.skills.find((item: any) => getVal(item).toLowerCase() === s);
            if (found) display = getVal(found);
          } else if (typeof oldProfile.skills === 'object') {
            const categories = Object.values(oldProfile.skills);
            for (const cat of categories) {
              if (Array.isArray(cat)) {
                const found = cat.find((item: any) => getVal(item).toLowerCase() === s);
                if (found) {
                  display = getVal(found);
                  break;
                }
              }
            }
          }
        }
        removedSkills.push(display);
      }
    });

    if (addedSkills.length > 0 || removedSkills.length > 0) {
      changedFields.push('skills');
    }

    // 3. Compare Experience
    const getCompanies = (prof: any): string[] => {
      if (!prof || !prof.experience || !Array.isArray(prof.experience)) return [];
      return prof.experience.map((e: any) => getVal(e.company).toLowerCase()).filter(Boolean);
    };

    const oldCompanies = getCompanies(oldProfile);
    const newCompanies = getCompanies(newProfile);

    newCompanies.forEach((c, idx) => {
      if (!oldCompanies.includes(c)) {
        const expItem = newProfile.experience[idx];
        const role = getVal(expItem?.role) || 'Role';
        const company = getVal(expItem?.company) || 'Company';
        updatedExperience.push(`Added Experience: ${role} at ${company}`);
      }
    });

    oldCompanies.forEach((c, idx) => {
      if (!newCompanies.includes(c)) {
        const expItem = oldProfile.experience[idx];
        const role = getVal(expItem?.role) || 'Role';
        const company = getVal(expItem?.company) || 'Company';
        updatedExperience.push(`Removed Experience: ${role} at ${company}`);
      }
    });

    if (updatedExperience.length > 0) {
      changedFields.push('experience');
    }

    // 4. Compare Summary
    const oldSummary = getVal(oldProfile.summary);
    const newSummary = getVal(newProfile.summary);
    if (oldSummary !== newSummary && (oldSummary || newSummary)) {
      changedFields.push('summary');
    }

    // 5. Compare Projects
    const oldProjectsCount = Array.isArray(oldProfile.projects) ? oldProfile.projects.length : 0;
    const newProjectsCount = Array.isArray(newProfile.projects) ? newProfile.projects.length : 0;
    if (oldProjectsCount !== newProjectsCount) {
      changedFields.push('projects');
    }

    return {
      changedFields,
      addedSkills,
      removedSkills,
      updatedExperience,
      completenessScoreDifference,
    };
  }

  /**
   * Saves a version log entry to the user's Firestore subcollection.
   */
  async saveVersionEntry(uid: string, entry: ProfileVersionEntry, fullProfileData: UnifiedCareerProfile): Promise<void> {
    try {
      const db = getDb();
      const versionRef = db
        .collection('users')
        .doc(uid)
        .collection('profile_versions')
        .doc(entry.versionNumber.toString());

      await versionRef.set({
        metadata: entry,
        profileData: fullProfileData,
        savedAt: new Date().toISOString(),
      });

      logger.info(`[ProfileVersionManager] Saved profile version ${entry.versionNumber} for user ${uid}`);
    } catch (error) {
      logger.error(`[ProfileVersionManager] Failed to save version entry for user ${uid}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves all version history entries for a given user.
   */
  async getVersionHistory(uid: string): Promise<ProfileVersionEntry[]> {
    try {
      const db = getDb();
      const snap = await db
        .collection('users')
        .doc(uid)
        .collection('profile_versions')
        .orderBy('metadata.versionNumber', 'desc')
        .get();

      const history: ProfileVersionEntry[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        if (data.metadata) {
          history.push(data.metadata as ProfileVersionEntry);
        }
      });
      return history;
    } catch (error) {
      logger.error(`[ProfileVersionManager] Failed to fetch version history for user ${uid}:`, error);
      throw error;
    }
  }

  /**
   * Performs profile rollback to a specific version.
   */
  async rollbackToVersion(uid: string, versionNumber: number): Promise<UnifiedCareerProfile> {
    try {
      const db = getDb();
      const versionDoc = await db
        .collection('users')
        .doc(uid)
        .collection('profile_versions')
        .doc(versionNumber.toString())
        .get();

      if (!versionDoc.exists) {
        throw new Error(`Profile version ${versionNumber} does not exist for this user.`);
      }

      const versionData = versionDoc.data();
      if (!versionData || !versionData.profileData) {
        throw new Error(`Profile data is corrupted or missing for version ${versionNumber}.`);
      }

      const rolledProfile = versionData.profileData as UnifiedCareerProfile;

      // Increment version number on rollback to keep history linear
      const docRef = db.collection('users').doc(uid);
      const userSnap = await docRef.get();
      const userData = userSnap.data();
      const currentVersion = userData?.unifiedProfile?.profileVersion ?? 0;
      const nextVersion = currentVersion + 1;

      const newActiveProfile: UnifiedCareerProfile = {
        ...rolledProfile,
        profileVersion: nextVersion,
        metadata: {
          ...rolledProfile.metadata,
          timestamp: new Date().toISOString(),
        },
      };

      // Set active profile
      await docRef.set({ unifiedProfile: newActiveProfile }, { merge: true });

      // Save version log entry
      const crypto = require('crypto');
      const profileHash = crypto
        .createHash('md5')
        .update(JSON.stringify(newActiveProfile))
        .digest('hex');

      const entry: ProfileVersionEntry = {
        versionNumber: nextVersion,
        uploadTime: new Date().toISOString(),
        fileHash: newActiveProfile.resumeId || 'rollback',
        profileHash,
        changedFields: [`Rolled back to version ${versionNumber}`],
        addedSkills: [],
        removedSkills: [],
        updatedExperience: [],
        completenessScoreDifference: 0,
      };

      await this.saveVersionEntry(uid, entry, newActiveProfile);

      logger.info(`[ProfileVersionManager] Successfully rolled back user ${uid} to version ${versionNumber}`);
      return newActiveProfile;
    } catch (error) {
      logger.error(`[ProfileVersionManager] Rollback failed for user ${uid} to version ${versionNumber}:`, error);
      throw error;
    }
  }
}

export const profileVersionManager = new ProfileVersionManager();
