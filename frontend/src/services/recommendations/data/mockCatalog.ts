import type { Job, Internship, Course, Certification, ProjectTemplate } from '../types';

export const MOCK_JOBS: Job[] = [
  {
    id: 'job_1',
    title: 'Software Engineer',
    company: 'Razorpay',
    location: 'Bengaluru, India',
    type: 'Full-time',
    provider: 'LinkedIn Jobs',
    salaryEstimate: '₹12,00,000 - ₹18,0,000 LPA',
    experienceRequired: 1,
    skillsRequired: ['Data Structures', 'Algorithms', 'JavaScript', 'Node.js', 'Git'],
    description: 'We are looking for a Software Engineer to help build scales for our core payment gateway product. You will work on microservices and build clean REST APIs.',
    difficultyLevel: 'Entry',
    url: 'https://linkedin.com/jobs/view/razorpay-swe'
  },
  {
    id: 'job_2',
    title: 'Backend Engineer',
    company: 'BrowserStack',
    location: 'Mumbai, India',
    type: 'Full-time',
    provider: 'Indeed',
    salaryEstimate: '₹14,0,000 - ₹22,0,000 LPA',
    experienceRequired: 3,
    skillsRequired: ['System Design', 'Databases', 'REST API', 'Docker', 'Caching', 'Node.js'],
    description: 'Join the backend core platform team to optimize and scale cloud services for running automation tests. Experience in SQL performance tuning is required.',
    difficultyLevel: 'Mid',
    url: 'https://indeed.com/view/browserstack-backend'
  },
  {
    id: 'job_3',
    title: 'Frontend Developer',
    company: 'Zomato',
    location: 'Gurugram, India',
    type: 'Full-time',
    provider: 'Naukri',
    salaryEstimate: '₹10,0,000 - ₹15,0,000 LPA',
    experienceRequired: 2,
    skillsRequired: ['JavaScript', 'TypeScript', 'React', 'HTML', 'CSS', 'Performance Optimization'],
    description: 'Build rich user interfaces for our food ordering portal. Focus on accessibility, fluid animations, and LCP/INP web vital optimizations.',
    difficultyLevel: 'Mid',
    url: 'https://naukri.com/zomato-frontend'
  },
  {
    id: 'job_4',
    title: 'Full Stack Developer',
    company: 'Hasura',
    location: 'Remote',
    type: 'Remote',
    provider: 'Wellfound',
    salaryEstimate: '₹18,0,000 - ₹26,0,000 LPA',
    experienceRequired: 3,
    skillsRequired: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Databases', 'GraphQL', 'Docker'],
    description: 'Help build and scale developer tools. Experience in building high performance APIs and responsive React dashboards is a must.',
    difficultyLevel: 'Mid',
    url: 'https://wellfound.com/hasura-fullstack'
  },
  {
    id: 'job_5',
    title: 'AI / ML Engineer',
    company: 'InMobi',
    location: 'Bengaluru, India',
    type: 'Full-time',
    provider: 'LinkedIn Jobs',
    salaryEstimate: '₹20,0,000 - ₹35,0,000 LPA',
    experienceRequired: 4,
    skillsRequired: ['Python', 'Machine Learning', 'PyTorch', 'TensorFlow', 'Algorithms', 'Statistics'],
    description: 'Develop and train recommendation and advertisement bidding models using deep learning algorithms. Optimize serving throughput at scale.',
    difficultyLevel: 'Senior',
    url: 'https://linkedin.com/jobs/view/inmobi-ml'
  },
  {
    id: 'job_6',
    title: 'Data Scientist',
    company: 'Fractal Analytics',
    location: 'Mumbai, India',
    type: 'Full-time',
    provider: 'Indeed',
    salaryEstimate: '₹12,0,000 - ₹20,0,000 LPA',
    experienceRequired: 2,
    skillsRequired: ['Python', 'Statistics', 'SQL', 'Pandas', 'Data Visualization', 'Machine Learning'],
    description: 'Design and deploy statistical experiments, build customer segmentation maps, and outline predictive business intelligence dashboard tools.',
    difficultyLevel: 'Mid',
    url: 'https://indeed.com/view/fractal-datascientist'
  },
  {
    id: 'job_7',
    title: 'DevOps Engineer',
    company: 'Postman',
    location: 'Bengaluru, India',
    type: 'Full-time',
    provider: 'RemoteOK',
    salaryEstimate: '₹16,0,000 - ₹24,0,000 LPA',
    experienceRequired: 3,
    skillsRequired: ['Docker', 'Cloud', 'Kubernetes', 'CI/CD', 'Git', 'Linux'],
    description: 'Automate build and deployment infrastructure for internal services. Support security validation pipelines and multi-cloud server setups.',
    difficultyLevel: 'Mid',
    url: 'https://remoteok.com/postman-devops'
  },
  {
    id: 'job_8',
    title: 'Mobile App Developer',
    company: 'Groww',
    location: 'Bengaluru, India',
    type: 'Full-time',
    provider: 'Naukri',
    salaryEstimate: '₹14,0,000 - ₹20,0,000 LPA',
    experienceRequired: 2,
    skillsRequired: ['Flutter', 'Dart', 'Git', 'REST API', 'JavaScript'],
    description: 'Build native high-fidelity Android and iOS applications using Flutter. Integrate financial trade graphs and keep animations butter smooth.',
    difficultyLevel: 'Mid',
    url: 'https://naukri.com/groww-mobile'
  }
];

