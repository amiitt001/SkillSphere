/**
 * Resume Parser Tests
 * Tests for section detection, contact extraction, experience parsing,
 * skill classification, and formatting issue detection.
 *
 * Uses realistic resume samples for 7 different archetypes.
 */

import { resumeParser } from '../resumeParser';

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const FRONTEND_RESUME = `
John Doe
john.doe@email.com | github.com/johndoe | linkedin.com/in/johndoe | +1-555-0100
San Francisco, CA

SUMMARY
Frontend engineer with 3 years of experience building scalable React applications.

EXPERIENCE
Frontend Developer — Acme Corp | Jan 2022 – Present
• Built React component library serving 50+ internal teams
• Reduced page load time by 40% using code splitting and lazy loading
• Led migration from JavaScript to TypeScript, improving developer productivity
• Mentored 3 junior developers on React best practices

Software Engineering Intern — StartupXYZ | Jun 2021 – Aug 2021
• Developed 10+ responsive UI components using React and Tailwind CSS
• Collaborated with design team to implement pixel-perfect layouts

SKILLS
React, TypeScript, JavaScript, HTML, CSS, Tailwind CSS, Next.js, Redux, GraphQL, Git, Jest, Webpack, Vite, Node.js

PROJECTS
E-Commerce Dashboard
A production-ready admin dashboard with real-time analytics and inventory management.
Tech: React, TypeScript, Node.js, PostgreSQL, Redis
Live: https://dashboard.example.com | github.com/johndoe/ecommerce-dashboard

Component Library
Open-source UI component library with 40+ components, 500+ GitHub stars.
Tech: React, TypeScript, Storybook, Jest
github.com/johndoe/ui-lib

EDUCATION
B.Tech Computer Science — Stanford University
Graduation: 2021 | CGPA: 3.8/4.0

ACHIEVEMENTS
• Won 1st place at HackMIT 2021 — built AI-powered accessibility tool
• Maintainer of open-source project with 500+ GitHub stars

CERTIFICATIONS
AWS Certified Developer Associate
Meta Frontend Developer Professional Certificate
`;

const BACKEND_RESUME = `
Jane Smith
jane.smith@email.com
github.com/janesmith | linkedin.com/in/janesmith
New York, NY

SUMMARY
Backend engineer specializing in distributed systems and microservices architecture.

EXPERIENCE
Senior Backend Engineer — BigTech Inc | Mar 2020 – Present
• Designed and built microservices handling 10M+ daily requests
• Reduced database query time by 60% through query optimization and Redis caching
• Led team of 6 engineers on core infrastructure redesign
• Implemented CI/CD pipeline reducing deployment time by 75%

Backend Engineer — MidTech Co | Jun 2018 – Feb 2020
• Built REST APIs with Go and PostgreSQL serving 500K users
• Implemented distributed caching with Redis reducing load by 45%

Software Engineer Intern — SmallStartup | May 2017 – Aug 2017
• Developed data ingestion pipeline processing 100K records/day

SKILLS
Go, Python, Java, Node.js, PostgreSQL, MySQL, MongoDB, Redis, Kafka, Docker, Kubernetes, AWS, Terraform, GitHub Actions, gRPC, REST, GraphQL

PROJECTS
Distributed Task Queue
High-performance task queue built with Go and Redis, processing 1M+ tasks/day.
github.com/janesmith/taskqueue | Deployed on AWS EKS

EDUCATION
M.S. Computer Science — MIT
Graduation: 2018

ACHIEVEMENTS
• ACM ICPC Regional Finalist 2017
• Research paper published in IEEE CloudCom 2019
• Led backend infrastructure that scaled from 10K to 1M users

CERTIFICATIONS
AWS Certified Solutions Architect - Professional
Certified Kubernetes Administrator (CKA)
`;

const FRESH_GRAD_RESUME = `
Alex Johnson
alex.j@email.com | github.com/alexj | linkedin.com/in/alexj

EDUCATION
B.Tech Computer Science Engineering — IIT Bombay
Graduation: 2024 | CGPA: 8.5/10
Relevant Coursework: Data Structures, Algorithms, Database Systems, Computer Networks

SKILLS
Python, Java, C++, SQL, HTML, CSS, JavaScript, Git, Linux, React (basics)

PROJECTS
Student Management System
Web application for managing student records with CRUD operations.
Tech: Java, Spring Boot, MySQL, HTML, CSS
github.com/alexj/student-mgmt

Library Management System
Command-line application for library inventory management.
Tech: Python, SQLite
github.com/alexj/library-mgmt

ACHIEVEMENTS
• Solved 250+ problems on LeetCode (150 Medium, 30 Hard)
• Competitive Programming rating: 1600 on Codeforces
• Participated in Smart India Hackathon 2023

CERTIFICATIONS
Google IT Support Professional Certificate
`;

