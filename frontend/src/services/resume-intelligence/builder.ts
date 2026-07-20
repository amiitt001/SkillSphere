/**
 * Resume Intelligence — Pipeline Orchestrator
 *
 * Combines all modular stages (Parse -> OCR -> Extract -> Normalize -> Validate -> Enrich -> Completeness -> Version)
 * into a single unified execution flow.
 */

import { resumeParser } from './parser';
import { resumeOCR } from './ocr';
import { resumeExtractor } from './extractor';
import { resumeNormalizer } from './normalizer';
import { resumeValidator } from './validator';
import { resumeEnricher } from './enricher';
import { profileCompleteness } from './completeness';
import { profileVersionManager } from './versionManager';
import { profileService } from '@/services/profile/profileService';
import { logger } from '@/services/logger';
import crypto from 'crypto';
import type {
  UnifiedCareerProfile,
  ProfileVersionEntry,
} from './types';

export class ResumeIntelligenceBuilder {
  /**
   * Processes a raw resume file buffer and returns a rich draft UnifiedCareerProfile.
   *
   * Target execution latency: < 2 seconds for parsing, < 3 seconds total.
   */
  async processUpload(
    buffer: Buffer,
    mimeType: string,
    filename: string,
    uid: string
  ): Promise<{ draft: UnifiedCareerProfile; rawText: string; isScanned: boolean }> {
    const startTime = Date.now();

    // 1. File Parsing & Text Extraction
    const parsedFile = await resumeParser.extractText(buffer, mimeType, filename);
    let extractedText = parsedFile.text;

    // 2. OCR Fallback (if scanned)
    if (parsedFile.isScanned) {
      logger.info(`[ResumeIntelligenceBuilder] Scanned PDF detected for ${filename}. Running multimodal OCR...`);
      extractedText = await resumeOCR.extractTextFromScanned(buffer, mimeType);
    }

    if (!extractedText.trim()) {
      throw new Error('Could not extract any readable content from the document.');
    }

    // 3. Entity Extraction (LLM-based parsing)
    logger.info(`[ResumeIntelligenceBuilder] Extracting entities for user: ${uid}`);
    const rawEntities = await resumeExtractor.extractEntities(extractedText);

    // Apply defaults and confidence ratings
    const conf = rawEntities.confidenceScores || {};
    const wrapSource = 'resume';

    const rawContact = resumeExtractor.wrapContact(rawEntities.contact || {}, conf.contact ?? 0.85, wrapSource);
    const rawEducation = resumeExtractor.wrapEducation(rawEntities.education || [], conf.education ?? 0.85, wrapSource);
    const rawExperience = resumeExtractor.wrapExperience(rawEntities.experience || [], conf.experience ?? 0.85, wrapSource);
    const rawProjects = resumeExtractor.wrapProjects(rawEntities.projects || [], conf.projects ?? 0.85, wrapSource);
    const rawSkills = resumeExtractor.wrapSkills(rawEntities.skills || {}, conf.skills ?? 0.85, wrapSource);
    const rawCertifications = resumeExtractor.wrapCertifications(rawEntities.certifications || [], conf.certifications ?? 0.85, wrapSource);
    const rawAchievements = resumeExtractor.wrapAchievements(rawEntities.achievements || {}, conf.achievements ?? 0.85, wrapSource);
    const rawSummary = resumeExtractor.wrapField(rawEntities.summary || '', conf.summary ?? 0.85, wrapSource);

    // 4. Normalization
    const normalized = resumeNormalizer.normalizeProfileData(
      rawContact,
      rawEducation,
      rawExperience,
      rawProjects,
      rawSkills,
      rawCertifications,
      rawAchievements
    );

    // 5. Validation
    const validationReport = resumeValidator.validate({
      resumeId: parsedFile.fileHash,
      uid,
      profileVersion: 1,
      profileHash: '',
      contact: normalized.contact,
      education: normalized.education,
      experience: normalized.experience,
      projects: normalized.projects,
      skills: normalized.skills,
      certifications: normalized.certifications,
      achievements: normalized.achievements,
      summary: rawSummary,
      metadata: { parseTimeMs: 0, timestamp: '', version: '' },
    });

    // 6. Profile Enrichment
    const enriched = resumeEnricher.enrich(
      normalized.contact,
      normalized.education,
      normalized.experience,
      normalized.projects,
      normalized.skills,
      normalized.certifications,
      normalized.achievements
    );

    // 7. Profile Completeness
    const completeness = profileCompleteness.calculate(
      normalized.contact,
      normalized.education,
      normalized.experience,
      normalized.projects,
      normalized.skills,
      normalized.certifications,
      normalized.achievements,
      rawSummary
    );

    // 8. Construct Final Structured Unified Career Profile
    const parseTimeMs = Date.now() - startTime;

    const draftProfile: UnifiedCareerProfile = {
      resumeId: parsedFile.fileHash,
      uid,
      profileVersion: 1, // Will be set correctly when committed to Firestore
      profileHash: '',   // Generated at commit time
      contact: normalized.contact,
      education: normalized.education,
      experience: normalized.experience,
      projects: normalized.projects,
      skills: normalized.skills,
      certifications: normalized.certifications,
      achievements: normalized.achievements,
      summary: rawSummary,
      careerProfile: enriched,
      completeness,
      validation: validationReport,
      metadata: {
        parseTimeMs,
        timestamp: new Date().toISOString(),
        version: '2.0.0',
      },
    };

    return {
      draft: draftProfile,
      rawText: extractedText,
      isScanned: parsedFile.isScanned,
    };
  }