export const MOCK_INTERNSHIPS: Internship[] = [
  {
    id: 'intern_1',
    title: 'Software Development Intern',
    company: 'TCS',
    location: 'Pune, India',
    provider: 'Internshala',
    duration: '6 Months',
    stipend: '₹15,000 / month',
    skillsRequired: ['Data Structures', 'Algorithms', 'Java', 'Git'],
    academicYearTarget: ['3rd Year', '4th Year'],
    description: 'Excellent learning opportunity to work with system engineers, run software validation suites, and document requirements.',
    url: 'https://internshala.com/tcs-sde'
  },
  {
    id: 'intern_2',
    title: 'Frontend React Intern',
    company: 'Razorpay',
    location: 'Bengaluru, India',
    provider: 'LinkedIn',
    duration: '3 Months',
    stipend: '₹35,000 / month',
    skillsRequired: ['JavaScript', 'React', 'HTML', 'CSS'],
    academicYearTarget: ['3rd Year', '4th Year', 'Postgraduate'],
    description: 'Work directly on Z-level merchant dashboard components. Improve styling alignments, write unit tests, and review client UI code.',
    url: 'https://linkedin.com/internship/razorpay-react'
  },
  {
    id: 'intern_3',
    title: 'Backend Engineering Intern',
    company: 'Postman',
    location: 'Remote',
    provider: 'Wellfound',
    duration: '6 Months',
    stipend: '₹40,000 / month',
    skillsRequired: ['Node.js', 'REST API', 'Git', 'TypeScript'],
    academicYearTarget: ['4th Year', 'Graduated', 'Postgraduate'],
    description: 'Help build developer workflow templates, run integration tests, and optimize telemetry analytics pipelines.',
    url: 'https://wellfound.com/postman-backend-intern'
  },
  {
    id: 'intern_4',
    title: 'Data Science Intern',
    company: 'Wipro',
    location: 'Bengaluru, India',
    provider: 'Internshala',
    duration: '3 Months',
    stipend: '₹12,000 / month',
    skillsRequired: ['Python', 'SQL', 'Pandas', 'Statistics'],
    academicYearTarget: ['2nd Year', '3rd Year', '4th Year'],
    description: 'Clean high-volume product databases, write pipeline SQL queries, and design weekly analytics dashboards for client review.',
    url: 'https://internshala.com/wipro-ds'
  }
];

