import { UnifiedUserProfile } from './profileMemory';

export interface SmartQuestion {
  field: string;
  question: string;
  type: 'select' | 'multiselect' | 'text' | 'tags';
  options?: string[];
  placeholder?: string;
}

const QUESTION_PRIORITIES: { field: string; question: string; type: 'select' | 'multiselect' | 'text' | 'tags'; options?: string[]; placeholder?: string }[] = [
  {
    field: 'careerGoals.preferredRoles',
    question: 'What professional role(s) are you targeting?',
    type: 'multiselect',
    options: ['Backend Engineer', 'Frontend Engineer', 'Fullstack Engineer', 'AI / ML Engineer', 'Data Scientist', 'DevOps Engineer', 'Mobile Engineer', 'Cybersecurity Analyst'],
    placeholder: 'Select target roles'
  },
  {
    field: 'skills',
    question: 'What are your primary technical skills?',
    type: 'tags',
    options: ['Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Go', 'Docker', 'SQL', 'C++', 'Java'],
    placeholder: 'Add skills (e.g. Git, AWS)'
  },
  {
    field: 'careerGoals.preferredLocations',
    question: 'Where would you prefer to work?',
    type: 'multiselect',
    options: ['Remote', 'Bangalore', 'Mumbai', 'Delhi NCR', 'Pune', 'Hyderabad', 'San Francisco', 'New York', 'London'],
    placeholder: 'Select preferred locations'
  },
  {
    field: 'personalInfo.location',
    question: 'What is your current city/location?',
    type: 'text',
    placeholder: 'e.g. Bangalore, India'
  },
  {
    field: 'education.graduationYear',
    question: 'In which year did/will you graduate college?',
    type: 'select',
    options: ['2024', '2025', '2026', '2027', '2028', '2029'],
    placeholder: 'Select graduation year'
  },
  {
    field: 'careerGoals.expectedSalary',
    question: 'What are your salary expectations?',
    type: 'select',
    options: ['Internship (Stipend)', '< 6 LPA', '6 - 12 LPA', '12 - 25 LPA', '25+ LPA'],
    placeholder: 'Select expected salary range'
  }
];

export const smartQuestionEngine = {
  /**
   * Identifies the next highest priority missing field and returns its question schema.
   */
  getNextQuestion(profile: UnifiedUserProfile | null | undefined): SmartQuestion | null {
    if (!profile) {
      return QUESTION_PRIORITIES[0]; // Ask for roles first
    }

    for (const q of QUESTION_PRIORITIES) {
      const parts = q.field.split('.');
      if (parts.length === 2) {
        const [parent, child] = parts;
        const parentVal = (profile as any)[parent];
        const val = parentVal ? parentVal[child] : undefined;

        if (!val || (Array.isArray(val) && val.length === 0)) {
          return q;
        }
      } else {
        const val = (profile as any)[q.field];
        if (!val || (Array.isArray(val) && val.length === 0)) {
          return q;
        }
      }
    }

    return null; // All high priority fields answered!
  }
};