  /**
   * Commits the approved draft profile into Firestore, increments the version count,
   * stores a historic version, and compiles a comparison diff log.
   * Maps legacy fields at the top level for backwards compatibility.
   */
  async commitApprovedProfile(uid: string, draft: UnifiedCareerProfile): Promise<UnifiedCareerProfile> {
    try {
      logger.info(`[ResumeIntelligenceBuilder] Committing profile updates for user ${uid}`);

      // 1. Get existing active profile to calculate version differences
      const existingProfile = (await profileService.getUnifiedProfile(uid)) as unknown as UnifiedCareerProfile | null;

      const currentVersion = existingProfile?.profileVersion ?? 0;
      const nextVersion = currentVersion + 1;

      // 2. Prepare final profile with incremented version
      const finalProfile: UnifiedCareerProfile = {
        ...draft,
        profileVersion: nextVersion,
        uid,
        metadata: {
          ...draft.metadata,
          timestamp: new Date().toISOString(),
        },
      };

      // Generate hash of current profile state
      const profileHash = crypto
        .createHash('md5')
        .update(JSON.stringify(finalProfile))
        .digest('hex');

      finalProfile.profileHash = profileHash;

      // 3. Compute Diffs against previous version
      const diffMetrics = profileVersionManager.buildDiffLog(
        existingProfile,
        finalProfile,
        finalProfile.completeness.overallScore
      );

      const versionEntry: ProfileVersionEntry = {
        versionNumber: nextVersion,
        uploadTime: new Date().toISOString(),
        fileHash: finalProfile.resumeId,
        profileHash,
        ...diffMetrics,
      };

      // 4. Attach legacy flat properties for full backwards-compatibility with downstream modules
      const legacyProfile = {
        ...finalProfile,
        personalInfo: {
          fullName: finalProfile.contact.fullName.value,
          email: finalProfile.contact.email.value,
          githubUrl: finalProfile.contact.github.value || null,
          linkedinUrl: finalProfile.contact.linkedin.value || null,
          location: finalProfile.contact.city.value ? `${finalProfile.contact.city.value}, ${finalProfile.contact.country.value}` : null,
        },
        skills: Object.values(finalProfile.skills).flat().map((s) => s.value),
        education: finalProfile.education.map((e) => ({
          institution: e.institution.value,
          degree: e.degree.value,
          graduationYear: e.passingYear.value || null,
          stream: e.branch.value || null,
        })),
        projects: finalProfile.projects.map((p) => ({
          title: p.projectName.value,
          description: p.description.value,
          technologies: p.technologyStack.value,
        })),
        experience: finalProfile.experience.map((e) => ({
          company: e.company.value,
          role: e.role.value,
          duration: `${e.startDate.value} - ${e.endDate.value}`,
          description: e.responsibilities.value.join('\n'),
        })),
      };

      // 5. Save active profile in Firestore (users/{uid} document)
      await profileService.saveUnifiedProfile(uid, legacyProfile as any);

      // 6. Store version history log
      await profileVersionManager.saveVersionEntry(uid, versionEntry, finalProfile);

      logger.info(`[ResumeIntelligenceBuilder] Committed version ${nextVersion} for ${uid}`);
      return finalProfile;
    } catch (error) {
      logger.error(`[ResumeIntelligenceBuilder] Failed to commit approved profile for ${uid}:`, error);
      throw error;
    }
  }