const SENIOR_ENGINEER_RESUME = `
Michael Chen
m.chen@email.com | github.com/mchen | linkedin.com/in/mchen | Portfolio: mchen.dev
Austin, TX

SUMMARY
Principal Engineer with 10 years building large-scale distributed systems at FAANG companies.
Expert in system design, technical leadership, and driving organizational change.

EXPERIENCE
Principal Software Engineer — Meta | Jan 2020 – Present
• Architected distributed storage system handling 5PB data across 3 regions
• Led cross-functional team of 20 engineers across 4 time zones
• Reduced infrastructure costs by $2M/year through capacity optimization
• Mentored 15 engineers, promoted 4 to senior

Senior Software Engineer — Google | Jun 2016 – Dec 2019
• Built real-time indexing pipeline processing 50M events/sec
• Improved search latency by 35% (P99) through algorithmic optimization

Software Engineer — Amazon | Jul 2014 – May 2016
• Developed e-commerce recommendation engine serving 100M users
• Increased conversion rate by 12% through personalization improvements

SKILLS
Go, Python, Java, C++, Scala, Kubernetes, Docker, AWS, GCP, Kafka, Cassandra, Elasticsearch, Terraform, Prometheus, Grafana, Redis, PostgreSQL, gRPC

EDUCATION
M.S. Computer Science — Carnegie Mellon University 2014

ACHIEVEMENTS
• 3 patents in distributed systems
• Keynote speaker at KubeCon 2022
• IEEE publications: 2 papers on distributed consensus algorithms
• Open-source contributor: 1500+ GitHub stars across projects

CERTIFICATIONS
AWS Certified Solutions Architect Professional
Google Cloud Professional Data Engineer
`;

const DATA_SCIENTIST_RESUME = `
Priya Patel
priya.p@email.com | github.com/priyap | linkedin.com/in/priyap

SUMMARY
Data Scientist with 4 years of experience in machine learning, NLP, and statistical modeling.

EXPERIENCE
Data Scientist — Analytics Corp | Aug 2021 – Present
• Built NLP models achieving 94% accuracy on sentiment classification
• Developed recommendation system increasing user engagement by 28%
• Processed and analyzed 500GB+ datasets using PySpark and Databricks
• Deployed ML models to production using MLflow and Docker

Junior Data Scientist — Research Lab | Jun 2020 – Jul 2021
• Implemented deep learning models for image classification using TensorFlow
• Reduced model training time by 60% through GPU optimization

Data Science Intern — DataCo | May 2019 – Jul 2019
• Analyzed 1M+ user records to identify churn patterns using Python

SKILLS
Python, R, SQL, TensorFlow, PyTorch, scikit-learn, pandas, NumPy, PySpark, Spark, Databricks, Snowflake, Tableau, Docker, MLflow, Airflow, Git, Jupyter

EDUCATION
M.S. Data Science — UC Berkeley 2020

ACHIEVEMENTS
• Kaggle Competitions Master (Top 1% globally)
• Research paper accepted at NeurIPS 2022
• Best Paper Award at company data summit 2023

CERTIFICATIONS
Google Professional Machine Learning Engineer
AWS Certified Machine Learning Specialty
`;

const CAREER_SWITCHER_RESUME = `
Robert Wilson
r.wilson@email.com | linkedin.com/in/rwilson
Chicago, IL

SUMMARY
Mechanical engineer transitioning to software development after 5 years in automotive industry.
Self-taught Python, completed full-stack bootcamp, built 3 side projects.

EXPERIENCE
Mechanical Engineer — AutoCorp | Jan 2018 – Dec 2022
• Led design of automotive components saving $500K in production costs
• Managed CAD models for 20+ vehicle parts using SolidWorks
• Collaborated with cross-functional teams of 15+ engineers
• Reduced assembly time by 25% through process optimization

Software Engineer (Personal Projects) | Jan 2023 – Present
• Built fleet tracking dashboard using React and Node.js
• Deployed application on AWS using Docker containers

SKILLS
Python, JavaScript, React, Node.js, SQL, Git, Docker, AWS (basic), CAD, SolidWorks, MATLAB

EDUCATION
B.E. Mechanical Engineering — University of Illinois 2017
Full-Stack Web Development Bootcamp — Coding Academy 2023

PROJECTS
Fleet Tracking Dashboard
Real-time vehicle tracking application using React, Node.js, and PostgreSQL.
github.com/rwilson/fleet-tracker | Deployed on AWS

ACHIEVEMENTS
• Best Innovation Award at AutoCorp 2020
• Completed 100 Days of Code Challenge
`;

