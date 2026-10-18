# Security Specification & Test Protocol

## 1. Core Data Invariants
1. **Super Admin Exclusivity**: System prompts (`/system_prompts/{promptId}`) and cross-user usage stats can ONLY be written or altered by verified Super Admin `eric.emberda@gmail.com`.
2. **Educator Tenant Isolation**: Educators can only create, update, or read their own activities (`/activities/{activityId}`) and educator interactions (`/activities/{activityId}/interactions/{interactionId}`). Other educators cannot view or modify another educator's work.
3. **Student Profile Ownership**: A student can only view and update their own profile (`/users/{userId}/profile/details`).
4. **Student Activity & Submission Boundary**:
   - Students can only view activities where they are invited (either by join code or enrolled in `submissions`).
   - A student can only view and modify their own submission record (`/activities/{activityId}/submissions/{studentId}`) and Socratic coach chats (`.../coach_chats/{chatId}`).
   - The educator who owns the parent activity (`resource.data.educatorId == request.auth.uid`) has full read/grading rights over submissions to their activity.
5. **Score & Feedback Protection**: Students cannot set or manipulate `suggestedScore`, `maxScore`, or `rubricAnalysis` in their submissions.
6. **Immutable Fields**: `id`, `educatorId`, `studentId`, and `createdAt` cannot be modified after document creation.
7. **Default Deny**: All unspecified paths are closed by default.

## 2. The "Dirty Dozen" Threat Payloads
1. **Payload 1 (Privilege Escalation - Prompt Tampering)**: Non-admin student attempts `setDoc` on `/system_prompts/educator_generator` -> Expected: `PERMISSION_DENIED`.
2. **Payload 2 (Ghost Field Injection)**: Attacker injects `{ role: "superadmin" }` or `{ isAdmin: true }` in user doc -> Expected: `PERMISSION_DENIED`.
3. **Payload 3 (Cross-Educator Activity Hijacking)**: Educator B attempts `updateDoc` on Educator A's `/activities/act_1` changing `educatorId` to B -> Expected: `PERMISSION_DENIED`.
4. **Payload 4 (Student Grade Forgery)**: Student attempts `updateDoc` on their submission with `{ suggestedScore: 100, status: "graded" }` -> Expected: `PERMISSION_DENIED`.
5. **Payload 5 (Cross-Student Submission Snooping)**: Student A queries `getDoc` on Student B's submission `/activities/act_1/submissions/student_B` -> Expected: `PERMISSION_DENIED`.
6. **Payload 6 (Coach Chat Impersonation)**: Student A attempts to inject coach chat messages into Student B's coach thread -> Expected: `PERMISSION_DENIED`.
7. **Payload 7 (Path Variable Poisoning / Buffer Overflow)**: Attacker attempts to create document with 2KB junk string as `activityId` -> Expected: `PERMISSION_DENIED`.
8. **Payload 8 (Anonymous Write Attack)**: Unauthenticated client attempts to post to `/activities` or `/usage_stats` -> Expected: `PERMISSION_DENIED`.
9. **Payload 9 (Terminal State Bypass)**: Student attempts to update answer after status is set to `'graded'` -> Expected: `PERMISSION_DENIED`.
10. **Payload 10 (PII Exposure via Blanket List)**: Authenticated user calls `getDocs(collection(db, 'users'))` without owner filtering -> Expected: `PERMISSION_DENIED`.
11. **Payload 11 (Unverified Email Admin Spoof)**: Attacker uses identity with `email: 'eric.emberda@gmail.com'` but `email_verified == false` -> Expected: `PERMISSION_DENIED`.
12. **Payload 12 (Negative or Out-of-Bounds Score Injection)**: Arbitrary user attempts to write negative score or score > 1000 -> Expected: `PERMISSION_DENIED`.
