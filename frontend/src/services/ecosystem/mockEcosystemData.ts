import type { Organization, HiringJob, JobApplication, MentorshipSession, CandidateRankInsight } from './types';

export const MOCK_ORGANIZATIONS: Organization[] = [
  { id: 'org_iitb', name: 'Indian Institute of Technology, Bombay', type: 'university', domain: 'iitb.ac.in', departments: ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering'] },
  { id: 'org_bits', name: 'BITS Pilani', type: 'university', domain: 'bits-pilani.ac.in', departments: ['Computer Science', 'Information Systems', 'Electronics'] },
  { id: 'org_google', name: 'Google India', type: 'company', domain: 'google.com', departments: ['Engineering', 'Product', 'Research'] },
  { id: 'org_razorpay', name: 'Razorpay', type: 'company', domain: 'razorpay.com', departments: ['Engineering', 'Design', 'QA'] }
];

export interface CandidateMockProfile {
  id: string;
  name: string;
  email: string;
  organizationId: string;
  department: string;
  batch: string;
  semester: string;
  readinessScore: number;
  githubScore: number;
  dsaScore: number;
  projectScore: number;
  skills: string[];
  missingSkills: string[];
  targetRole: string;
}

export const MOCK_CANDIDATES: CandidateMockProfile[] = [
  {
    id: 'student_1',
    name: 'Amit Sharma',
    email: 'amit.sharma@iitb.ac.in',
    organizationId: 'org_iitb',
    department: 'Computer Science',
    batch: '2027',
    semester: '6th Semester',
    readinessScore: 88,
    githubScore: 90,
    dsaScore: 85,
    projectScore: 90,
    skills: ['React', 'NodeJS', 'TypeScript', 'Docker', 'MongoDB'],
    missingSkills: ['System Design', 'Redis'],
    targetRole: 'Backend Engineer'
  },
  {
    id: 'student_2',
    name: 'Priya Patel',
    email: 'priya.patel@iitb.ac.in',
    organizationId: 'org_iitb',
    department: 'Computer Science',
    batch: '2027',
    semester: '6th Semester',
    readinessScore: 72,
    githubScore: 65,
    dsaScore: 80,
    projectScore: 70,
    skills: ['Python', 'Django', 'PostgreSQL', 'HTML', 'CSS'],
    missingSkills: ['Docker', 'AWS'],
    targetRole: 'Fullstack Developer'
  },
  {
    id: 'student_3',
    name: 'Rohan Verma',
    email: 'rohan.verma@bits-pilani.ac.in',
    organizationId: 'org_bits',
    department: 'Information Systems',
    batch: '2026',
    semester: '8th Semester',
    readinessScore: 92,
    githubScore: 95,
    dsaScore: 90,
    projectScore: 92,
    skills: ['React', 'TypeScript', 'Docker', 'Kubernetes', 'AWS', 'Redis', 'NodeJS'],
    missingSkills: ['GoLang'],
    targetRole: 'Backend Engineer'
  },
  {
    id: 'student_4',
    name: 'Ananya Iyer',
    email: 'ananya.iyer@bits-pilani.ac.in',
    organizationId: 'org_bits',
    department: 'Electronics',
    batch: '2027',
    semester: '6th Semester',
    readinessScore: 64,
    githubScore: 50,
    dsaScore: 70,
    projectScore: 60,
    skills: ['Python', 'C++', 'Data Structures', 'Git'],
    missingSkills: ['React', 'NodeJS', 'SQL'],
    targetRole: 'Software Engineer'
  }
];

export const MOCK_JOBS: HiringJob[] = [
  {
    id: 'job_google_1',
    companyId: 'org_google',
    companyName: 'Google India',
    title: 'Software Engineering Intern',
    type: 'internship',
    description: 'Join the Google engineering team to design and build large-scale cloud backend services.',
    requirements: ['React', 'TypeScript', 'NodeJS', 'Data Structures'],
    salary: '₹80,000 / month',
    location: 'Bangalore (Hybrid)',
    status: 'active',
    applicantsCount: 15,
    createdAt: new Date().toISOString()
  },
  {
    id: 'job_razorpay_1',
    companyId: 'org_razorpay',
    companyName: 'Razorpay',
    title: 'Associate Backend Engineer',
    type: 'full-time',
    description: 'Responsible for building API gateways, financial transaction pipelines, and cache optimizations.',
    requirements: ['NodeJS', 'Docker', 'Redis', 'MongoDB'],
    salary: '₹12,00,000 / year',
    location: 'Mumbai (Remote)',
    status: 'active',
    applicantsCount: 8,
    createdAt: new Date().toISOString()
  }
];

export const MOCK_MENTORS = [
  { id: 'mentor_1', name: 'Vikram Seth', email: 'vikram.seth@mentor.com', specialty: ['Backend Design', 'Docker', 'System Scalability'], experienceYears: 8, rating: 4.9, slotsCount: 5 },
  { id: 'mentor_2', name: 'Sanjana Sen', email: 'sanjana.sen@mentor.com', specialty: ['Frontend React', 'UI Design', 'Typescript'], experienceYears: 5, rating: 4.7, slotsCount: 3 }
];

export const MOCK_APPLICATIONS: JobApplication[] = [
  { id: 'app_1', jobId: 'job_razorpay_1', jobTitle: 'Associate Backend Engineer', companyName: 'Razorpay', studentId: 'student_1', studentName: 'Amit Sharma', studentEmail: 'amit.sharma@iitb.ac.in', readinessScore: 88, status: 'interviewing', appliedAt: new Date().toISOString() }
];

export const MOCK_SESSIONS: MentorshipSession[] = [
  { id: 'sess_1', mentorId: 'mentor_1', mentorName: 'Vikram Seth', menteeId: 'student_1', menteeName: 'Amit Sharma', scheduledAt: new Date(Date.now() + 86400000).toISOString(), topic: 'Redis caching keys setup review', status: 'scheduled', aiMentoringPlan: ['Review Redis fundamentals', 'Check key eviction limits', 'Design local test benchmark'] }
];