const DEVOPS_RESUME = `
Sarah Kim
s.kim@email.com | github.com/skim | linkedin.com/in/skim | portfolio: skim.io

EXPERIENCE
Senior DevOps Engineer — CloudFirst | Apr 2019 – Present
• Designed and maintained Kubernetes clusters serving 200+ microservices
• Implemented GitOps workflow reducing deployment failures by 80%
• Built monitoring stack (Prometheus, Grafana, AlertManager) for 99.99% uptime
• Automated infrastructure provisioning with Terraform managing 500+ resources
• Led migration from on-premises to AWS, saving $3M annually

DevOps Engineer — TechCorp | Jun 2017 – Mar 2019
• Set up CI/CD pipelines with Jenkins and GitHub Actions for 30+ services
• Containerized legacy applications with Docker, reducing deployment time by 70%

SKILLS
Kubernetes, Docker, Terraform, AWS, GCP, Azure, Prometheus, Grafana, Jenkins, GitHub Actions, GitLab CI, Ansible, Python, Bash, Go, Linux, Nginx, Istio, Helm

EDUCATION
B.Sc Computer Science — Georgia Tech 2017

ACHIEVEMENTS
• CNCF Ambassador 2022
• Speaker at KubeCon North America 2023
• Certified Kubernetes Administrator, AWS Solutions Architect Pro

CERTIFICATIONS
Certified Kubernetes Administrator (CKA)
Certified Kubernetes Application Developer (CKAD)
AWS Solutions Architect Professional
HashiCorp Certified Terraform Associate
`;

// ─── Contact Extraction Tests ─────────────────────────────────────────────────

describe('ResumeParser — Contact Extraction', () => {
  test('extracts email from frontend resume', () => {
    const parsed = resumeParser.parse(FRONTEND_RESUME);
    expect(parsed.contact.email).toBe('john.doe@email.com');
  });

  test('extracts GitHub URL', () => {
    const parsed = resumeParser.parse(FRONTEND_RESUME);
    expect(parsed.contact.githubUrl).toContain('johndoe');
  });

  test('extracts LinkedIn URL', () => {
    const parsed = resumeParser.parse(FRONTEND_RESUME);
    expect(parsed.contact.linkedinUrl).toContain('johndoe');
  });

  test('handles missing phone gracefully', () => {
    const parsed = resumeParser.parse(FRESH_GRAD_RESUME);
    expect(parsed.contact.phone).toBeDefined();
  });
});

// ─── Section Detection Tests ──────────────────────────────────────────────────

describe('ResumeParser — Section Detection', () => {
  test('detects experience section in backend resume', () => {
    const parsed = resumeParser.parse(BACKEND_RESUME);
    expect(parsed.experience.length).toBeGreaterThan(0);
  });

  test('detects skills section in all resumes', () => {
    for (const resume of [FRONTEND_RESUME, BACKEND_RESUME, DATA_SCIENTIST_RESUME]) {
      const parsed = resumeParser.parse(resume);
      expect(parsed.skills.length).toBeGreaterThan(0);
    }
  });

  test('detects education in fresh grad resume', () => {
    const parsed = resumeParser.parse(FRESH_GRAD_RESUME);
    expect(parsed.education.length).toBeGreaterThan(0);
  });

  test('detects projects in all resumes', () => {
    for (const resume of [FRONTEND_RESUME, FRESH_GRAD_RESUME, CAREER_SWITCHER_RESUME]) {
      const parsed = resumeParser.parse(resume);
      expect(parsed.projects.length).toBeGreaterThan(0);
    }
  });

  test('detects certifications in backend resume', () => {
    const parsed = resumeParser.parse(BACKEND_RESUME);
    expect(parsed.certifications.length).toBeGreaterThan(0);
  });
});

// ─── Experience Parsing Tests ─────────────────────────────────────────────────

