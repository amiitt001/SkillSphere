import { db } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import type { MarketplacePlugin } from './types';

export const MARKETPLACE_CATALOG: MarketplacePlugin[] = [
  { id: 'plug_res_helper', name: 'ATS Resume Helper Pro', description: 'Deep analyses of resume structures, suggesting vocabulary enhancements.', category: 'resume', version: '1.2.0', author: 'SkillSphere team', downloads: 1420, rating: 4.8, installed: false },
  { id: 'plug_prompt_pack', name: 'Gemini Prompt Pack: DSA', description: 'Advanced templates to practice complex dynamic algorithms.', category: 'prompts', version: '1.0.0', author: 'Algorithmic Guru', downloads: 820, rating: 4.6, installed: false },
  { id: 'plug_hack_sandbox', name: 'Hackathon Practice Sandbox', description: 'Simulates hackathon timed schedules and compiles code submissions.', category: 'assessments', version: '2.1.0', author: 'HackTech inc', downloads: 2100, rating: 4.9, installed: false },
  { id: 'plug_aws_assessor', name: 'AWS Practice Assessors Exam', description: 'Mock exams matching Cloud Practitioner VPC networks challenges.', category: 'learning', version: '1.1.0', author: 'Cloud Academics', downloads: 540, rating: 4.5, installed: false }
];

/**
 * Returns marketplace extensions and their active installation statuses.
 */
export async function getMarketplacePlugins(uid: string): Promise<MarketplacePlugin[]> {
  try {
    const installsSnap = await getDocs(collection(db, 'users', uid, 'installed_plugins'));
    const installedIds = installsSnap.docs.map(doc => doc.id);

    return MARKETPLACE_CATALOG.map(plugin => ({
      ...plugin,
      installed: installedIds.includes(plugin.id)
    }));
  } catch (error) {
    console.error('[Marketplace Engine] Error listing plugins:', error);
    return MARKETPLACE_CATALOG;
  }
}

/**
 * Installs or uninstalls a marketplace plugin extension for the user.
 */
export async function togglePluginInstallation(
  uid: string,
  pluginId: string,
  install: boolean
): Promise<MarketplacePlugin[]> {
  try {
    const installRef = doc(db, 'users', uid, 'installed_plugins', pluginId);
    if (install) {
      await setDoc(installRef, { installed: true, installedAt: new Date().toISOString() });
    } else {
      await deleteDoc(installRef);
    }
  } catch (error) {
    console.error('[Marketplace Engine] Error toggling plugin link:', error);
  }
  return getMarketplacePlugins(uid);
}
