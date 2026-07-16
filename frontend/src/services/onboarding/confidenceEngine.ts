import { UnifiedUserProfile, UnifiedProfileFieldMetadata } from './profileMemory';

export const CONFIDENCE_THRESHOLDS = {
  USER_CONFIRMED: 1.0,
  EXTERNAL_SYNC: 0.95,
  AI_EXTRACTED_HIGH: 0.90,
  AI_EXTRACTED_MEDIUM: 0.75,
  AI_EXTRACTED_LOW: 0.60,
};

export const confidenceEngine = {
  /**
   * Generates confidence metadata for a specific field name.
   */
  createMetadata(source: 'user' | 'github' | 'leetcode' | 'codeforces' | 'resume' | string, confidence?: number): UnifiedProfileFieldMetadata {
    let finalConfidence = confidence ?? CONFIDENCE_THRESHOLDS.AI_EXTRACTED_MEDIUM;

    if (source === 'user') {
      finalConfidence = CONFIDENCE_THRESHOLDS.USER_CONFIRMED;
    } else if (['github', 'leetcode', 'codeforces'].includes(source)) {
      finalConfidence = CONFIDENCE_THRESHOLDS.EXTERNAL_SYNC;
    }

    return {
      source,
      confidence: finalConfidence,
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Audits the profile's confidence levels and returns fields that are below the acceptable threshold.
   * @param profile The UnifiedUserProfile to audit
   * @param threshold The confidence threshold (defaults to 0.80)
   * @returns List of field names that fall below the threshold and require user validation.
   */
  getLowConfidenceFields(profile: UnifiedUserProfile, threshold = 0.80): string[] {
    const lowConfidenceFields: string[] = [];
    const meta = profile.confidenceMetadata || {};

    // Audit personalInfo fields
    const personalFields = ['fullName', 'email', 'githubUrl', 'linkedinUrl', 'location'];
    for (const field of personalFields) {
      const val = (profile.personalInfo as any)[field];
      if (val) {
        const fieldMeta = meta[`personalInfo.${field}`];
        if (fieldMeta && fieldMeta.confidence < threshold) {
          lowConfidenceFields.push(`personalInfo.${field}`);
        }
      }
    }

    // Audit education
    if (profile.education && profile.education.length > 0) {
      const eduMeta = meta['education'];
      if (eduMeta && eduMeta.confidence < threshold) {
        lowConfidenceFields.push('education');
      }
    }

    // Audit careerGoals fields
    const goalFields = ['preferredRoles', 'preferredIndustries', 'preferredLocations'];
    for (const field of goalFields) {
      const val = (profile.careerGoals as any)[field];
      if (val && val.length > 0) {
        const fieldMeta = meta[`careerGoals.${field}`];
        if (fieldMeta && fieldMeta.confidence < threshold) {
          lowConfidenceFields.push(`careerGoals.${field}`);
        }
      }
    }

    return lowConfidenceFields;
  }
};
