/**
 * Project Prompts Library
 */

export const getProjectGenerationPrompt = (career: string, skillLevel: string, skills?: string) => `
You are an expert software engineering mentor and project advisor.
Generate 3 portfolio project ideas for someone targeting a "${career}" career.

User's skill level: ${skillLevel}
${skills ? `User's existing skills: ${skills}` : ''}

Your ENTIRE response must be a single valid JSON object:
{
  "projects": [
    {
      "title": "Project Title",
      "description": "2-3 sentence description of what the project does and why it's impressive",
      "techStack": ["React", "Node.js", "MongoDB"],
      "architecture": "Brief system architecture description (microservices, monolith, etc.)",
      "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
      "resumeDescription": "A powerful 2-line resume bullet point for this project",
      "folderStructure": "project-name/\\n├── src/\\n│   ├── components/\\n│   ├── pages/\\n│   └── utils/\\n├── server/\\n│   ├── routes/\\n│   └── models/\\n├── package.json\\n└── README.md",
      "difficulty": "${skillLevel}",
      "estimatedTime": "2-3 weeks"
    }
  ]
}

Rules:
- Generate exactly 3 projects
- Projects should be progressively more complex
- Each project should be genuinely impressive on a resume
- Tech stacks should be modern and industry-relevant
- Features should be specific and implementable
- Folder structure should use ├── and └── characters
- Resume descriptions should use strong action verbs
- Do NOT include markdown or text outside JSON
`.trim();
