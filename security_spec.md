# Apna Role — Security Specification & Invariants

## 1. Data Invariants
1. **Identity Integrity**: Every user-owned document (`users`, `employers`, `companies`, `jobs`, `internships`, `applications`, `savedJobs`, `resumes`, `reviews`, `jobAlerts`, `reports`) must bind its ownership field (`uid`, `userId`, `ownerId`, `employerId`, `candidateId`, `reporterId`) strictly to `request.auth.uid` upon creation.
2. **Role Escalation Prevention**: Users registering via `users/{userId}` can only choose `'job_seeker'` or `'employer'` as their `role`. Users cannot set or elevate themselves to `'admin'`. Only verified bootstrapped admin (`ashutoshrauniyar0001@gmail.com` with `email_verified == true`) or entries in `/admins/{uid}` hold admin privileges.
3. **Employer-to-Company Relational Gate**: Employers can only create `jobs` or `internships` referencing a valid `companyId` that exists in `/companies/{companyId}` and whose `ownerId == request.auth.uid` (unless admin).
4. **Application State Integrity**: Candidates create applications exclusively with `status == 'Applied'`. Only the owning employer (`employerId == request.auth.uid`) or an admin can transition application statuses (`Under Review`, `Shortlisted`, `Interview Scheduled`, `Selected`, `Rejected`) or attach interview schedules.
5. **PII Isolation**: User profile documents (`/users/{userId}`) containing `email` and `phone` are readable only by the profile owner or an admin—never by blanket `isSignedIn()` list/get queries.
6. **Immutable Ownership & Timestamps**: `createdAt` and ownership IDs (`ownerId`, `candidateId`, `employerId`, `userId`, `companyId`) are immutable after creation. `createdAt` and `updatedAt` must equal `request.time`.
7. **Admin-Only Moderation Fields**: `companies.verified`, `jobs.featured`, and `reports.status` resolution fields can only be modified by verified admins.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Role Self-Escalation (`users`)**: `{ "uid": "attacker", "role": "admin", "email": "a@b.com", ... }` -> `PERMISSION_DENIED`.
2. **Shadow Field Injection (`companies`)**: Valid company create payload + `"isVerifiedAdmin": true` -> `PERMISSION_DENIED`.
3. **Email Spoofing Admin Bypass**: Token with `email: "ashutoshrauniyar0001@gmail.com"`, `email_verified: false` attempting admin write -> `PERMISSION_DENIED`.
4. **Cross-User PII Read (`users`)**: Authenticated user A reading `/users/userB` -> `PERMISSION_DENIED`.
5. **Blanket User List Scraping (`users`)**: Non-admin user running `list` on `/users` -> `PERMISSION_DENIED`.
6. **Orphaned Job Creation (`jobs`)**: Employer creating a job with non-existent `companyId: "fake_co"` -> `PERMISSION_DENIED`.
7. **Spoofed Company Ownership (`jobs`)**: Employer A creating a job referencing Employer B's `companyId` -> `PERMISSION_DENIED`.
8. **Application Status Shortcutting (`applications`)**: Candidate creating an application with `status: "Selected"` -> `PERMISSION_DENIED`.
9. **Candidate Self-Shortlisting (`applications`)**: Candidate updating their own application `status` to `"Shortlisted"` -> `PERMISSION_DENIED`.
10. **ID Poisoning (`jobs/{jobId}`)**: Creating a document with a 300-char invalid ID containing `$` or `/` -> `PERMISSION_DENIED`.
11. **Value/Size Poisoning (`resumes`)**: Injecting a 200KB string into `fullName` -> `PERMISSION_DENIED`.
12. **Timestamp Tampering (`jobs`)**: Sending a client-forged `createdAt` timestamp instead of `request.time` -> `PERMISSION_DENIED`.
