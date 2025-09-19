// In frontend/src/types/index.ts
export interface Recommendation {
  title: string;
  justification: string;
  roadmap: string[];
  estimatedSalary?: string;
  suggestedCertifications?: string[];
  keyCompanies?: string[];
}