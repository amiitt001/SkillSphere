# Graph Report - SkillSphere  (2026-07-20)

## Corpus Check
- 339 files · ~310,666 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1734 nodes · 4163 edges · 99 communities (80 shown, 19 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.55)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8d354e12`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

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
- route.ts
- ComparisonTable.tsx
- githubProvider.ts
- route.ts
- route.ts
- route.ts
- route.ts
- route.ts
- route.ts
- firebase
- react-dom
- jest-environment-jsdom
- @types/jest
- @types/react-dom

## God Nodes (most connected - your core abstractions)
1. `verifyAuth()` - 181 edges
2. `logger` - 100 edges
3. `errorResponse()` - 46 edges
4. `successResponse()` - 42 edges
5. `useAuth()` - 38 edges
6. `auth` - 27 edges
7. `StandardAiResponse` - 25 edges
8. `ProtectedRoute()` - 23 edges
9. `AiService` - 21 edges
10. `Career Path Comparison UI` - 21 edges

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

## Communities (99 total, 19 thin omitted)

### Community 0 - "Profile Aggregator Providers"
Cohesion: 0.15
Nodes (16): FetchAllResult, providerRegistry, CodeforcesProvider, fetchJson(), getHeaders(), GitHubProvider, LinkedInProvider, ProfileFetchError (+8 more)

### Community 1 - "Career Recommendation Engines"
Cohesion: 0.10
Nodes (45): GET(), POST(), GET(), GET(), GET(), GET(), AiInsightPanelProps, priorityConfig (+37 more)

### Community 2 - "Enterprise Platform Services"
Cohesion: 0.26
Nodes (9): EnterprisePlatformContent(), Locale, translate(), TRANSLATIONS, ComplianceAuditLog, DeveloperApiKey, MarketplacePlugin, OrganizationDetails (+1 more)

### Community 3 - "UI Charts & Visualizations"
Cohesion: 0.06
Nodes (24): CF_RANK_COLORS, getRankColor(), getTimeAgo(), Handles, LANG_COLORS, PlatformStatus, ProfileIntelligenceContent(), SyncState (+16 more)

### Community 4 - "Ecosystem Infrastructure"
Cohesion: 0.42
Nodes (6): GET(), GET(), getStartOfWeekString(), buildCopilotContext(), generateDailyBrief(), generateWeeklyPlan()

### Community 5 - "Ecosystem Candidate Ranking"
Cohesion: 0.09
Nodes (33): GET(), GET(), GET(), POST(), DEFAULT_PLAN, GET(), POST(), calculateRankScore() (+25 more)

### Community 6 - "AI Copilot Core System"
Cohesion: 0.12
Nodes (24): GET(), POST(), getOrCreateSession(), getUserSessions(), saveSessionMessages(), runCopilotConversation(), SYSTEM_INSTRUCTIONS, DEFAULT_MEMORY (+16 more)

### Community 7 - "Intelligence Platform Metrics"
Cohesion: 0.10
Nodes (21): GET(), GET(), POST(), getTelemetryEvents(), DEFAULT_EXPERIMENTS, DEFAULT_FLAGS, getFeatureFlags(), isFeatureEnabled() (+13 more)

### Community 8 - "Financial & Billing Services"
Cohesion: 0.17
Nodes (12): GET(), GET(), GET(), DEFAULT_SUB, getUserInvoices(), getUserSubscription(), CheckoutSessionDetails, SubscriptionPlanId (+4 more)

### Community 9 - "AI Context & Memory Orchestrator"
Cohesion: 0.06
Nodes (22): AIOrchestrator, IAIOrchestrator, ContextBuilder, IContextBuilder, IModelRouter, IPromptBuilder, PromptBuilder, budgetManager (+14 more)

### Community 10 - "Workspace Security & Hardening"
Cohesion: 0.17
Nodes (16): schema, globalRateLimiter, RateLimiter, chatbotSchema, compareCareersSchema, generateRecommendationsSchema, interviewPrepSchema, projectGeneratorSchema (+8 more)

### Community 11 - "User Onboarding Flows"
Cohesion: 0.09
Nodes (42): POST(), schema, POST(), POST(), schema, POST(), DEFAULT_BLUEPRINT, POST() (+34 more)

### Community 12 - "Workspace Automation & Predictions"
Cohesion: 0.12
Nodes (19): GET(), POST(), GET(), POST(), DEFAULT_WORKFLOWS, getUserWorkflows(), runAutomationWorkflow(), saveUserWorkflow() (+11 more)

### Community 13 - "TypeScript Settings"
Cohesion: 0.06
Nodes (30): compilerOptions, allowJs, baseUrl, esModuleInterop, ignoreDeprecations, incremental, isolatedModules, jsx (+22 more)

### Community 14 - "Auth & Core Layout Components"
Cohesion: 0.10
Nodes (12): metadata, Chatbot(), Message, Auth(), Header(), HeaderProps, LayoutClient(), useAuthMock (+4 more)

### Community 15 - "Lib Module"
Cohesion: 0.11
Nodes (18): AI_CONFIG, blockGemini(), blockNvidia(), getDocRef(), getLimitStatus(), isGeminiBlocked(), isNvidiaBlocked(), LimitStatus (+10 more)

### Community 16 - "Services Integrations Module"
Cohesion: 0.11
Nodes (24): GET(), POST(), GET(), POST(), WorkspaceDashboardContent(), DEFAULT_WORKSPACE_WORKFLOWS, getWorkspaceWorkflows(), triggerIntegrationWorkflows() (+16 more)

### Community 17 - "Package Config"
Cohesion: 0.09
Nodes (23): eslint, eslint-config-next, @eslint/eslintrc, devDependencies, eslint, eslint-config-next, @eslint/eslintrc, jest (+15 more)

### Community 18 - "Package Config"
Cohesion: 0.09
Nodes (23): framer-motion, dependencies, firebase-admin, framer-motion, @google/generative-ai, @heroicons/react, lucide-react, mammoth (+15 more)

### Community 19 - "Frontend Components"
Cohesion: 0.16
Nodes (20): AggregatorIcon(), BillingIcon(), CompareIcon(), CopilotIcon(), DashboardIcon(), EcosystemIcon(), EnterpriseIcon(), formatRelativeTime() (+12 more)

### Community 20 - "User Onboarding"
Cohesion: 0.11
Nodes (13): CareerStatusData, CurrentCareerCardProps, ProfileReview(), ProfileReviewProps, ResumeUploader(), ResumeUploaderProps, SmartQuestionWidget(), SmartQuestionWidgetProps (+5 more)

### Community 21 - "Frontend Components"
Cohesion: 0.07
Nodes (32): TabType, analyzeSkillGap(), CAREER_ARCHETYPES, CAREER_CATALOG, CareerRequirement, findUserSkillConfidence(), resolveConfidence(), toStatus() (+24 more)

### Community 22 - "AI Copilot System"
Cohesion: 0.26
Nodes (13): GET(), getStartOfWeekString(), DELETE(), GET(), PATCH(), POST(), DEFAULT_STEPS, deleteUserTask() (+5 more)

### Community 23 - "Frontend Components"
Cohesion: 0.10
Nodes (17): ChartMetric, CompareContent(), CompareData, TableRow, DashboardContent(), HistoryContent(), HistoryItem, Home() (+9 more)

### Community 24 - "App Dashboard Compare Module"
Cohesion: 0.07
Nodes (46): pdf-parse, ResumeIntelligenceBuilder, ProfileCompleteness, DOMAIN_KEYWORDS, parseDateObject(), PROGRAMMING_LANGUAGES, ResumeEnricher, RawAIAchievements (+38 more)

### Community 25 - "Types Module"
Cohesion: 0.12
Nodes (17): graphEngine, CareerBlueprint, CareerGoals, CareerHealthMetric, CareerKnowledgeGraph, EducationEntry, ExperienceEntry, GraphNode (+9 more)

### Community 26 - "User Onboarding"
Cohesion: 0.06
Nodes (24): CONFIDENCE_THRESHOLDS, confidenceEngine, profileBuilder, CompletenessResult, profileCompleteness, profileMemory, UnifiedProfileFieldMetadata, UnifiedUserProfile (+16 more)

### Community 27 - "Comparison Config"
Cohesion: 0.11
Nodes (18): AI/Machine Learning Engineer, Amazon India, AWS, Cloudera, Data Scientist, Career Path Comparison UI, Full-Stack Web Developer, Google Cloud (+10 more)

### Community 28 - "Services Ai Provider Module"
Cohesion: 0.18
Nodes (7): DecodedIdToken, AuthorizationService, IAuthorizationService, IPermissionService, PermissionService, ISessionService, SessionService

### Community 29 - "Services Ai Modules Module"
Cohesion: 0.09
Nodes (25): DEFAULT_JOB_DESCRIPTION, StandardAiResponse, ChatbotAi, getFallbackChatResponse(), getFallbackEvaluation(), getFallbackQuestions(), InterviewAi, getFallbackProjects() (+17 more)

### Community 30 - "Lib Module"
Cohesion: 0.06
Nodes (25): POST(), GET(), GET(), GET(), POST(), GET(), POST(), GET() (+17 more)

### Community 31 - "Services Ai Modules Module"
Cohesion: 0.31
Nodes (11): jobIntelligenceEngine, JobIntelligenceResult, normalizeJobDescription(), getFallbackArtifacts(), getFallbackMatchReport(), JobAi, summarizeProfile(), JobArtifacts (+3 more)

### Community 32 - "App Interview-Prep Module"
Cohesion: 0.12
Nodes (10): QuizStep, POPULAR_SKILLS, SkillItem, TagInput(), TagInputProps, auth, firebaseConfig, GeneratedProject (+2 more)

### Community 33 - "  Home Orion Projects Skillsphere Module"
Cohesion: 0.16
Nodes (15): Docker Compose Configuration, Firebase Client Credentials Environment Variables, Frontend Dockerfile, typescript, Next.js Logo SVG, SkillSphere Demo Screenshot (Frontend README), SkillSphere Frontend README, GEMINI_API_KEY Environment Variable (+7 more)

### Community 34 - "Services Integrations Module"
Cohesion: 0.22
Nodes (8): GET(), getBusinessFinancials(), MOCK_FINANCIALS, BillingInvoice, BusinessFinancials, UsageQuotaItem, UsageQuotas, UserSubscription

### Community 35 - "Services Intelligence Module"
Cohesion: 0.37
Nodes (13): clamp(), computeCareerReadinessScore(), scoreCommunication(), scoreCP(), scoreInterviewReadiness(), scoreLearningConsistency(), scoreOpenSource(), scorePortfolio() (+5 more)

### Community 36 - "Readme Config"
Cohesion: 0.14
Nodes (14): Frontend Directory, Next.js Configuration, Project Dependencies (package.json), Compare Careers API Route, src/app/api Directory (Backend API Routes), Generate Recommendations API Route, Resume Helper API Route, Main Application Layout (+6 more)

### Community 37 - "App Dashboard Results Module"
Cohesion: 0.13
Nodes (38): generateAchievementsRecommendations(), generateCompatibilityRecommendations(), generateCompletenessRecommendations(), generateExperienceRecommendations(), generateIndustryRecommendations(), generateJobMatchRecommendations(), generateProjectRecommendations(), generateSkillsRecommendations() (+30 more)

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
Cohesion: 0.19
Nodes (19): POST(), extractFrameworks(), extractSkillsFromTopics(), FRAMEWORK_KEYWORDS, normalizeProfile(), clamp(), computeActivityScore(), computeCPScore() (+11 more)

### Community 45 - "Services Events Module"
Cohesion: 0.08
Nodes (34): ACHIEVEMENT_TYPE_PATTERNS, BUSINESS_IMPACT_SIGNALS, COMPLEXITY_SIGNALS, CURRENT_YEAR, DEGREE_PATTERNS, detectAchievementType(), detectFormattingIssues(), detectSections() (+26 more)

### Community 46 - "Job Config"
Cohesion: 0.13
Nodes (24): ATSIntelligencePlatformContent(), CategoryBar, CategoryBarRow(), getDifficultyBadge(), getGradeColor(), getPriorityColor(), getScoreSegmentColor(), Phase (+16 more)

### Community 47 - "Services Ai Modules Module"
Cohesion: 0.20
Nodes (24): clamp(), computeJobMatchScore(), CULTURE_SIGNAL_KEYWORDS, DEGREE_LEVELS, getDegreeLevel(), gradeFromScore(), JobMatchATSEngine, LEADERSHIP_KEYWORDS_JM (+16 more)

### Community 48 - "Services Ai Modules Module"
Cohesion: 0.25
Nodes (6): createJobProvider(), IJobProvider, PdfJobProvider, stripHtml(), TextJobProvider, UrlJobProvider

### Community 49 - "Services Ai Modules Module"
Cohesion: 0.16
Nodes (7): eventStore, eventBus, EventCallback, IEventBus, LocalEventBus, ProfileEvent, ProfileEventType

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
Cohesion: 0.14
Nodes (21): COMPANY_PATTERNS, CULTURAL_KEYWORDS, detectIndustry(), extractCertifications(), extractCompany(), extractCulturalKeywords(), extractEducationRequirements(), extractExperienceYears() (+13 more)

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
Cohesion: 0.19
Nodes (19): ALWAYS_KEEP_PATTERNS, analyzeKeywordDensity(), countOccurrences(), extractCandidates(), extractJobKeywords(), extractKeywords(), HEADING_PATTERNS, isAlwaysKeep() (+11 more)

### Community 60 - "Index Config"
Cohesion: 0.50
Nodes (3): ACADEMIC_STREAMS, CHART_COLORS, CURRENT_STATUS_OPTIONS

### Community 61 - "Package Config"
Cohesion: 0.50
Nodes (3): dependencies, firebase-admin, firebase-admin

### Community 63 - "App Api Intelligence Reports Module"
Cohesion: 0.18
Nodes (13): CareerAi, CareerRecommendationContext, CareerTheme, computeCareerProfileHash(), createRecommendation(), detectCareerTheme(), getFallbackComparison(), getFallbackRecommendations() (+5 more)

### Community 64 - "Frontend Components"
Cohesion: 0.12
Nodes (18): AI_ML_KEYWORDS, BACKEND_KEYWORDS, buildSkillGraph(), CATEGORY_MAP, classifySkill(), CLOUD_KEYWORDS, confidenceFromSources(), DATABASE_KEYWORDS (+10 more)

### Community 67 - "Package Config"
Cohesion: 0.36
Nodes (8): POST(), GET(), POST(), executeUpgradeCheckout(), eraseUserDataRecord(), exportUserDataPackage(), getComplianceAuditLogs(), logComplianceAudit()

### Community 69 - "Package Config"
Cohesion: 0.52
Nodes (4): POST(), getProfileAnalysisPrompt(), analyzeProfile(), getFallbackAnalysis()

### Community 70 - "Package Config"
Cohesion: 0.20
Nodes (9): InterviewRoadmapItem, JobInput, JobInputSource, JobMatchScores, JobRequirement, LearningRoadmapItem, MissingSkill, ResumeImprovement (+1 more)

### Community 72 - "Package Config"
Cohesion: 0.36
Nodes (7): GET(), POST(), DEFAULT_BILLING, getUserBilling(), PLAN_PRICING, updateBillingPlan(), BillingPlanTier

### Community 85 - "route.ts"
Cohesion: 0.54
Nodes (6): GET(), POST(), addOrganizationDepartment(), DEFAULT_ORG, getOrganization(), updateOrganizationSeats()

### Community 86 - "ComparisonTable.tsx"
Cohesion: 0.11
Nodes (14): getFallbackSkillGap(), ResultsContent(), SessionData, CareerCard(), CareerCardProps, CompareDrawerProps, ComparisonTableProps, TableRow (+6 more)

### Community 87 - "githubProvider.ts"
Cohesion: 0.57
Nodes (5): GET(), POST(), generateDeveloperKey(), getDeveloperKeys(), revokeDeveloperKey()

### Community 88 - "route.ts"
Cohesion: 0.52
Nodes (5): GET(), POST(), getMarketplacePlugins(), MARKETPLACE_CATALOG, togglePluginInstallation()

### Community 90 - "route.ts"
Cohesion: 0.47
Nodes (4): GET(), AutonomousCoachBrief, DEFAULT_COACH_BRIEF, getAutonomousCoachBrief()

### Community 91 - "route.ts"
Cohesion: 0.50
Nodes (3): DEFAULT_PORTFOLIO_REVIEW, DEFAULT_RESUME_REVIEW, POST()

### Community 92 - "route.ts"
Cohesion: 0.67
Nodes (3): GET(), POST(), saveWorkspaceWorkflow()

### Community 93 - "route.ts"
Cohesion: 0.67
Nodes (3): GET(), POST(), saveFeatureFlag()

## Knowledge Gaps
- **344 isolated node(s):** `__filename`, `__dirname`, `compat`, `eslintConfig`, `nextJest` (+339 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `logger` connect `Workspace Security & Hardening` to `Profile Aggregator Providers`, `Career Recommendation Engines`, `Ecosystem Infrastructure`, `Ecosystem Candidate Ranking`, `AI Copilot Core System`, `Intelligence Platform Metrics`, `Financial & Billing Services`, `AI Context & Memory Orchestrator`, `User Onboarding Flows`, `Workspace Automation & Predictions`, `Lib Module`, `Services Integrations Module`, `User Onboarding`, `AI Copilot System`, `App Dashboard Compare Module`, `Types Module`, `User Onboarding`, `Services Ai Modules Module`, `Lib Module`, `Services Ai Modules Module`, `Services Integrations Module`, `Integration Providers`, `Job Config`, `Services Ai Modules Module`, `Services Ai Modules Module`, `Services Enterprise Module`, `App Api Intelligence-Platform Experiments Module`, `App Api Intelligence Reports Module`, `Package Config`, `Package Config`, `Package Config`, `route.ts`, `githubProvider.ts`, `route.ts`, `route.ts`, `route.ts`, `route.ts`, `route.ts`?**
  _High betweenness centrality (0.185) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Package Config` to `Package Config`, `Package Config`, `App Dashboard Compare Module`, `firebase`, `react-dom`?**
  _High betweenness centrality (0.152) - this node is a cross-community bridge._
- **What connects `__filename`, `__dirname`, `compat` to the rest of the system?**
  _344 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Career Recommendation Engines` be split into smaller, more focused modules?**
  _Cohesion score 0.09769335142469471 - nodes in this community are weakly interconnected._
- **Should `UI Charts & Visualizations` be split into smaller, more focused modules?**
  _Cohesion score 0.05537098560354374 - nodes in this community are weakly interconnected._
- **Should `Ecosystem Candidate Ranking` be split into smaller, more focused modules?**
  _Cohesion score 0.08686868686868687 - nodes in this community are weakly interconnected._
- **Should `AI Copilot Core System` be split into smaller, more focused modules?**
  _Cohesion score 0.12100840336134454 - nodes in this community are weakly interconnected._