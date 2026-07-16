import { z } from 'zod';

export const metadataFieldSchema = z.object({
  source: z.enum(['resume', 'github', 'leetcode', 'codeforces', 'linkedin', 'user_manual']),
  confidence: z.number().min(0.0).max(1.0),
  lastUpdated: z.string(),
  verified: z.boolean(),
});

export const profileItemSchema = <T extends z.ZodTypeAny>(valueSchema: T) =>
  z.object({
    value: valueSchema,
    meta: metadataFieldSchema,
  });

export const personalInfoSchema = z.object({
  fullName: profileItemSchema(z.string().min(1, 'Name is required')),
  email: profileItemSchema(z.string().email('Invalid email')),
  location: profileItemSchema(z.string().default('')),
  bio: profileItemSchema(z.string().default('')),
  avatarUrl: profileItemSchema(z.string().url().or(z.string().max(0)).default('')),
});

export const educationEntrySchema = z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  stream: z.string().min(1),
  graduationYear: z.number().int().optional(),
  grade: z.string().optional(),
  meta: metadataFieldSchema,
});

export const projectEntrySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  technologies: z.array(z.string()),
  githubUrl: z.string().url().optional().or(z.string().max(0)),
  meta: metadataFieldSchema,
});

export const experienceEntrySchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  duration: z.string().min(1),
  description: z.string().optional(),
  meta: metadataFieldSchema,
});

export const careerGoalsSchema = z.object({
  preferredRoles: profileItemSchema(z.array(z.string())),
  preferredIndustries: profileItemSchema(z.array(z.string())),
  preferredLocations: profileItemSchema(z.array(z.string())),
  expectedSalary: profileItemSchema(z.string()).optional(),
  semester: profileItemSchema(z.string()).optional(),
});

export const skillNodeSchema = z.object({
  name: z.string(),
  confidence: z.number().min(0).max(100),
  source: z.array(z.string()),
  lastUpdated: z.string(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
});

export const platformConnectionSchema = z.object({
  platformId: z.enum(['github', 'leetcode', 'codeforces', 'linkedin']),
  handle: z.string(),
  connectedAt: z.string(),
  lastSyncAt: z.string().nullable(),
  status: z.enum(['connected', 'error', 'idle']),
});

export const careerHealthMetricSchema = z.object({
  overallScore: z.number().min(0).max(100),
  breakdown: z.object({
    technicalSkills: z.number().min(0).max(100),
    projectsQuality: z.number().min(0).max(100),
    learningBreadth: z.number().min(0).max(100),
    interviewReadiness: z.number().min(0).max(100),
    resumeQuality: z.number().min(0).max(100),
    portfolioGlow: z.number().min(0).max(100),
    openSourceContrib: z.number().min(0).max(100),
    applicationRates: z.number().min(0).max(100),
  }),
});

export const unifiedUserProfileSchema = z.object({
  uid: z.string(),
  personalInfo: personalInfoSchema,
  education: z.array(educationEntrySchema),
  skills: z.array(skillNodeSchema),
  projects: z.array(projectEntrySchema),
  experience: z.array(experienceEntrySchema),
  careerGoals: careerGoalsSchema,
  certifications: profileItemSchema(z.array(z.string())),
  achievements: profileItemSchema(z.array(z.string())),
  connections: z.array(platformConnectionSchema),
  profileCompleteness: z.object({
    overall: z.number().min(0).max(100),
    critical: z.number().min(0).max(100),
    career: z.number().min(0).max(100),
    technical: z.number().min(0).max(100),
  }),
  careerScore: z.number().min(0).max(100),
  careerHealth: careerHealthMetricSchema.optional(),
  skillGraph: z.any().nullable().optional(),
  aiMemory: z.record(z.any()),
  lastSyncAt: z.string(),
  createdAt: z.string(),
});