export const MOCK_COURSES: Course[] = [
  {
    id: 'course_1',
    title: 'Data Structures and Algorithms in Java',
    provider: 'NPTEL',
    cost: 0,
    costCurrency: 'INR',
    language: 'English',
    duration: '12 Weeks',
    difficulty: 'Intermediate',
    skillsGained: ['Data Structures', 'Algorithms', 'Java'],
    description: 'Comprehensive college level introduction to arrays, trees, heaps, graphs, hashing, sorting algorithms, and complexity analysis.',
    rating: 4.6,
    url: 'https://nptel.ac.in/courses/dsa-java',
    category: 'University Courses'
  },
  {
    id: 'course_2',
    title: 'Database Management Systems',
    provider: 'SWAYAM',
    cost: 0,
    costCurrency: 'INR',
    language: 'English',
    duration: '8 Weeks',
    difficulty: 'Intermediate',
    skillsGained: ['Databases', 'SQL'],
    description: 'Learn SQL schema creation, ER diagrams, normalization rules, indexing, transaction ACID properties, and relational algebra.',
    rating: 4.5,
    url: 'https://swayam.gov.in/dbms',
    category: 'University Courses'
  },
  {
    id: 'course_3',
    title: 'Machine Learning Specialization',
    provider: 'Coursera',
    cost: 4100,
    costCurrency: 'INR',
    language: 'English',
    duration: '2 Months',
    difficulty: 'Beginner',
    skillsGained: ['Machine Learning', 'Python', 'Algorithms', 'Statistics'],
    description: 'Taught by Andrew Ng, learn regression, classification, neural networks, decision trees, anomaly detection, and ethical ML deployment.',
    rating: 4.9,
    url: 'https://coursera.org/specializations/machine-learning',
    category: 'Paid Courses'
  },
  {
    id: 'course_4',
    title: 'React Core & Web Development',
    provider: 'freeCodeCamp',
    cost: 0,
    costCurrency: 'USD',
    language: 'English',
    duration: '15 Hours',
    difficulty: 'Beginner',
    skillsGained: ['React', 'JavaScript', 'HTML', 'CSS'],
    description: 'Hands-on project-centric video series teaching state hooks, side effects, clean folder setups, DOM manipulation, and responsive forms.',
    rating: 4.8,
    url: 'https://freecodecamp.org/react-tutorial',
    category: 'Free Resources'
  },
  {
    id: 'course_5',
    title: 'Next.js 15 Full Tutorial (in Hindi)',
    provider: 'YouTube',
    cost: 0,
    costCurrency: 'INR',
    language: 'Hindi',
    duration: '8 Hours',
    difficulty: 'Intermediate',
    skillsGained: ['React', 'Next.js', 'JavaScript', 'TypeScript'],
    description: 'Learn Next.js 15 App router, Server Components, Route handlers, SEO setup, Tailwind layouts, and deployment systems.',
    rating: 4.7,
    url: 'https://youtube.com/nextjs-15-hindi',
    category: 'Regional Language Resources'
  },
  {
    id: 'course_6',
    title: 'AWS Certified Solutions Architect Path',
    provider: 'AWS Skill Builder',
    cost: 0,
    costCurrency: 'USD',
    language: 'English',
    duration: '20 Hours',
    difficulty: 'Intermediate',
    skillsGained: ['Cloud', 'System Design'],
    description: 'Official self-paced cloud roadmap covering EC2, S3, VPC routing, RDS, IAM compliance, auto-scaling, and billing tools.',
    rating: 4.6,
    url: 'https://aws.training/solutions-architect',
    category: 'Documentation'
  },
  {
    id: 'course_7',
    title: 'Google Cloud Engineer Path',
    provider: 'Google Cloud Skills Boost',
    cost: 2500,
    costCurrency: 'INR',
    language: 'English',
    duration: '30 Hours',
    difficulty: 'Intermediate',
    skillsGained: ['Cloud', 'Docker', 'Kubernetes'],
    description: 'Interactive labs verifying dynamic container deployment, VPC configuration, serverless functions, and BigQuery data operations.',
    rating: 4.7,
    url: 'https://cloudskillsboost.google/engineer-path',
    category: 'Hands-on Labs'
  },
  {
    id: 'course_8',
    title: 'Intro to System Design',
    provider: 'YouTube',
    cost: 0,
    costCurrency: 'USD',
    language: 'English',
    duration: '10 Hours',
    difficulty: 'Advanced',
    skillsGained: ['System Design', 'Caching'],
    description: 'Visual breakdown of load balancers, database scaling, API gateways, hashing algorithms, Redis caching, and microservices.',
    rating: 4.9,
    url: 'https://youtube.com/system-design',
    category: 'Video Tutorials'
  }
];

