import type { UnifiedProfile, AIProfileAnalysis } from '@/types';
import type { ProjectTemplate, ProjectRecommendation } from './types';
import { buildSkillGraph } from '../intelligence/skillGraphEngine';
import { analyzeSkillGap } from '../intelligence/skillGapEngine';

/**
 * Recommends projects based on target career skill gaps.
 */
export function matchProject(
  project: ProjectTemplate,
  profile: UnifiedProfile,
  aiAnalysis: AIProfileAnalysis | null
): Omit<ProjectRecommendation, 'scores' | 'eligibility'> {
  // Determine target career
  let targetCareer: any = 'Software Engineer';
  if (aiAnalysis?.careerMatches && aiAnalysis.careerMatches.length > 0) {
    targetCareer = aiAnalysis.careerMatches[0].title;
  }

  // Run SkillGapEngine
  const graph = buildSkillGraph(profile);
  const gapResult = analyzeSkillGap(graph, targetCareer);

  // Get missing/weak skills
  const missingOrWeakSkills = new Set(
    gapResult.items
      .filter((item) => item.status === 'critical_missing' || item.status === 'missing' || item.status === 'weak')
      .map((item) => item.skill.toLowerCase())
  );

  const skillsToGain = project.skillsToClose.filter(
    (skill) => missingOrWeakSkills.has(skill.toLowerCase()) || 
               !profile.skills.some((us) => us.toLowerCase() === skill.toLowerCase())
  );

  let impactScore = 30; // base score
  impactScore += skillsToGain.length * 20;
  if (project.githubReady) {
    impactScore += 15;
  }
  impactScore = Math.min(100, impactScore);

  let whyRecommended = `Builds hands-on experience with ${project.skillsToClose.join(', ')}.`;
  if (skillsToGain.length > 0) {
    whyRecommended = `Closes critical skill gaps in ${skillsToGain.slice(0, 3).join(', ')} required for ${targetCareer} roles.`;
  }
  if (project.githubReady) {
    whyRecommended += ' Ready to be deployed as a featured GitHub repository.';
  }

  return {
    ...project,
    skillsToGain,
    impactScore,
    whyRecommended
  };
}

export function recommendProjects(
  projects: ProjectTemplate[],
  profile: UnifiedProfile,
  aiAnalysis: AIProfileAnalysis | null
): Omit<ProjectRecommendation, 'scores' | 'eligibility'>[] {
  return projects.map((project) => matchProject(project, profile, aiAnalysis));
}
