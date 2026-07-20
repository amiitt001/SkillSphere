/**
 * Resume Intelligence Platform — Public Facade
 *
 * Exposes core orchestrators, checkers, parsers, and Firestore version managers.
 */

export { resumeParser } from './parser';
export { resumeOCR } from './ocr';
export { resumeExtractor } from './extractor';
export { resumeNormalizer } from './normalizer';
export { resumeValidator } from './validator';
export { resumeEnricher } from './enricher';
export { profileCompleteness } from './completeness';
export { profileVersionManager } from './versionManager';
export { resumeIntelligenceBuilder } from './builder';

export type {
  ExtractedField,
  ParsedContactInfo,
  ParsedEducationEntry,
  ParsedExperienceEntry,
  ParsedProjectEntry,
  ParsedSkillsBlock,
  ParsedCertification,
  ParsedAchievementsBlock,
  CareerProfileEnrichment,
  ProfileCompletenessReport,
  ValidationIssue,
  ProfileValidationReport,
  ProfileVersionEntry,
  UnifiedCareerProfile,
} from './types';