  /**
   * Helper to map a UnifiedCareerProfile back into a legacy onboarding ParsedResumeDraft.
   */
  mapToDraft(profile: UnifiedCareerProfile): any {
    return {
      personalInfo: {
        fullName: profile.contact.fullName.value,
        email: profile.contact.email.value,
        githubUrl: profile.contact.github.value || undefined,
        linkedinUrl: profile.contact.linkedin.value || undefined,
        location: profile.contact.city.value ? `${profile.contact.city.value}, ${profile.contact.country.value}` : undefined,
      },
      education: profile.education.map((e) => ({
        institution: e.institution.value,
        degree: e.degree.value,
        graduationYear: e.passingYear.value || undefined,
        stream: e.branch.value || undefined,
      })),
      skills: Object.values(profile.skills).flat().map((s) => s.value),
      certifications: profile.certifications.map((c) => c.certificateName.value),
      projects: profile.projects.map((p) => ({
        title: p.projectName.value,
        description: p.description.value,
        technologies: p.technologyStack.value,
      })),
      experience: profile.experience.map((e) => ({
        company: e.company.value,
        role: e.role.value,
        duration: `${e.startDate.value} - ${e.endDate.value}`,
        description: e.responsibilities.value.join('\n'),
      })),
      confidenceScores: {
        'personalInfo.fullName': profile.contact.fullName.confidence,
        'personalInfo.email': profile.contact.email.confidence,
        'skills': 0.90,
        'education': 0.90,
        'projects': 0.90,
        'experience': 0.90,
      },
    };
  }

  /**
   * Builds the rich UnifiedCareerProfile from a user-edited/approved ParsedResumeDraft.
   */
  async buildProfileFromDraft(uid: string, draft: any, existingResumeId = 'user_approved'): Promise<UnifiedCareerProfile> {
    const wrap = (val: string, score = 1.0) => ({ value: val, confidence: score, source: 'user', validationStatus: 'valid' as const });
    
    // Map contact
    const rawContact = {
      fullName: wrap(draft.personalInfo?.fullName || ''),
      email: wrap(draft.personalInfo?.email || ''),
      phone: wrap(''),
      country: wrap(''),
      city: wrap(draft.personalInfo?.location || ''),
      linkedin: wrap(draft.personalInfo?.linkedinUrl || ''),
      github: wrap(draft.personalInfo?.githubUrl || ''),
      portfolio: wrap(''),
      website: wrap(''),
      leetcode: wrap(''),
      codeforces: wrap(''),
      hackerrank: wrap(''),
      geeksforgeeks: wrap(''),
      kaggle: wrap(''),
      behance: wrap(''),
      dribbble: wrap(''),
      stackoverflow: wrap(''),
    };

    // Map education
    const rawEducation = (draft.education || []).map((e: any) => ({
      institution: wrap(e.institution || ''),
      degree: wrap(e.degree || ''),
      branch: wrap(e.stream || ''),
      specialization: wrap(''),
      university: wrap(''),
      college: wrap(''),
      cgpa: wrap(''),
      percentage: wrap(''),
      passingYear: { value: e.graduationYear ?? null, confidence: 1.0, source: 'user', validationStatus: 'valid' as const },
      currentStatus: wrap('completed'),
    }));

    // Map experience
    const rawExperience = (draft.experience || []).map((e: any) => {
      let dates = (e.duration || '').split(/\s+-\s+|\s+to\s+/).map((d: string) => d.trim());
      if (dates.length < 2 && (e.duration || '').includes('-')) {
        const parts = (e.duration || '').split('-');
        if (parts.length === 2) {
          dates = parts.map((d: string) => d.trim());
        } else if (parts.length === 4) {
          dates = [`${parts[0]}-${parts[1]}`, `${parts[2]}-${parts[3]}`];
        }
      }
      const startDate = dates[0] || '2020-01';
      const endDate = dates[1] || 'Present';
      return {
        company: wrap(e.company || ''),
        role: wrap(e.role || ''),
        employmentType: wrap('Full-time'),
        location: wrap(''),
        startDate: wrap(startDate),
        endDate: wrap(endDate),
        currentJob: { value: /present/i.test(endDate), confidence: 1.0, source: 'user', validationStatus: 'valid' as const },
        responsibilities: { value: (e.description || '').split('\n').filter(Boolean), confidence: 1.0, source: 'user', validationStatus: 'valid' as const },
        achievements: { value: [], confidence: 1.0, source: 'user', validationStatus: 'valid' as const },
        technologiesUsed: { value: [], confidence: 1.0, source: 'user', validationStatus: 'valid' as const },
        leadership: { value: false, confidence: 1.0, source: 'user', validationStatus: 'valid' as const },
        teamSize: { value: null, confidence: 1.0, source: 'user', validationStatus: 'valid' as const },
      };
    });

    // Map projects
    const rawProjects = (draft.projects || []).map((p: any) => ({
      projectName: wrap(p.title || ''),
      description: wrap(p.description || ''),
      technologyStack: { value: p.technologies || [], confidence: 1.0, source: 'user', validationStatus: 'valid' as const },
      github: wrap(''),
      liveDemo: wrap(''),
      deployment: wrap(''),
      businessProblem: wrap(''),
      features: { value: [], confidence: 1.0, source: 'user', validationStatus: 'valid' as const },
      role: wrap(''),
      duration: wrap(''),
      impact: wrap(''),
      awards: { value: [], confidence: 1.0, source: 'user', validationStatus: 'valid' as const },
    }));

    // Categorize skills
    const rawSkills = this.classifySkills(draft.skills || []);

    // Map certifications
    const rawCertifications = (draft.certifications || []).map((c: string) => ({
      certificateName: wrap(c),
      provider: wrap(''),
      completionDate: wrap(''),
      credentialId: wrap(''),
      credentialUrl: wrap(''),
      expiry: wrap(''),
      verification: { value: false, confidence: 1.0, source: 'user', validationStatus: 'valid' as const },
    }));

    // Map achievements
    const rawAchievements = {
      hackathons: [],
      awards: [],
      research: [],
      publications: [],
      leadership: [],
      competitiveProgramming: [],
      openSource: [],
      scholarships: [],
    };

    const rawSummary = wrap('');

    // 4. Normalization
    const normalized = resumeNormalizer.normalizeProfileData(
      rawContact,
      rawEducation,
      rawExperience,
      rawProjects,
      rawSkills,
      rawCertifications,
      rawAchievements
    );

    // 5. Validation
    const validationReport = resumeValidator.validate({
      resumeId: existingResumeId,
      uid,
      profileVersion: 1,
      profileHash: '',
      contact: normalized.contact,
      education: normalized.education,
      experience: normalized.experience,
      projects: normalized.projects,
      skills: normalized.skills,
      certifications: normalized.certifications,
      achievements: normalized.achievements,
      summary: rawSummary,
      metadata: { parseTimeMs: 0, timestamp: '', version: '' },
    });

    // 6. Profile Enrichment
    const enriched = resumeEnricher.enrich(
      normalized.contact,
      normalized.education,
      normalized.experience,
      normalized.projects,
      normalized.skills,
      normalized.certifications,
      normalized.achievements
    );

    // 7. Profile Completeness
    const completeness = profileCompleteness.calculate(
      normalized.contact,
      normalized.education,
      normalized.experience,
      normalized.projects,
      normalized.skills,
      normalized.certifications,
      normalized.achievements,
      rawSummary
    );

    return {
      resumeId: existingResumeId,
      uid,
      profileVersion: 1,
      profileHash: '',
      contact: normalized.contact,
      education: normalized.education,
      experience: normalized.experience,
      projects: normalized.projects,
      skills: normalized.skills,
      certifications: normalized.certifications,
      achievements: normalized.achievements,
      summary: rawSummary,
      careerProfile: enriched,
      completeness,
      validation: validationReport,
      metadata: {
        parseTimeMs: 0,
        timestamp: new Date().toISOString(),
        version: '2.0.0',
      },
    };
  }

