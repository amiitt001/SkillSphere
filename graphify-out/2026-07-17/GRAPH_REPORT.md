# Graph Report - .  (2026-07-17)

## Corpus Check
- 312 files · ~273,062 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1348 nodes · 3141 edges · 85 communities (66 shown, 19 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.55)
- Token cost: 11,607 input · 25,618 output

## Community Hubs (Navigation)
- Profile Aggregator Providers
- Career Recommendation Engines
- Enterprise Platform Services
- UI Charts & Visualizations
- Ecosystem Infrastructure
- Ecosystem Candidate Ranking
- AI Copilot Core System
- Intelligence Platform Metrics
- Financial & Billing Services
- AI Context & Memory Orchestrator
- Workspace Security & Hardening
- User Onboarding Flows
- Workspace Automation & Predictions
- TypeScript Settings
- Auth & Core Layout Components
- Lib Module
- Services Integrations Module
- Package Config
- Package Config
- Frontend Components
- User Onboarding
- Frontend Components
- AI Copilot System
- Frontend Components
- App Dashboard Compare Module
- Types Module
- User Onboarding
- Comparison Config
- Services Ai Provider Module
- Services Ai Modules Module
- Lib Module
- Services Ai Modules Module
- App Interview-Prep Module
-   Home Orion Projects Skillsphere Module
- Services Integrations Module
- Services Intelligence Module
- Readme Config
- App Dashboard Results Module
- App Job-Intelligence Module
-   Home Orion Projects Skillsphere Module
- Dashboard Config
- Profile Config
-   Home Orion Projects Skillsphere Module
- App Profile Module
- Integration Providers
- Services Events Module
- Job Config
- Services Ai Modules Module
- Services Ai Modules Module
- Services Ai Modules Module
- Graphify Config
- Package Config
- Agents Config
- Package Config
- Services Enterprise Module
- Services Ai Parser Module
- Eslint Config
- App Api Intelligence-Platform Experiments Module
- Jest Config
- AI Copilot System
- Index Config
- Package Config
- Next Config
- App Api Intelligence Reports Module
- Frontend Components
- Onboarding Config
- Vercel Config
- Package Config
- Package Config
- Package Config
- Package Config
- Package Config
- Package Config
- Package Config
- Postcss Config
- File Config
- Globe Config
- Vercel Config
- Window Config
- Responsive Config
- Resume-Helper Config

