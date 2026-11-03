# Security Specification — Iniyandit Application Center

## 1. Data Invariants

1. **Public Read-Only Boundary**: Unauthenticated officers (`request.auth == null`) may ONLY read documents in `/applications/{appId}` where `resource.data.isActive == true`, `/categories/{categoryId}` where `resource.data.isActive == true`, and `/settings/{settingId}` where `resource.data.isPublic == true`. Public users can never read inactive applications/categories, never read `/admins` or `/activity_logs`, and never write to any collection.
2. **Verified Admin Authority**: Administrative write operations require a verified authentication token (`request.auth != null && request.auth.token.email_verified == true`) belonging either to the bootstrapped administrator (`sulfikrihidayatkesling@gmail.com`) or an active administrator document in `/admins/$(request.auth.uid)` where `isActive == true`.
3. **Relational Integrity (Application -> Category)**: An application cannot be created unless its `categoryId` references an existing category document (`exists(/databases/$(database)/documents/categories/$(incoming().categoryId))`).
4. **Strict Key & Size Enforcement**: Every create and update operation validates all required and allowed keys (`keys().hasAll(...) && keys().hasOnly(...)`), data types, string length bounds, regex patterns, and server timestamps (`request.time`).
5. **PII Isolation on `/admins`**: The `/admins/{adminUid}` collection stores administrator emails (PII) and is strictly restricted to `isOwner(adminUid) || isAdmin()`. Blanket `isSignedIn()` reads are forbidden.
6. **Immutable Audit Logs**: Documents in `/activity_logs/{logId}` can only be created by verified administrators with `actorUid == request.auth.uid` and `createdAt == request.time`, and can never be updated or deleted (`allow update, delete: if false;`).

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Shadow Field Injection on Application Create**: Admin sends valid `Application` payload plus `"isVerified": true` -> Rejected by `data.keys().hasOnly(...)`.
2. **Unverified Bootstrapped Email Spoof**: Attacker signs in with `email == "sulfikrihidayatkesling@gmail.com"` and `email_verified == false` -> Rejected by `request.auth.token.email_verified == true`.
3. **Public Scraping of Inactive Applications**: Unauthenticated client runs `list` on `/applications` without `where('isActive', '==', true)` -> Rejected by `allow list: if existing().isActive == true || isAdmin()`.
4. **Orphaned Application Creation**: Admin creates an application with `categoryId: "non-existent-cat"` -> Rejected by `exists(/databases/$(database)/documents/categories/$(incoming().categoryId))`.
5. **Creator Identity Spoofing**: Admin creates an application with `createdBy: "other-admin-uid"` -> Rejected by `incoming().createdBy == request.auth.uid`.
6. **Timestamp Forgery (Backdating)**: Admin sends client-fabricated `createdAt` or `updatedAt` != `request.time` -> Rejected by `incoming().createdAt == request.time` and `incoming().updatedAt == request.time`.
7. **Immutable Field Mutation on Update**: Admin attempts to modify `createdAt` or `createdBy` during application update -> Rejected by `incoming().createdAt == existing().createdAt && incoming().createdBy == existing().createdBy`.
8. **1MB ID Poisoning Attack**: Attacker targets `/applications/{1500_char_id}` -> Rejected by `isValidId(appId)` enforcing `id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`.
9. **Value Poisoning on Whitelisted Update Key**: Admin updates `name` with a 10,000-character string or boolean -> Rejected by `isValidApplication(incoming())` wrapping the `allow update` block.
10. **Non-Admin Authenticated PII Read**: Regular signed-in user (`isSignedIn()` but not admin/owner) attempts `get` or `list` on `/admins/{otherUid}` -> Rejected by `isOwner(adminUid) || isAdmin()`.
11. **Self-Privilege Escalation in `/admins`**: Non-admin signed-in user attempts to create `/admins/$(request.auth.uid)` with `role: "super_admin"` -> Rejected because `allow create` on `/admins` strictly requires `isAdmin()`.
12. **Audit Log Tampering**: Admin attempts to `update` or `delete` an existing `/activity_logs/{logId}` document -> Rejected by `allow update, delete: if false;`.

## 3. Security Rules Test Specification (`firestore.rules.test.ts`)

All 12 adversarial payloads are verified against the rule logic in `src/utils/securityRulesValidator.test.ts` to guarantee `PERMISSION_DENIED` on every attack vector.