  private classifySkills(skills: string[]): any {
    const categories: any = {
      programmingLanguages: [], frameworks: [], libraries: [], cloud: [], devops: [],
      testing: [], ai: [], ml: [], dataScience: [], security: [], databases: [],
      operatingSystems: [], tools: [], softSkills: []
    };
    
    const wrap = (val: string) => ({ value: val, confidence: 1.0, source: 'user', validationStatus: 'valid' as const });
    
    for (const skill of skills) {
      const lower = skill.toLowerCase();
      if (['javascript', 'typescript', 'python', 'go', 'rust', 'c++', 'java', 'c#', 'php', 'ruby', 'sql', 'bash', 'r'].includes(lower)) {
        categories.programmingLanguages.push(wrap(skill));
      } else if (['react', 'next.js', 'vue.js', 'angular', 'svelte', 'django', 'flask', 'fastapi', 'spring', 'laravel'].includes(lower)) {
        categories.frameworks.push(wrap(skill));
      } else if (['redux', 'tailwind css', 'bootstrap', 'jquery', 'pandas', 'numpy', 'scikit-learn', 'lodash', 'rxjs'].includes(lower)) {
        categories.libraries.push(wrap(skill));
      } else if (['aws', 'gcp', 'azure', 'heroku', 'vercel', 'netlify', 'digitalocean'].includes(lower)) {
        categories.cloud.push(wrap(skill));
      } else if (['docker', 'kubernetes', 'terraform', 'jenkins', 'github actions', 'gitlab ci', 'ansible', 'helm'].includes(lower)) {
        categories.devops.push(wrap(skill));
      } else if (['jest', 'playwright', 'cypress', 'selenium', 'mocha', 'chai', 'vitest'].includes(lower)) {
        categories.testing.push(wrap(skill));
      } else if (['mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'sqlite', 'oracle', 'cassandra', 'dynamodb'].includes(lower)) {
        categories.databases.push(wrap(skill));
      } else if (['communication', 'leadership', 'teamwork', 'problem solving', 'agile', 'scrum'].includes(lower)) {
        categories.softSkills.push(wrap(skill));
      } else {
        categories.tools.push(wrap(skill));
      }
    }
    return categories;
  }
}

export const resumeIntelligenceBuilder = new ResumeIntelligenceBuilder();
