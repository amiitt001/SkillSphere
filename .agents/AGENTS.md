# Workspace Specific AI and UI Rules

## Resume Data Handling Core Principle
- **Artifact Only:** The uploaded resume file is an onboarding and versioning artifact, **NOT** the runtime data source.
- **Normalized Profile:** Once parsed and approved by the user, all extracted data is normalized into a single, canonical `Unified User Profile` document.
- **Single Source of Truth:** This Unified User Profile is the source of truth for every feature going forward. No feature may re-read or re-parse the raw resume file during normal operation.

---

## 1. Resume Upload Flow (First Time)
- **Initial Button Label:** Show button labeled `"Upload Resume"`.
- **Supporting Text:** *"Upload your resume to automatically build your profile."*
- **Parsing Pipeline:** On upload, extract text → AI-parse into structured resume JSON → assign a confidence score per field → draft a Unified User Profile.
- **Review Draft Step:** Show the draft to the user for review and edits before saving.
- **On Approval Actions:**
  - Save as the Unified User Profile (permanent record in Firestore).
  - Store the original resume metadata/file as `"Version 1"` (for history, download, or comparison only).
  - Change the button label to: `"Upload Updated Resume"` (never revert to `"Upload Resume"` again).
  - Show status verification line: `✓ Resume uploaded: [filename] — using this profile across the platform`.

---

## 2. Single Source of Truth Rule
- **No Raw Reads:** After a profile exists, **NO** feature (including resume scan, ATS analysis, job/internship matching, cover letter generation, LinkedIn optimizer, interview prep, skill gap analysis, career recommendations, dashboard, chat, etc.) may read or parse the raw resume file directly.
- **Shared Context Builder:** All features must query data only from the `Unified User Profile` via the Context Builder.
- **Single Parsing Pipeline:** No feature implements its own resume-parsing logic. All parsing goes through one shared pipeline.

---

## 3. Updated Resume Flow (Re-upload)
- **Active Button Label:** Once a profile exists, the upload action button must always read `"Upload Updated Resume"`.
- **Re-upload Actions:**
  - Extract and parse the new resume.
  - Compare the parsed data against the existing profile (new/removed skills, updated experience, education changes, new certifications/projects).
  - Show the user a change summary — **do NOT auto-overwrite existing values**.
  - On user approval: update the Unified User Profile, save the new file as the next version (retaining prior versions), and refresh dependent modules (career health, skill graph, job matches, learning path, interview readiness, dashboard, AI context).
  - Update status verification text: `✓ Resume updated: [new filename]`.

---

## 4. Missing Field Rule
- **Targeted Prompts:** If a feature needs data not present in the profile, ask **ONLY** for that specific missing field. Do not ask the user to re-upload or retype the whole resume.
- **Auto-Resume Original Task:** Once the user answers, save the field to the Unified User Profile and resume the original task automatically. Never ask for that field again.

---

## 5. Field Ownership & Edit Precedence
- **Tracking Parameters:** Every profile field tracks: `source`, `confidence score`, `version`, `last updated`, `verified status`, and a `user-edited` flag.
- **User Edits Precedence:** If a user manually edits a field, future resume uploads must **NEVER** silently overwrite it. Instead, suggest the change and let the user approve/reject it. User edits always win by default.

---

## 6. Session / Login Persistence
- **Permanent Records:** The Unified User Profile persists permanently across sessions and logins.
- **No Repeated Prompts:** Never ask for the resume again on return visits.
- **Upload Triggers:** Only prompt for a resume upload if no profile exists yet, or if the user explicitly chooses to upload an updated resume.

---

## 7. Prohibited Practices ("Never Do")
- **Never duplicate** resume-parsing or profile-storage logic per feature.
- **Never let** an AI module read the raw resume directly. Only the Context Builder/profile layer feeds prompt context to the LLM.
- **Never re-ask** for information already stored in the profile.
- **Never auto-overwrite** user-confirmed data without approval.
- **Never revert** the upload button label back to `"Upload Resume"` once a profile exists.