export const MOCK_CERTIFICATIONS: Certification[] = [
  {
    id: 'cert_1',
    name: 'AWS Certified Solutions Architect - Associate',
    provider: 'AWS',
    cost: 12000,
    timeInvestment: '2 Months',
    demandScore: 9,
    careerGoalsAligned: ['Backend Engineer', 'DevOps Engineer', 'Full Stack Engineer'],
    skillsAddressed: ['Cloud', 'System Design'],
    description: 'Validates ability to design and deploy robust, secure, and scalably cost-efficient cloud infrastructures using AWS products.',
    url: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/'
  },
  {
    id: 'cert_2',
    name: 'Google Cloud Associate Cloud Engineer',
    provider: 'Google',
    cost: 10000,
    timeInvestment: '1 Month',
    demandScore: 8,
    careerGoalsAligned: ['DevOps Engineer', 'Backend Engineer'],
    skillsAddressed: ['Cloud', 'Docker'],
    description: 'Certifies competency in deploying, configuring, monitoring, and validating containerized systems on Google Cloud Platform.',
    url: 'https://cloud.google.com/learn/certification/associate-cloud-engineer'
  },
  {
    id: 'cert_3',
    name: 'Microsoft Certified: Azure Fundamentals',
    provider: 'Microsoft',
    cost: 4500,
    timeInvestment: '3 Weeks',
    demandScore: 7,
    careerGoalsAligned: ['Full Stack Engineer', 'Backend Engineer'],
    skillsAddressed: ['Cloud'],
    description: 'Foundational validation of cloud architectures, Azure core tools, governance, compliance, and user security models.',
    url: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/'
  },
  {
    id: 'cert_4',
    name: 'Red Hat Certified System Administrator (RHCSA)',
    provider: 'Red Hat',
    cost: 25000,
    timeInvestment: '2.5 Months',
    demandScore: 8,
    careerGoalsAligned: ['DevOps Engineer', 'Backend Engineer'],
    skillsAddressed: ['Linux', 'Git', 'Docker'],
    description: 'Practical, performance-based test validating core administration skills across Red Hat Enterprise Linux systems.',
    url: 'https://www.redhat.com/en/services/certification/rhcsa'
  }
];

export const MOCK_PROJECTS: ProjectTemplate[] = [
  {
    id: 'proj_1',
    title: 'E-Commerce Microservices Engine',
    difficulty: 'Advanced',
    estimatedTime: '3 Weeks',
    skillsToClose: ['Node.js', 'Databases', 'REST API', 'Caching', 'Docker'],
    githubReady: true,
    description: 'Create a decoupled e-commerce shopping server with separate microservices for inventory, payments, and ordering. Integrate Redis for caching products.',
    steps: [
      'Set up database schemas for Users, Orders, and Products in SQL or MongoDB',
      'Implement authentication endpoints using JWT and secure route policies',
      'Create ordering API and spin up a separate payment verification service',
      'Integrate Redis cache to store hot-selling products and limit DB queries',
      'Write a Docker compose file orchestrating database, cache, and services'
    ]
  },
  {
    id: 'proj_2',
    title: 'Interactive Portfolio Dashboard',
    difficulty: 'Beginner',
    estimatedTime: '1 Week',
    skillsToClose: ['React', 'JavaScript', 'HTML', 'CSS', 'Git'],
    githubReady: true,
    description: 'Build a premium interactive developer portfolio showcasing resume highlights, live projects (fetched from GitHub API), and a contact mail form.',
    steps: [
      'Design clean page layouts using CSS grids/flexbox and a warm dark-mode color scheme',
      'Build React sections for profile introduction, skills, projects, and work history',
      'Fetch repository lists using GitHub REST API and format them dynamically',
      'Create form fields with client validations and set up mail submission',
      'Host code on GitHub and deploy live preview using Vercel or Netlify'
    ]
  },
  {
    id: 'proj_3',
    title: 'Deep Learning Recommendation Hub',
    difficulty: 'Advanced',
    estimatedTime: '4 Weeks',
    skillsToClose: ['Python', 'Machine Learning', 'PyTorch', 'Algorithms', 'Statistics'],
    githubReady: true,
    description: 'Develop a Python recommender engine mapping dataset tags. Train collaborative filtering models and build a REST API to serve user recommendations.',
    steps: [
      'Load, clean, and explore rating datasets using Pandas and Numpy',
      'Formulate matrix factorization algorithms using PyTorch deep neural networks',
      'Analyze statistical metrics (MAE, RMSE) to optimize model hyperparameters',
      'Deploy the weights using a lightweight Python Flask/FastAPI backend endpoint',
      'Integrate API with an automated Swagger interactive documentation interface'
    ]
  },
  {
    id: 'proj_4',
    title: 'Dockerized CI/CD Deployment Pipeline',
    difficulty: 'Intermediate',
    estimatedTime: '2 Weeks',
    skillsToClose: ['Docker', 'Cloud', 'Git', 'Linux'],
    githubReady: false,
    description: 'Automate build processes for a node application. Configure GitHub Actions workflows to build Docker images, test APIs, and deploy to a cloud instance.',
    steps: [
      'Write a multi-stage Dockerfile optimizing Node.js build size and caching layers',
      'Create a GitHub Actions workflow that triggers on every code push',
      'Add test stages running Jest unit tests inside temporary Docker containers',
      'Automate image publishing to Docker Hub on successful build runs',
      'Write ssh scripts auto-pulling and deploying updated images to AWS EC2 instance'
    ]
  }
];
