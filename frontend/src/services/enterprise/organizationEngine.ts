import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { OrganizationDetails } from './types';

const DEFAULT_ORG: OrganizationDetails = {
  id: 'org_default',
  name: 'Orion Placement Cell',
  plan: 'university',
  seatsCapacity: 50,
  seatsUsed: 14,
  departments: ['Computer Science Engineering', 'Electronics & Communications']
};

/**
 * Loads organization details from Firestore. Seeds default if empty.
 */
export async function getOrganization(orgId: string): Promise<OrganizationDetails> {
  try {
    const orgRef = doc(db, 'organizations', orgId);
    const snap = await getDoc(orgRef);
    if (snap.exists()) {
      return snap.data() as OrganizationDetails;
    }
    // Seed default org
    await setDoc(orgRef, DEFAULT_ORG);
  } catch (error) {
    console.error('[Organization Engine] Error loading organization:', error);
  }
  return DEFAULT_ORG;
}

/**
 * Updates organization active seats count.
 */
export async function updateOrganizationSeats(orgId: string, seatsUsed: number): Promise<void> {
  try {
    const orgRef = doc(db, 'organizations', orgId);
    await setDoc(orgRef, { seatsUsed }, { merge: true });
  } catch (error) {
    console.error('[Organization Engine] Error updating seats:', error);
  }
}

/**
 * Registers a new academic or business department.
 */
export async function addOrganizationDepartment(orgId: string, dept: string): Promise<OrganizationDetails> {
  const current = await getOrganization(orgId);
  if (current.departments.includes(dept)) return current;

  const updated: OrganizationDetails = {
    ...current,
    departments: [...current.departments, dept]
  };

  try {
    await setDoc(doc(db, 'organizations', orgId), updated);
  } catch (error) {
    console.error('[Organization Engine] Error adding department:', error);
  }

  return updated;
}
