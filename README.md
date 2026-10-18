# AKMA PH - Adaptive Knowledge and Mastery Assessment Philippines

An AI-powered adaptive learning and authentic assessment platform purpose-built for Philippine Higher Education and basic education institutions using `.edu.ph` Google Workspace accounts. Powered by Google Gemini 3.6 Flash, Google Cloud Firestore, and Firebase Authentication. Registration and access are strictly restricted to Philippine `.edu.ph` academic accounts and designated super administrator `eric.emberda@gmail.com`.

---

## Architecture & System Flow

```
[ Philippine Educators & Students (.edu.ph) / Super Admin ]
                       │
                       ▼ Google SSO (Firebase Auth)
         [ React 19 Frontend + Tailwind CSS ]
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
[ Cloud Firestore ]        [ Node.js/Express Proxy API ]
(User-isolated ABAC         (Server-side Gemini 3.6 Flash
 security rules)             with resilient fallback ladder)
```

### Role-Based Access Control (RBAC) Matrix

1. **Super Administrator (`eric.emberda@gmail.com`)**:
   - Centralized prompt governance: Upload and version-control revised system prompts for activity generation, personalizers, AI coaches, and grading engines.
   - Cross-user telemetry auditing: Inspect real-time token consumption, request counts, role distribution, and system audit logs.
2. **Philippine Educators (`*.edu.ph`)**:
   - Author activities & authentic assessments with multi-turn Gemini curriculum brainstorming.
   - Ground activities in Bloom's Taxonomy, Constructivism, and CHED/DepEd learning competencies.
   - Maintain tenant-isolated activity and interaction histories.
   - Generate student join links and import student `.edu.ph` email rosters.
   - AI-assisted grading: Gemini evaluates student submissions against reference rubrics and calculates suggested scores.
   - Export and print comprehensive class performance reports (PDF/Print ready).
3. **Philippine Students (`*.edu.ph`)**:
   - Dynamic onboarding profile interview powered by Gemini.
   - Automated scenario personalization: Every activity is uniquely framed around the student's specific career dreams and interests so no two students have identical assessments.
   - Guided AI coaching: For non-assessment activities, Gemini acts as a cognitive coach—guiding with leading questions and hints without revealing direct answers.
   - Secure submission history and feedback archive.

---

## Security Model & Threat Countermeasures

| Threat Zone | Identified Risk | Production Defense Implemented |
| :--- | :--- | :--- |
| **Input Surfaces** | Malicious injection in student answers or educator curricula | Strict schema validation, string size clamping, and undefined stripping |
| **Planning & Reasoning** | Prompt injection attempting to bypass AI coach | System prompt containment boundaries: strict directive never to reveal answers |
| **Tool Execution** | Unauthorized administrative escalation | Server-side role check isolating Super Admin to `eric.emberda@gmail.com` |
| **Memory & State** | Cross-tenant document snooping | Owner-bound ABAC Firestore rules (`request.auth.uid == userId`) |
| **Inter-System Communication** | Gemini API key exposure | Server-side proxy with zero client-side credentials & resilient fallback ladder |

---

## Firestore Security Rules

Deployable via `DeployRules` RPC or Firebase CLI:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() { return request.auth != null; }
    function isVerified() { return isSignedIn() && request.auth.token.email_verified == true; }
    function isValidId(id) { return id is string && id.size() > 0 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$'); }
    function isAdmin() { return isVerified() && request.auth.token.email == 'eric.emberda@gmail.com'; }

    match /users/{userId} {
      allow get, list: if isVerified() && (request.auth.uid == userId || isAdmin());
      allow create, update: if isVerified() && request.auth.uid == userId;
      allow delete: if isAdmin();

      match /profile/{profileDoc} {
        allow read, write: if isVerified() && (request.auth.uid == userId || isAdmin());
      }
    }

    match /system_prompts/{promptId} {
      allow read: if isSignedIn();
      allow write: if isAdmin() && isValidId(promptId);
    }

    match /activities/{activityId} {
      allow get, list: if isVerified();
      allow create: if isVerified() && request.resource.data.educatorId == request.auth.uid;
      allow update, delete: if isVerified() && (resource.data.educatorId == request.auth.uid || isAdmin());

      match /interactions/{interactionId} {
        allow read, write: if isVerified() && (get(/databases/$(database)/documents/activities/$(activityId)).data.educatorId == request.auth.uid || isAdmin());
      }

      match /submissions/{studentId} {
        allow get, list: if isVerified() && (request.auth.uid == studentId || get(/databases/$(database)/documents/activities/$(activityId)).data.educatorId == request.auth.uid || isAdmin());
        allow create, update: if isVerified() && (request.auth.uid == studentId || get(/databases/$(database)/documents/activities/$(activityId)).data.educatorId == request.auth.uid || isAdmin());

        match /coach_chats/{chatId} {
          allow read, write: if isVerified() && (request.auth.uid == studentId || get(/databases/$(database)/documents/activities/$(activityId)).data.educatorId == request.auth.uid || isAdmin());
        }
      }
    }

    match /usage_stats/{statId} {
      allow read: if isAdmin();
      allow create: if isVerified();
    }
  }
}
```

---

## Google Cloud Secret Manager Setup

```bash
# 1. Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# 2. Create and populate the Gemini API Key secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant the Cloud Run runtime service account access
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## Cloud Run Deployment Instructions