describe('ResumeParser — Experience Parsing', () => {
  test('detects quantified bullets in frontend resume', () => {
    const parsed = resumeParser.parse(FRONTEND_RESUME);
    const totalQuantified = parsed.experience.reduce((s, e) => s + e.quantifiedBullets.length, 0);
    expect(totalQuantified).toBeGreaterThan(0);
  });

  test('detects leadership keywords in senior engineer resume', () => {
    const parsed = resumeParser.parse(SENIOR_ENGINEER_RESUME);
    const hasLeadership = parsed.experience.some((e) => e.hasLeadershipKeywords);
    expect(hasLeadership).toBe(true);
  });

  test('detects internship in frontend resume', () => {
    const parsed = resumeParser.parse(FRONTEND_RESUME);
    const internships = parsed.experience.filter((e) => e.isInternship);
    expect(internships.length).toBeGreaterThan(0);
  });

  test('calculates total experience months for senior engineer', () => {
    const parsed = resumeParser.parse(SENIOR_ENGINEER_RESUME);
    // Senior engineer has 10+ years — should be 60+ months
    expect(parsed.totalExperienceMonths).toBeGreaterThan(60);
  });

  test('fresh grad has limited experience', () => {
    const parsed = resumeParser.parse(FRESH_GRAD_RESUME);
    expect(parsed.totalExperienceMonths).toBeLessThan(24);
  });
});

// ─── Skills Parsing Tests ─────────────────────────────────────────────────────

describe('ResumeParser — Skills Classification', () => {
  test('classifies React as framework', () => {
    const parsed = resumeParser.parse(FRONTEND_RESUME);
    const reactSkill = parsed.skills.find((s) => s.normalizedName === 'react');
    expect(reactSkill?.category).toBe('framework');
  });

  test('classifies Python as programming language', () => {
    const parsed = resumeParser.parse(DATA_SCIENTIST_RESUME);
    const pythonSkill = parsed.skills.find((s) => s.normalizedName === 'python');
    expect(pythonSkill?.category).toBe('programming_language');
  });

  test('classifies Docker as devops', () => {
    const parsed = resumeParser.parse(DEVOPS_RESUME);
    const dockerSkill = parsed.skills.find((s) => s.normalizedName === 'docker');
    expect(dockerSkill?.category).toBe('devops');
  });

  test('marks modern skills correctly', () => {
    const parsed = resumeParser.parse(BACKEND_RESUME);
    const modernSkills = parsed.skills.filter((s) => s.isModern);
    expect(modernSkills.length).toBeGreaterThan(0);
  });

  test('DevOps resume has many devops-category skills', () => {
    const parsed = resumeParser.parse(DEVOPS_RESUME);
    const devopsSkills = parsed.skills.filter((s) => s.category === 'devops');
    expect(devopsSkills.length).toBeGreaterThan(2);
  });
});

// ─── Achievements Parsing Tests ───────────────────────────────────────────────

describe('ResumeParser — Achievements Parsing', () => {
  test('detects hackathon achievement', () => {
    const parsed = resumeParser.parse(FRONTEND_RESUME);
    const hackathon = parsed.achievements.find((a) => a.type === 'hackathon');
    expect(hackathon).toBeDefined();
  });

  test('detects research publication', () => {
    const parsed = resumeParser.parse(SENIOR_ENGINEER_RESUME);
    const research = parsed.achievements.find(
      (a) => a.type === 'research' || a.type === 'publication'
    );
    expect(research).toBeDefined();
  });

  test('detects competitive programming', () => {
    const parsed = resumeParser.parse(FRESH_GRAD_RESUME);
    const cp = parsed.achievements.find((a) => a.type === 'competitive_programming');
    expect(cp).toBeDefined();
  });
});

// ─── Determinism Tests ────────────────────────────────────────────────────────

describe('ResumeParser — Determinism', () => {
  test('same input always produces same output', () => {
    const result1 = resumeParser.parse(FRONTEND_RESUME);
    const result2 = resumeParser.parse(FRONTEND_RESUME);

    expect(result1.skills.length).toBe(result2.skills.length);
    expect(result1.experience.length).toBe(result2.experience.length);
    expect(result1.contact.email).toBe(result2.contact.email);
    expect(result1.totalExperienceMonths).toBe(result2.totalExperienceMonths);
  });

  test('different resumes produce different results', () => {
    const r1 = resumeParser.parse(FRESH_GRAD_RESUME);
    const r2 = resumeParser.parse(SENIOR_ENGINEER_RESUME);
    // Senior engineer should have more experience months
    expect(r2.totalExperienceMonths).toBeGreaterThan(r1.totalExperienceMonths);
  });
});
