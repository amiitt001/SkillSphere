import type { UnifiedProfile, AIProfileAnalysis } from '@/types';
import type { Certification, CertificationRecommendation } from './types';

/**
 * Recommends certifications and calculates ROI based on cost, demand, and time.
 */
export function matchCertification(
  cert: Certification,
  profile: UnifiedProfile,
  aiAnalysis: AIProfileAnalysis | null
): Omit<CertificationRecommendation, 'scores' | 'eligibility'> {
  // Cost factor (1 to 5)
  let costFactor = 1;
  if (cert.cost > 20000) costFactor = 5;
  else if (cert.cost > 10000) costFactor = 4;
  else if (cert.cost > 5000) costFactor = 3;
  else if (cert.cost > 0) costFactor = 2;

  // Time factor (1 to 5)
  let timeFactor = 1;
  if (cert.timeInvestment.toLowerCase().includes('3 months') || cert.timeInvestment.toLowerCase().includes('2.5 months')) timeFactor = 4;
  else if (cert.timeInvestment.toLowerCase().includes('2 months')) timeFactor = 3;
  else if (cert.timeInvestment.toLowerCase().includes('1 month')) timeFactor = 2;

  // ROI calculation (0 to 100): Weighted formula
  // Higher demand = higher ROI. Higher cost & time = lower ROI.
  const roiScore = Math.max(0, Math.min(100, Math.round(
    (cert.demandScore * 10) - (costFactor * 4) - (timeFactor * 3) + 30
  )));

  // Why recommended justification
  let whyRecommended = `Highly demanded certification for your targeted fields.`;
  const userStream = (profile.linkedin?.headline || '').toLowerCase();
  
  const alignedGoals = cert.careerGoalsAligned.map(g => g.toLowerCase());
  const matchesGoal = aiAnalysis?.careerMatches?.some((m) => 
    alignedGoals.some((g) => g.includes(m.title.toLowerCase()) || m.title.toLowerCase().includes(g))
  );

  if (matchesGoal) {
    whyRecommended = `Directly aligned with your AI-suggested career path and goals.`;
  } else if (cert.skillsAddressed.some(s => profile.skills.map(us => us.toLowerCase()).includes(s.toLowerCase()))) {
    whyRecommended = `Validates your existing skills in ${cert.skillsAddressed.slice(0, 2).join(', ')}.`;
  }

  return {
    ...cert,
    whyRecommended,
    roiScore
  };
}

export function recommendCertifications(
  certs: Certification[],
  profile: UnifiedProfile,
  aiAnalysis: AIProfileAnalysis | null
): Omit<CertificationRecommendation, 'scores' | 'eligibility'>[] {
  return certs.map((cert) => matchCertification(cert, profile, aiAnalysis));
}
