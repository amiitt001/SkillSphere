export type UserRole =
  | 'Student'
  | 'Recruiter'
  | 'Mentor'
  | 'Faculty'
  | 'PlacementOfficer'
  | 'UniversityAdmin'
  | 'CompanyAdmin'
  | 'SuperAdmin';

export interface Organization {
  id: string;
  name: string;
  type: 'university' | 'company';
  domain: string;
  departments: string[];
}

export interface RecruiterProfile {
  companyName: string;
  website: string;
  industry: string;
  campaignsActive: number;
}

export interface MentorProfile {
  specialty: string[];
  experienceYears: number;
  rating: number;
  availableDays: string[];
  slotsCount: number;
}

export interface HiringJob {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  type: 'full-time' | 'internship';
  description: string;
  requirements: string[];
  salary: string;
  location: string;
  status: 'active' | 'closed';
  applicantsCount: number;
  createdAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  readinessScore: number;
  status: 'applied' | 'interviewing' | 'offered' | 'rejected';
  appliedAt: string;
}

export interface MentorshipSession {
  id: string;
  mentorId: string;
  mentorName: string;
  menteeId: string;
  menteeName: string;
  scheduledAt: string;
  topic: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  aiMentoringPlan: string[];
}

export interface EcosystemAuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  targetId: string;
  timestamp: string;
}

export interface CandidateRankInsight {
  candidateId: string;
  name: string;
  email: string;
  readinessScore: number;
  rankScore: number;
  justification: string;
  missingSkills: string[];
  confidence: 'high' | 'medium' | 'low';
  interviewTips: string[];
}
