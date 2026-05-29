# E2E Test Checklist

Use this checklist when OmniOne CX, OpenDID, admin web, and mobile app are ready
to test together.

## 1. Environment Readiness

```bash
cd backend
npm install
npm run db:up
npm run db:deploy
npm run prisma:generate
npm run opendid:doctor
npm run opendid:inspect-api-docs
npm run integration:check
```

Expected:

- Postgres is running.
- Issuer/verifier health checks pass.
- `integration:check` has no missing required values for the target test.
- `opendid:doctor` has no errors.

Warnings about missing wallet files are blockers for real OpenDID issuance or
verification, but not for pure CamPass API smoke tests.

## 2. Mobile ID Login

APIs:

```http
POST /auth/mobile-id/start
GET  /auth/mobile-id/requests/:authRequestId
POST /auth/mobile-id/verify
GET  /auth/me
```

Pass criteria:

- `verify` returns CamPass `accessToken`.
- `GET /auth/me` returns the same user.
- User has `did`.
- No raw personal identity response is returned to the frontend.

## 3. Admin Approval Flow

APIs:

```http
POST  /admin/profile
GET   /admin/profile/me
PATCH /admin/profiles/:profileId/proof-status
```

Pass criteria:

- Normal admin cannot approve own profile.
- Seed admin or `super_admin` can approve.
- Admin VC is issued only after `proofStatus=approved`.

## 4. Festival And Booth Setup

APIs:

```http
POST /festivals
PATCH /festivals/:festivalId
POST /festivals/:festivalId/booths
POST /festivals/:festivalId/pass-templates
GET  /festivals
GET  /festivals/:festivalId/booths
```

Pass criteria:

- `status=active` and `visibility=public` festival appears in mobile app list.
- Booth `required_permission` and `benefit_policy` values match scanner tests.

## 5. Pass And Student Verification

APIs:

```http
POST  /festivals/:festivalId/passes/issue
GET   /festivals/:festivalId/passes/me
POST  /festivals/:festivalId/student-verifications
PATCH /student-verifications/:verificationId/status
```

Pass criteria:

- Entry VC is issued after pass request.
- Adult VC is issued only when mobile ID auth result proves adult status.
- Student VC is issued only after student verification approval.
- Student proof file URL is stored, not embedded into QR.

## 6. Staff Delegation

APIs:

```http
POST /festivals/:festivalId/staff-invites
POST /staff-invites/:inviteCode/request
GET  /festivals/:festivalId/staff-requests
POST /staff-requests/:requestId/approve
GET  /festivals/:festivalId/staff/me
```

Pass criteria:

- Staff request shows masked DID.
- Approval issues Staff VC.
- `GET /staff/me` returns `staffMode=true`.
- Staff scope list matches scanner capabilities.

## 7. QR Verification And Completion

APIs:

```http
POST /festivals/:festivalId/qr
POST /verification/qr
POST /verification/entry/complete
POST /verification/benefit/complete
POST /verification/event/complete
POST /verification/adult-check/complete
POST /verification/student-check/complete
```

Pass criteria:

- QR payload contains only short token.
- Expired QR returns `expired`.
- Missing credential returns `missing_credential`.
- Missing staff scope returns `missing_staff_scope`.
- First eligible benefit returns `allowed`.
- Second same benefit returns `already_used`.
- Completion writes `usage_records`.
- Every scan writes `scan_logs`.

## 8. OpenDID Issue Flow

APIs:

```http
POST /opendid/wallet/issue-offer
POST /opendid/wallet/issue-inspect-propose
POST /opendid/wallet/issue-profile
POST /opendid/wallet/issue-vc
POST /opendid/wallet/issue-complete
GET  /opendid/wallet/issue-result/:transactionId
GET  /opendid/wallet/transactions/:transactionId
```

Pass criteria:

- Offer response includes `walletTransactionId`.
- Transaction status advances through expected steps.
- `nextAction` matches the next frontend/wallet call.
- Completion stores `credentialProvider=opendid`.
- Completion stores external VC id.
- Raw OpenDID payloads are not placed in QR.

## 9. OpenDID Verify Flow

APIs:

```http
POST /opendid/wallet/verify-offer
POST /opendid/wallet/verify-profile
POST /opendid/wallet/verify-vp
POST /opendid/wallet/verify-confirm
GET  /opendid/wallet/transactions/:transactionId
```

Pass criteria:

- Offer response includes `walletTransactionId`.
- VP request uses encrypted wallet payload.
- Confirm response has boolean `result`.
- Missing or non-boolean result fails instead of pretending success.
- Transaction stores completed or failed status.

## 10. Reports

APIs:

```http
GET /festivals/:festivalId/reports/summary
GET /festivals/:festivalId/reports/scans
GET /festivals/:festivalId/reports/usage
```

Pass criteria:

- Scan count increases after QR scans.
- Usage count increases after completion.
- Duplicate block count increases after repeated benefit attempt.
- Reports are visible only to festival owner or super admin.

## 11. Final Demo Path

Run this exact story for the hackathon demo:

```text
1. Admin mobile ID login.
2. Admin profile approved by seed admin.
3. Admin creates public active festival.
4. Admin creates booths and pass templates.
5. User mobile ID login.
6. User issues Entry/Adult/Student pass.
7. Student proof approved.
8. Staff mobile ID login.
9. Staff request approved.
10. User displays QR.
11. Staff scans QR and sees allowed result only.
12. Staff completes benefit.
13. Second scan blocks duplicate usage.
14. Admin report shows scan and usage counts.
15. OpenDID issue/verify flow succeeds for one VC.
```