## God Nodes (most connected - your core abstractions)
1. `verifyAuth()` - 172 edges
2. `logger` - 91 edges
3. `useAuth()` - 38 edges
4. `errorResponse()` - 37 edges
5. `successResponse()` - 33 edges
6. `AiService` - 29 edges
7. `auth` - 26 edges
8. `ProtectedRoute()` - 22 edges
9. `Career Path Comparison UI` - 21 edges
10. `Sidebar()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `SkillSphere Logo` --represents--> `SkillSphere Web Application`  [INFERRED]
  frontend/public/logo.png → README.md
- `SkillSphere Web Application` --uses--> `typescript`  [EXTRACTED]
  README.md → frontend/package.json
- `SkillSphere Project README` --references--> `SkillSphere Architecture Diagram`  [EXTRACTED]
  README.md → readme-assets/architecture.jpeg
- `SkillSphere Project README` --references--> `SkillSphere Demo Screenshot`  [EXTRACTED]
  README.md → readme-assets/skillsphere-screenshot.png
- `SkillSphere Dashboard Screenshot (Frontend README)` --powered_by--> `Google Gemini AI`  [EXTRACTED]
  frontend/readme-assets/dashboard.png → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **SkillSphere Core Tech Stack** — skillsphere_app, next_js, typescript, tailwind_css, firebase_authentication, next_js_api_routes, google_gemini_1_5_flash, vercel [EXTRACTED 1.00]
- **SkillSphere Application Data Flow** — next_js_frontend, next_js_api_routes, google_gemini_ai, firebase_authentication [EXTRACTED 1.00]
- **Resume Data Management Principles** — agents_agents_md, unified_user_profile, resume_upload_flow, updated_resume_flow, parsing_pipeline, context_builder [EXTRACTED 1.00]
- **SkillSphere Architecture Components** — users_browser, vercel_platform, nextjs_frontend, nextjs_api_routes, firebase_auth, google_gemini_ai [EXTRACTED 1.00]
- **Career Path Comparison Details** — ai_machine_learning_engineer, data_scientist, full_stack_web_developer, python, sql, javascript, react, nodejs [EXTRACTED 1.00]
- **Dashboard Personalized Recommendation Inputs** — academic_stream_computer_science, python, javascript, sql, ai_ethics, open_source, google_gemini_ai [EXTRACTED 1.00]

## Communities (85 total, 19 thin omitted)

### Community 0 - "Profile Aggregator Providers"
Cohesion: 0.05
Nodes (65): POST(), analyzeSkillGap(), CAREER_ARCHETYPES, CAREER_CATALOG, CareerRequirement, findUserSkillConfidence(), resolveConfidence(), toStatus() (+57 more)

### Community 1 - "Career Recommendation Engines"
Cohesion: 0.07
Nodes (62): GET(), POST(), GET(), GET(), GET(), GET(), AI_ML_KEYWORDS, BACKEND_KEYWORDS (+54 more)

### Community 2 - "Enterprise Platform Services"
Cohesion: 0.07
Nodes (38): GET(), POST(), GET(), POST(), GET(), POST(), GET(), POST() (+30 more)

### Community 3 - "UI Charts & Visualizations"
Cohesion: 0.05
Nodes (28): CF_RANK_COLORS, getRankColor(), getTimeAgo(), Handles, LANG_COLORS, PlatformStatus, ProfileIntelligenceContent(), SyncState (+20 more)

### Community 4 - "Ecosystem Infrastructure"
Cohesion: 0.09
Nodes (28): GET(), GET(), GET(), POST(), GET(), POST(), GET(), POST() (+20 more)

### Community 5 - "Ecosystem Candidate Ranking"
Cohesion: 0.09
Nodes (33): GET(), GET(), GET(), POST(), DEFAULT_PLAN, GET(), POST(), calculateRankScore() (+25 more)

### Community 6 - "AI Copilot Core System"
Cohesion: 0.11
Nodes (26): GET(), GET(), POST(), buildCopilotContext(), getOrCreateSession(), getUserSessions(), saveSessionMessages(), runCopilotConversation() (+18 more)

### Community 7 - "Intelligence Platform Metrics"
Cohesion: 0.09
Nodes (23): GET(), GET(), POST(), POST(), getTelemetryEvents(), logTelemetryEvent(), DEFAULT_EXPERIMENTS, DEFAULT_FLAGS (+15 more)

### Community 8 - "Financial & Billing Services"
Cohesion: 0.10
Nodes (22): GET(), POST(), GET(), POST(), GET(), DEFAULT_SUB, executeUpgradeCheckout(), getUserSubscription() (+14 more)

### Community 9 - "AI Context & Memory Orchestrator"
Cohesion: 0.09
Nodes (17): aiOrchestrator, ToolRegistry, budgetManager, contextEngine, memoryManager, RankableContext, rankingEngine, Agent (+9 more)

### Community 10 - "Workspace Security & Hardening"
Cohesion: 0.19
Nodes (15): globalRateLimiter, RateLimiter, chatbotSchema, compareCareersSchema, generateRecommendationsSchema, interviewPrepSchema, projectGeneratorSchema, resumeAnalyzerSchema (+7 more)

### Community 11 - "User Onboarding Flows"
Cohesion: 0.13
Nodes (26): POST(), DEFAULT_BLUEPRINT, POST(), GET(), GET(), POST(), POST(), DELETE() (+18 more)

### Community 12 - "Workspace Automation & Predictions"
Cohesion: 0.12
Nodes (20): GET(), POST(), GET(), GET(), POST(), DEFAULT_WORKFLOWS, getUserWorkflows(), runAutomationWorkflow() (+12 more)

### Community 13 - "TypeScript Settings"
Cohesion: 0.07
Nodes (29): compilerOptions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx, lib (+21 more)

### Community 14 - "Auth & Core Layout Components"
Cohesion: 0.12
Nodes (13): metadata, Home(), Chatbot(), Message, Auth(), Header(), HeaderProps, LayoutClient() (+5 more)

### Community 15 - "Lib Module"
Cohesion: 0.14
Nodes (17): DEFAULT_PORTFOLIO_REVIEW, DEFAULT_RESUME_REVIEW, POST(), blockGemini(), blockNvidia(), getDocRef(), getLimitStatus(), isGeminiBlocked() (+9 more)

### Community 16 - "Services Integrations Module"
Cohesion: 0.17
Nodes (17): GET(), POST(), GET(), POST(), DEFAULT_WORKSPACE_WORKFLOWS, getWorkspaceWorkflows(), saveWorkspaceWorkflow(), triggerIntegrationWorkflows() (+9 more)

### Community 17 - "Package Config"
Cohesion: 0.09
Nodes (23): eslint, eslint-config-next, @eslint/eslintrc, devDependencies, eslint, eslint-config-next, @eslint/eslintrc, jest-environment-jsdom (+15 more)

### Community 18 - "Package Config"
Cohesion: 0.09
Nodes (23): firebase, framer-motion, dependencies, firebase, framer-motion, @google/generative-ai, @heroicons/react, lucide-react (+15 more)

### Community 19 - "Frontend Components"
Cohesion: 0.16
Nodes (20): AggregatorIcon(), BillingIcon(), CompareIcon(), CopilotIcon(), DashboardIcon(), EcosystemIcon(), EnterpriseIcon(), formatRelativeTime() (+12 more)

### Community 20 - "User Onboarding"
Cohesion: 0.13
Nodes (12): DashboardContent(), CareerStatusData, CurrentCareerCardProps, ProfileReview(), ProfileReviewProps, ResumeUploader(), ResumeUploaderProps, WelcomeCard() (+4 more)

### Community 21 - "Frontend Components"
Cohesion: 0.12
Nodes (11): SessionData, CareerCard(), CareerCardProps, CompareDrawerProps, ComparisonTableProps, TableRow, ComparisonViewProps, AnalyticsSection() (+3 more)

### Community 22 - "AI Copilot System"
Cohesion: 0.20
Nodes (16): GET(), GET(), getStartOfWeekString(), DELETE(), GET(), PATCH(), POST(), admin (+8 more)

### Community 23 - "Frontend Components"
Cohesion: 0.12
Nodes (11): HistoryContent(), HistoryItem, QuizStep, ProtectedRoute(), POPULAR_SKILLS, SkillItem, TagInput(), TagInputProps (+3 more)

### Community 24 - "App Dashboard Compare Module"
Cohesion: 0.13
Nodes (8): ChartMetric, CompareContent(), CompareData, TableRow, ResumeHelperContent(), SimpleCaptchaProps, useAuth, useCaptcha()

### Community 25 - "Types Module"
Cohesion: 0.12
Nodes (17): graphEngine, CareerBlueprint, CareerGoals, CareerHealthMetric, CareerKnowledgeGraph, EducationEntry, ExperienceEntry, GraphNode (+9 more)

### Community 26 - "User Onboarding"
Cohesion: 0.23
Nodes (11): CONFIDENCE_THRESHOLDS, confidenceEngine, profileBuilder, CompletenessResult, profileCompleteness, profileMemory, UnifiedProfileFieldMetadata, UnifiedUserProfile (+3 more)

### Community 27 - "Comparison Config"
Cohesion: 0.11
Nodes (18): AI/Machine Learning Engineer, Amazon India, AWS, Cloudera, Data Scientist, Career Path Comparison UI, Full-Stack Web Developer, Google Cloud (+10 more)

### Community 28 - "Services Ai Provider Module"
Cohesion: 0.24
Nodes (5): AI_CONFIG, AiProvider, DeepseekProvider, GeminiProvider, ProviderFactory

### Community 29 - "Services Ai Modules Module"
Cohesion: 0.22
Nodes (9): StandardAiResponse, ChatbotAi, getFallbackChatResponse(), getFallbackEvaluation(), getFallbackQuestions(), InterviewAi, getChatbotPrompt(), getInterviewEvaluationPrompt() (+1 more)

### Community 30 - "Lib Module"
Cohesion: 0.15
Nodes (5): CacheStore, MemoryCacheStore, getFallbackProjects(), ProjectAi, getProjectGenerationPrompt()

### Community 31 - "Services Ai Modules Module"
Cohesion: 0.27
Nodes (12): getFallbackArtifacts(), getFallbackMatchReport(), JobAi, summarizeProfile(), jobIntelligenceEngine, JobIntelligenceResult, DEFAULT_JOB_DESCRIPTION, normalizeJobDescription() (+4 more)

### Community 32 - "App Interview-Prep Module"
Cohesion: 0.13
Nodes (8): TabType, ResumeAnalyzerContent(), ScoreGaugeProps, FileUpload(), FileUploadProps, InterviewFeedback, InterviewQuestion, ResumeAnalysis

### Community 33 - "  Home Orion Projects Skillsphere Module"
Cohesion: 0.16
Nodes (15): Docker Compose Configuration, Firebase Client Credentials Environment Variables, Frontend Dockerfile, typescript, Next.js Logo SVG, SkillSphere Demo Screenshot (Frontend README), SkillSphere Frontend README, GEMINI_API_KEY Environment Variable (+7 more)

### Community 34 - "Services Integrations Module"
Cohesion: 0.22
Nodes (10): GET(), POST(), WorkspaceDashboardContent(), DEFAULT_PREP, generateEventPrepChecklist(), getUserCalendarEvents(), CalendarEvent, ConnectedAccount (+2 more)

### Community 35 - "Services Intelligence Module"
Cohesion: 0.33
Nodes (14): clamp(), computeCareerReadinessScore(), scoreCommunication(), scoreCP(), scoreInterviewReadiness(), scoreLearningConsistency(), scoreOpenSource(), scorePortfolio() (+6 more)

### Community 36 - "Readme Config"
Cohesion: 0.14
Nodes (14): Frontend Directory, Next.js Configuration, Project Dependencies (package.json), Compare Careers API Route, src/app/api Directory (Backend API Routes), Generate Recommendations API Route, Resume Helper API Route, Main Application Layout (+6 more)

### Community 37 - "App Dashboard Results Module"
Cohesion: 0.20
Nodes (6): getFallbackSkillGap(), ResultsContent(), SmartQuestionWidget(), SmartQuestionWidgetProps, auth, firebaseConfig

### Community 38 - "App Job-Intelligence Module"
Cohesion: 0.19
Nodes (9): InputTab, JobIntelligenceContent(), PageTab, recommendationConfig(), scoreColor(), ScoreRing(), statusConfig(), STEPS (+1 more)

### Community 39 - "  Home Orion Projects Skillsphere Module"
Cohesion: 0.19
Nodes (13): AI-Powered Career Recommendations Feature, AI Resume Co-Pilot Feature, Firebase Authentication, SkillSphere Logo, Fully Responsive UI Feature, Google Gemini 1.5 Flash AI Model, Interactive Career Comparison Feature, Next.js API Routes (Serverless Functions) (+5 more)

### Community 40 - "Dashboard Config"
Cohesion: 0.17
Nodes (12): Academic Stream: Computer Science, AI Ethics, AI Resume Co-Pilot Feature, Dashboard Feature, SkillSphere Dashboard Screenshot (Frontend README), History Feature, JavaScript, Open Source (+4 more)

### Community 41 - "Profile Config"
Cohesion: 0.17
Nodes (10): careerGoalsSchema, careerHealthMetricSchema, educationEntrySchema, experienceEntrySchema, metadataFieldSchema, personalInfoSchema, platformConnectionSchema, projectEntrySchema (+2 more)

### Community 42 - "  Home Orion Projects Skillsphere Module"
Cohesion: 0.47
Nodes (11): Backend Logic (API Route), Firebase Auth, Architecture Diagram, Architecture Diagram (Authentication Context), Google Gemini AI, Next.js API Routes (Backend Logic), Next.js Frontend (React Components), React Components (+3 more)

### Community 43 - "App Profile Module"
Cohesion: 0.24
Nodes (10): calculateCompleteness(), defaultAchievements, defaultProfile, ExtendedUserProfile, getInitials(), ProfilePage(), streamOptions, yearOptions (+2 more)

### Community 44 - "Integration Providers"
Cohesion: 0.25
Nodes (6): createJobProvider(), IJobProvider, PdfJobProvider, stripHtml(), TextJobProvider, UrlJobProvider

### Community 45 - "Services Events Module"
Cohesion: 0.22
Nodes (5): EventBus, EventCallback, eventStore, ProfileEvent, ProfileEventType

### Community 46 - "Job Config"
Cohesion: 0.20
Nodes (9): ApplicationRecommendation, InterviewRoadmapItem, JobInput, JobInputSource, JobMatchScores, JobRequirement, LearningRoadmapItem, MissingSkill (+1 more)

### Community 47 - "Services Ai Modules Module"
Cohesion: 0.39
Nodes (5): CareerAi, getFallbackComparison(), getFallbackRecommendations(), getComparisonPrompt(), getRecommendationsPrompt()

### Community 48 - "Services Ai Modules Module"
Cohesion: 0.39
Nodes (5): getFallbackQuiz(), getFallbackQuizEvaluation(), QuizAi, getQuizEvaluationPrompt(), getQuizGenerationPrompt()

### Community 49 - "Services Ai Modules Module"
Cohesion: 0.39
Nodes (5): getFallbackResumeAnalysis(), getFallbackResumeHelperPoints(), ResumeAi, getResumeAnalyzerPrompt(), getResumeHelperPrompt()

### Community 50 - "Graphify Config"
Cohesion: 0.29
Nodes (7): Graphify 'explain' command, Graphify Agent Rules, Graphify 'path' command, Graphify 'query' command, Graphify Knowledge Graph Tool, Graphify 'update' command, Graphify Agent Workflow

### Community 51 - "Package Config"
Cohesion: 0.29
Nodes (6): jose, name, overrides, jwks-rsa, private, version

### Community 52 - "Agents Config"
Cohesion: 0.53
Nodes (6): AI and UI Rules for Agents, Context Builder, Resume Parsing Pipeline, Resume Upload Flow (First Time), Unified User Profile, Updated Resume Flow (Re-upload)

### Community 53 - "Package Config"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, test

### Community 54 - "Services Enterprise Module"
Cohesion: 0.47
Nodes (4): GET(), executeGlobalSearch(), STATIC_ENTITIES, UnifiedSearchResult

### Community 55 - "Services Ai Parser Module"
Cohesion: 0.60
Nodes (3): cleanMarkdownJson(), parseJson(), validateKeys()

### Community 56 - "Eslint Config"
Cohesion: 0.40
Nodes (4): compat, __dirname, eslintConfig, __filename

### Community 57 - "App Api Intelligence-Platform Experiments Module"
Cohesion: 0.60
Nodes (4): GET(), POST(), getAbExperiments(), logExperimentConversion()

### Community 58 - "Jest Config"
Cohesion: 0.50
Nodes (3): createJestConfig, customJestConfig, nextJest

### Community 59 - "AI Copilot System"
Cohesion: 0.83
Nodes (3): GET(), getStartOfWeekString(), generateWeeklyPlan()

### Community 60 - "Index Config"
Cohesion: 0.50
Nodes (3): ACADEMIC_STREAMS, CHART_COLORS, CURRENT_STATUS_OPTIONS

### Community 61 - "Package Config"
Cohesion: 0.50
Nodes (3): dependencies, firebase-admin, firebase-admin

## Knowledge Gaps
- **289 isolated node(s):** `__filename`, `__dirname`, `compat`, `eslintConfig`, `nextJest` (+284 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `verifyAuth()` connect `Ecosystem Infrastructure` to `Profile Aggregator Providers`, `Career Recommendation Engines`, `Enterprise Platform Services`, `Services Integrations Module`, `Ecosystem Candidate Ranking`, `AI Copilot Core System`, `Intelligence Platform Metrics`, `Financial & Billing Services`, `Workspace Security & Hardening`, `User Onboarding Flows`, `Workspace Automation & Predictions`, `Lib Module`, `Services Integrations Module`, `AI Copilot System`, `Services Enterprise Module`, `App Api Intelligence-Platform Experiments Module`, `AI Copilot System`, `App Api Intelligence Reports Module`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Why does `logger` connect `Workspace Security & Hardening` to `Profile Aggregator Providers`, `Career Recommendation Engines`, `Enterprise Platform Services`, `UI Charts & Visualizations`, `Ecosystem Infrastructure`, `Ecosystem Candidate Ranking`, `AI Copilot Core System`, `Intelligence Platform Metrics`, `Financial & Billing Services`, `AI Context & Memory Orchestrator`, `User Onboarding Flows`, `Workspace Automation & Predictions`, `Lib Module`, `Services Integrations Module`, `User Onboarding`, `AI Copilot System`, `Types Module`, `User Onboarding`, `Services Ai Provider Module`, `Lib Module`, `Services Ai Modules Module`, `Services Integrations Module`, `Integration Providers`, `Services Events Module`, `Services Ai Modules Module`, `Services Ai Modules Module`, `Services Ai Modules Module`, `Services Enterprise Module`, `App Api Intelligence-Platform Experiments Module`, `AI Copilot System`, `App Api Intelligence Reports Module`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Why does `MemoryCacheStore` connect `Lib Module` to `Workspace Security & Hardening`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `__filename`, `__dirname`, `compat` to the rest of the system?**
  _289 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Profile Aggregator Providers` be split into smaller, more focused modules?**
  _Cohesion score 0.05025712949976625 - nodes in this community are weakly interconnected._
- **Should `Career Recommendation Engines` be split into smaller, more focused modules?**
  _Cohesion score 0.07140758154569497 - nodes in this community are weakly interconnected._
- **Should `Enterprise Platform Services` be split into smaller, more focused modules?**
  _Cohesion score 0.0746606334841629 - nodes in this community are weakly interconnected._