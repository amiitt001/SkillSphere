// Defines the shape of the AI's recommendation object
export type Recommendation = {
  title: string;
  justification: string;
  roadmap: string[];
  // Add the new optional fields
  estimatedSalary?: string;
  suggestedCertifications?: string[];
  keyCompanies?: string[];
};