```bash
# 1. Build and deploy containerized service
gcloud run deploy edugemini-ph \
  --source . \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --port 3000

# 2. Apply Mandatory Campaign Verification Label
gcloud run services update edugemini-ph \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=asia-southeast1
```

---

## Step-by-Step Functional Walkthrough & Test Guide

### Walkthrough 1: Super Administrator Flow
1. **Google SSO Designation**:
   - Sign in using `eric.emberda@gmail.com` or click **Super Admin Demo**.
   - Notice the amber badge indicating designated Super Administrator governance.
2. **Prompt Revision & Governance**:
   - Navigate to the **Revise AI System Prompts** section.
   - Select `educator_generator`, edit the prompt instructions, and click **Publish Revised Prompt**.
   - Verify the version increments and success toast confirms publication.
3. **Telemetry Auditing**:
   - Inspect the **Real-Time Cross-User Usage Statistics** cards (Total Tokens, AI Exchanges, Active Users, Role Breakdown).
   - Verify the **Recent User Exchanges & Ingestion Logs** table accurately shows user emails, models used, and token quantities.

### Walkthrough 2: Philippine Educator Flow
1. **Activity Creation & Reference Upload**:
   - Switch role to **Educator**.
   - Select **Activity (Guided)** or **Assessment (Graded)**.
   - Enter title, subject, and paste curriculum reference materials.
2. **Multi-Turn Gemini Brainstorming**:
   - In the right-hand panel, ask Gemini: *"Suggest 3 real-world Philippine environmental engineering scenarios aligned with Bloom's Taxonomy."*
   - Review Gemini's structured response with pedagogical bases.
   - Click **Save & Publish to Firestore**; confirm join code (e.g. `PH-XXXX`) is generated.
3. **Student Roster & Join Link**:
   - Switch to **Activities & Invitations** tab.
   - Click **Copy Link** to share `?join=CODE` with students.
   - Paste student email roster and save.
4. **AI-Suggested Grading**:
   - Switch to **Student Submissions & AI Grading** tab.
   - Click **Suggest Score with Gemini** on a student submission.
   - Inspect suggested score out of 100, strengths, growth areas, and rubric criteria breakdown.
5. **PDF / Print Performance Reports**:
   - Click **Performance Reports (PDF / Print)** tab.
   - Click **Print / Export as PDF**; confirm print preview formats cleanly without UI clutter.

### Walkthrough 3: Philippine Student Flow
1. **Adaptive Profile Setup**:
   - Switch role to **Student**.
   - Navigate to **My Adaptive Profile**.
   - Engage with the **Gemini Profile Interview Mentor** or fill in interests (e.g., Robotics) and life goals. Save profile.
2. **Join & Personalized Activity**:
   - Enter an activity Join Code in the top bar or pick an assigned activity.
   - Notice that the challenge scenario is customized to your career aspirations so no two students have the same scenario.
3. **AI Coach**:
   - In the **Personalized Workspace**, ask the AI Coach: *"How should I approach this problem?"*
   - Verify that Gemini guides you with inquiry questions without directly revealing the solution.
4. **Work Submission**:
   - Enter your response and click **Submit Work to Educator**.
   - Verify successful save in Firestore and updated status.
