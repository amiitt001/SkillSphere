/**
 * This file contains shared TypeScript interfaces used throughout the application.
 * Defining types in a central location ensures data consistency and improves code quality.
 */

/**
 * Defines the structure for a single AI-generated career recommendation object.
 */
export interface Recommendation {
  title: string;
  justification: string;
  roadmap: string[];
  estimatedSalary?: string;
  suggestedCertifications?: string[];
  keyCompanies?: string[];
}
