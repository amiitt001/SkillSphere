import type { UnifiedProfile, AIProfileAnalysis } from '@/types';
import type { 
  RecommendationFeed, 
  JobRecommendation, 
  InternshipRecommendation, 
  LearningRecommendation, 
  CertificationRecommendation, 
  ProjectRecommendation 
} from './types';
import { MOCK_JOBS, MOCK_INTERNSHIPS, MOCK_COURSES, MOCK_CERTIFICATIONS, MOCK_PROJECTS } from './data/mockCatalog';
import { recommendJobs } from './jobEngine';
import { recommendInternships } from './internshipEngine';
import { recommendCourses } from './learningEngine';
import { recommendCertifications } from './certificationEngine';
import { recommendProjects } from './projectRecommendationEngine';
import { checkJobEligibility, checkInternshipEligibility, checkGeneralEligibility } from './eligibilityEngine';
import { calculateRelevanceScores } from './rankingEngine';
import { generateRecommendationAlerts } from './notificationEngine';

export async function generateRecommendationFeed(
  profile: UnifiedProfile,
  aiAnalysis: AIProfileAnalysis | null,
  userYear: string = '3rd Year',
  bookmarks: string[] = [],
  appliedJobIds: Record<string, string> = {}, // maps opportunityId -> applicationStatus
  completedItemIds: string[] = [],
  ignoredIds: string[] = [],
  primaryCareerGoal?: string
): Promise<RecommendationFeed> {
  const userSkillCount = profile.skills.length;

  // 1. Process Jobs
  const rawJobs = recommendJobs(MOCK_JOBS, profile, aiAnalysis);
  const jobs: JobRecommendation[] = rawJobs
    .filter((j) => !ignoredIds.includes(j.id))
    .map((j) => {
      const eligibility = checkJobEligibility(j, j.missingSkills, profile);
      let relevanceBooster = 0;
      if (primaryCareerGoal && (
        j.title.toLowerCase().includes(primaryCareerGoal.toLowerCase()) || 
        j.skillsRequired.some((t: string) => t.toLowerCase().includes(primaryCareerGoal.toLowerCase())) ||
        j.description.toLowerCase().includes(primaryCareerGoal.toLowerCase())
      )) {
        relevanceBooster = 25;
      }
      const scores = calculateRelevanceScores({
        relevance: Math.min(100, j.matchPercentage + relevanceBooster),
        impact: eligibility.status === 'Eligible' ? 80 : eligibility.status === 'Nearly Eligible' ? 50 : 20,
        difficultyLevel: j.difficultyLevel,
        timeToComplete: 'Immediate',
        weights: { relevance: 0.4, impact: 0.3, difficulty: 0.3 }
      });
      return {
        ...j,
        scores: {
          ...scores,
          overall: Math.min(100, scores.overall + (relevanceBooster > 0 ? 15 : 0))
        },
        eligibility,
        isBookmarked: bookmarks.includes(j.id),
        applicationStatus: appliedJobIds[j.id] || undefined
      };
    })
    .sort((a, b) => b.scores.overall - a.scores.overall);

  // 2. Process Internships
  const rawInternships = recommendInternships(MOCK_INTERNSHIPS, profile, aiAnalysis);
  const internships: InternshipRecommendation[] = rawInternships
    .filter((i) => !ignoredIds.includes(i.id))
    .map((i) => {
      const eligibility = checkInternshipEligibility(i, i.missingSkills, userYear);
      let relevanceBooster = 0;
      if (primaryCareerGoal && (
        i.title.toLowerCase().includes(primaryCareerGoal.toLowerCase()) || 
        i.skillsRequired.some((t: string) => t.toLowerCase().includes(primaryCareerGoal.toLowerCase())) ||
        i.description.toLowerCase().includes(primaryCareerGoal.toLowerCase())
      )) {
        relevanceBooster = 25;
      }
      const scores = calculateRelevanceScores({
        relevance: Math.min(100, i.matchPercentage + relevanceBooster),
        impact: i.tier === 'Dream' ? 90 : i.tier === 'Stretch' ? 65 : 45,
        difficultyLevel: 'Entry',
        timeToComplete: i.duration,
        weights: { relevance: 0.4, impact: 0.3, difficulty: 0.3 }
      });
      return {
        ...i,
        scores: {
          ...scores,
          overall: Math.min(100, scores.overall + (relevanceBooster > 0 ? 15 : 0))
        },
        eligibility,
        isBookmarked: bookmarks.includes(i.id),
        applicationStatus: appliedJobIds[i.id] || undefined
      };
    })
    .sort((a, b) => b.scores.overall - a.scores.overall);

  // 3. Process Learning Courses
  const rawCourses = recommendCourses(MOCK_COURSES, profile, aiAnalysis);
  const learning: LearningRecommendation[] = rawCourses
    .filter((c) => !ignoredIds.includes(c.id))
    .map((c) => {
      const eligibility = checkGeneralEligibility(c.difficulty, userSkillCount);
      const impactScore = c.expectedImpact === 'Critical' ? 95 : c.expectedImpact === 'High' ? 80 : c.expectedImpact === 'Medium' ? 55 : 30;
      let relevanceBooster = 0;
      if (primaryCareerGoal && (
        c.title.toLowerCase().includes(primaryCareerGoal.toLowerCase()) ||
        c.description.toLowerCase().includes(primaryCareerGoal.toLowerCase()) ||
        c.skillsGained.some(s => s.toLowerCase().includes(primaryCareerGoal.toLowerCase()))
      )) {
        relevanceBooster = 25;
      }
      const scores = calculateRelevanceScores({
        relevance: Math.min(100, (c.skillsGained.some(s => !profile.skills.map(us => us.toLowerCase()).includes(s.toLowerCase())) ? 85 : 40) + relevanceBooster),
        impact: impactScore,
        difficultyLevel: c.difficulty,
        timeToComplete: c.duration,
        weights: { relevance: 0.5, impact: 0.3, difficulty: 0.2 }
      });
      return {
        ...c,
        scores: {
          ...scores,
          overall: Math.min(100, scores.overall + (relevanceBooster > 0 ? 15 : 0))
        },
        eligibility,
        isBookmarked: bookmarks.includes(c.id),
        isCompleted: completedItemIds.includes(c.id)
      };
    })
    .sort((a, b) => b.scores.overall - a.scores.overall);

  // 4. Process Certifications
  const rawCerts = recommendCertifications(MOCK_CERTIFICATIONS, profile, aiAnalysis);
  const certifications: CertificationRecommendation[] = rawCerts
    .filter((cert) => !ignoredIds.includes(cert.id))
    .map((cert) => {
      const eligibility = checkGeneralEligibility('Intermediate', userSkillCount);
      let relevanceBooster = 0;
      if (primaryCareerGoal && (
        cert.name.toLowerCase().includes(primaryCareerGoal.toLowerCase()) ||
        cert.provider.toLowerCase().includes(primaryCareerGoal.toLowerCase()) ||
        cert.skillsAddressed.some(s => s.toLowerCase().includes(primaryCareerGoal.toLowerCase()))
      )) {
        relevanceBooster = 25;
      }
      const scores = calculateRelevanceScores({
        relevance: Math.min(100, (cert.skillsAddressed.some(s => !profile.skills.map(us => us.toLowerCase()).includes(s.toLowerCase())) ? 75 : 50) + relevanceBooster),
        impact: cert.roiScore,
        difficultyLevel: 'Intermediate',
        timeToComplete: cert.timeInvestment,
        weights: { relevance: 0.3, impact: 0.5, difficulty: 0.2 }
      });
      return {
        ...cert,
        scores: {
          ...scores,
          overall: Math.min(100, scores.overall + (relevanceBooster > 0 ? 15 : 0))
        },
        eligibility,
        isBookmarked: bookmarks.includes(cert.id),
        isCompleted: completedItemIds.includes(cert.id)
      };
    })
    .sort((a, b) => b.scores.overall - a.scores.overall);

  // 5. Process Projects
  const rawProjects = recommendProjects(MOCK_PROJECTS, profile, aiAnalysis);
  const projects: ProjectRecommendation[] = rawProjects
    .filter((p) => !ignoredIds.includes(p.id))
    .map((p) => {
      const eligibility = checkGeneralEligibility(p.difficulty, userSkillCount);
      let relevanceBooster = 0;
      if (primaryCareerGoal && (
        p.title.toLowerCase().includes(primaryCareerGoal.toLowerCase()) ||
        p.description.toLowerCase().includes(primaryCareerGoal.toLowerCase()) ||
        p.skillsToGain.some(s => s.toLowerCase().includes(primaryCareerGoal.toLowerCase()))
      )) {
        relevanceBooster = 25;
      }
      const scores = calculateRelevanceScores({
        relevance: Math.min(100, (p.skillsToGain.length > 0 ? 85 : 45) + relevanceBooster),
        impact: p.impactScore,
        difficultyLevel: p.difficulty,
        timeToComplete: p.estimatedTime,
        weights: { relevance: 0.4, impact: 0.4, difficulty: 0.2 }
      });
      return {
        ...p,
        scores: {
          ...scores,
          overall: Math.min(100, scores.overall + (relevanceBooster > 0 ? 15 : 0))
        },
        eligibility,
        isBookmarked: bookmarks.includes(p.id),
        isCompleted: completedItemIds.includes(p.id)
      };
    })
    .sort((a, b) => b.scores.overall - a.scores.overall);

  // Trigger high-match alerts
  generateRecommendationAlerts(profile.uid, { jobs, internships, courses: learning, certs: certifications, projects });

  // Calculate default mockup analytics
  const applicationsSubmitted = Object.keys(appliedJobIds).length;
  const coursesCompleted = completedItemIds.filter(id => id.startsWith('course')).length;
  const projectsFinished = completedItemIds.filter(id => id.startsWith('proj')).length;
  const certificationProgress = Math.round(
    (completedItemIds.filter(id => id.startsWith('cert')).length / Math.max(1, MOCK_CERTIFICATIONS.length)) * 100
  );
  
  // Simulated stats
  const recommendationAcceptanceRate = Math.round(
    ((applicationsSubmitted + coursesCompleted + projectsFinished) / Math.max(1, bookmarks.length + applicationsSubmitted + completedItemIds.length)) * 100
  ) || 75;

  const careerScoreImprovement = Math.min(15, (coursesCompleted * 3) + (projectsFinished * 4));

  return {
    jobs,
    internships,
    learning,
    certifications,
    projects,
    analytics: {
      applicationsSubmitted,
      coursesCompleted,
      projectsFinished,
      certificationProgress: Math.min(100, certificationProgress),
      recommendationAcceptanceRate: Math.min(100, recommendationAcceptanceRate),
      careerScoreImprovement
    }
  };
}
