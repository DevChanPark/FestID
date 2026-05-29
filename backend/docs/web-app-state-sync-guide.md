# Web And App State Sync Guide

This guide explains how the admin web, mobile app, and staff mode stay in sync
through the same CamPass backend data.

The current MVP does not require WebSocket or SSE. The frontend should use:

- refetch after every mutation,
- focused polling on screens that wait for approval or scan results,
- QR refresh before token expiry,
- report polling on dashboard screens.

The backend is the source of truth. Do not keep long-lived permission state only
in local frontend storage.

## 1. Shared State Principle

```text
Admin web mutation
-> backend DB / credential state changes
-> mobile app refetch sees new state

Mobile app mutation
-> backend DB / usage / scan logs change
-> admin web report refetch sees new state
```

Important shared tables:

| Domain | Source of truth |
| --- | --- |
| User login | `users`, `auth_requests` |
| DID | `users.did`, `users.external_did` |
| Permissions | `credentials` |
| Admin approval | `admin_profiles.proof_status`, Admin VC |
| Student approval | `student_verifications.status`, Student VC |
| Staff approval | `staff_requests.status`, Staff VC |
| QR | `qr_tokens` |
| Scan result | `scan_logs` |
| Usage and duplicate block | `usage_records` |
| Reports | `scan_logs`, `usage_records`, `credentials` |
| OpenDID wallet flow | `opendid_wallet_transactions` |

## 2. Recommended Frontend Cache Keys

Use equivalent keys if the frontend uses React Query, SWR, Zustand query cache,
or another data layer.

| Screen | Suggested query key | API |
| --- | --- | --- |
| Current user | `auth.me` | `GET /auth/me` |
| Festival list | `festivals.public` | `GET /festivals` |
| Festival detail | `festival.{festivalId}` | `GET /festivals/:festivalId` |
| Booth list | `booths.{festivalId}` | `GET /festivals/:festivalId/booths` |
| My pass | `passes.me.{festivalId}` | `GET /festivals/:festivalId/passes/me` |
| My staff mode | `staff.me.{festivalId}` | `GET /festivals/:festivalId/staff/me` |
| Staff requests | `staff.requests.{festivalId}` | `GET /festivals/:festivalId/staff-requests` |
| Reports summary | `reports.summary.{festivalId}` | `GET /festivals/:festivalId/reports/summary` |
| OpenDID transactions | `opendid.transactions` | `GET /opendid/wallet/transactions` |

## 3. Admin Web Screens

### 3.1 Admin Login Screen

APIs:

```http
POST /auth/mobile-id/start
POST /auth/mobile-id/verify
GET  /auth/me
GET  /admin/profile/me
```

Routing:

| Backend state | UI route |
| --- | --- |
| No profile | Admin profile form |
| `proofStatus=pending` | Approval waiting screen |
| `proofStatus=rejected` | Re-submit profile/proof screen |
| Admin VC exists | Admin dashboard |
| No Admin VC and not pending | No permission screen |

Refetch after:

- `POST /auth/mobile-id/verify`: refetch `auth.me` and `admin.profile.me`.
- `POST /admin/profile`: refetch `admin.profile.me`.

### 3.2 Festival Management

Admin creates or updates festival:

```http
POST  /festivals
PATCH /festivals/:festivalId
```

Affected app screens:

| Admin change | Mobile app effect |
| --- | --- |
| `status=active`, `visibility=public` | Appears in `GET /festivals` |
| `status=draft` or `visibility=private` | Hidden from public list |
| Name/date/location/image changes | Visible after refetching festival list/detail |

Frontend behavior:

- Admin web refetches `festivals.my` or festival detail after mutation.
- Mobile app refetches `GET /festivals` on app foreground, pull refresh, and
  normal list screen entry.
- No local hard-coded festival data.

### 3.3 Booth Management

Admin creates or updates booth:

```http
POST   /festivals/:festivalId/booths
PATCH  /booths/:boothId
PATCH  /booths/:boothId/status
DELETE /booths/:boothId
```

Affected app screens:

| Admin change | Mobile app effect |
| --- | --- |
| New booth | Appears in booth list |
| `operatingStatus` changed | Booth status badge changes |
| `requiredPermission` changed | Scanner validation rule changes |
| `benefitPolicy` changed | Duplicate usage policy changes |

Frontend behavior:

- Admin web refetches `booths.{festivalId}` after mutation.
- Mobile app refetches booth list on screen focus and pull refresh.
- Staff scanner should refetch booth detail if scanning a booth-scoped QR action.

### 3.4 Student Verification Approval

Admin approves/rejects:

```http
GET   /festivals/:festivalId/student-verifications
PATCH /student-verifications/:verificationId/status
```

Affected mobile app:

| Admin action | Mobile app pass state |
| --- | --- |
| Approve | Student VC issued, student pass becomes active |
| Reject | Student verification rejected, app shows resubmit option |

Mobile app should poll while waiting:

```http
GET /festivals/:festivalId/passes/me
GET /festivals/:festivalId/student-verifications/me
```

Recommended polling:

- Approval waiting screen: every 10-15 seconds.
- Stop polling when approved/rejected or when leaving screen.

### 3.5 Staff Approval

Admin approves/rejects:

```http
GET  /festivals/:festivalId/staff-requests
POST /staff-requests/:requestId/approve
POST /staff-requests/:requestId/reject
```

Affected mobile app:

| Admin action | Mobile app effect |
| --- | --- |
| Approve | Staff VC issued; `staffMode=true` |
| Reject | Staff request rejected; no scanner button |

Mobile app should poll while waiting:

```http
GET /festivals/:festivalId/staff/me
```

Recommended polling:

- Staff request waiting screen: every 5-10 seconds.
- App foreground event: refetch immediately.
- After `staffMode=true`, show scanner entry point.

## 4. Mobile App Screens

### 4.1 Festival List And Detail

APIs:

```http
GET /festivals
GET /festivals/:festivalId
GET /festivals/:festivalId/booths
```

State source:

- Public list only shows `active + public`.
- Admin web changes appear after list/detail refetch.

Recommended refetch:

- App foreground.
- Pull refresh.
- Screen focus.

### 4.2 Pass Screen

APIs:

```http
POST /festivals/:festivalId/passes/issue
GET  /festivals/:festivalId/passes/me
POST /festivals/:festivalId/qr
```

Pass state rules:

| Credential | How it becomes active |
| --- | --- |
| Entry | Pass issue request succeeds |
| Adult | Mobile ID `isAdult=true` and pass issue requested |
| Student | Student verification approved |

QR state:

- QR token is short-lived.
- QR token is not proof by itself; backend validates credentials and usage.
- QR should be refreshed before `expiresAt`.

Recommended QR behavior:

- Request QR when QR screen opens.
- Refresh when 70-80 percent of TTL has elapsed.
- Refresh immediately when app returns foreground.
- If scan fails as `expired`, request a new QR.

### 4.3 Staff Request Screen

APIs:

```http
POST /staff-invites/:inviteCode/request
GET  /festivals/:festivalId/staff/me
```

UI states:

| API state | UI |
| --- | --- |
| No request | Invite code input |
| Requested/pending | Waiting for admin approval |
| Approved Staff VC | Staff mode enabled |
| Rejected | Rejected state with retry/help |

`staffMode=true` is determined by Staff VC, not by DID string or local role.

## 5. Staff Scanner Flow

### 5.1 QR Scan

API:

```http
POST /verification/qr
```

Request:

```json
{
  "token": "qr-token",
  "festivalId": "festival-id",
  "scanPurpose": "benefit",
  "boothId": "booth-id"
}
```

Response result:

```txt
allowed
denied
expired
already_used
missing_credential
invalid_qr
missing_staff_scope
```

UI mapping:

| Result | Staff UI |
| --- | --- |
| `allowed` | Show positive result and completion button |
| `already_used` | Show duplicate blocked, no completion button |
| `missing_staff_scope` | Show staff permission missing |
| `missing_credential` | Show required pass missing |
| `expired` | Ask user to refresh QR |
| `invalid_qr` | Invalid QR |
| `denied` | Not allowed |

Privacy rule:

- Staff UI shows only result, display message, verified boolean claims, and
  action required.
- Staff UI must not show name, birth date, phone, resident number, or raw VC.

### 5.2 Completion

QR verification does not automatically mark usage. Completion happens after the
staff member taps a button.

APIs:

```http
POST /verification/entry/complete
POST /verification/benefit/complete
POST /verification/event/complete
POST /verification/adult-check/complete
POST /verification/student-check/complete
```

Completion effects:

| Completion | Backend effect | Admin report effect |
| --- | --- | --- |
| Entry complete | `usage_records` entry row | Entry count increases |
| Benefit complete | `usage_records` benefit row | Booth usage increases |
| Event complete | `usage_records` event row | Event count increases |
| Adult check complete | `usage_records` adult_check row | Adult check count increases |
| Student check complete | `usage_records` student_check row | Student check count increases |

Duplicate prevention:

- Backend checks `usage_records`.
- Repeated same policy returns `already_used` at verification or completion.
- Frontend should never decide duplicate state locally.

## 6. Admin Reports

APIs:

```http
GET /festivals/:festivalId/reports/summary
GET /festivals/:festivalId/reports/scans
GET /festivals/:festivalId/reports/usage
```

Affected by:

- Every QR scan writes `scan_logs`.
- Every completion writes `usage_records`.
- Duplicate blocked attempts appear in scan logs and summary counts.

Recommended dashboard refresh:

- Manual refresh button.
- Poll every 10-30 seconds while dashboard is open.
- Refetch after admin changes booth/festival state.

## 7. OpenDID Wallet Flow State

OpenDID values like `walletTransactionId`, `txId`, `offerId`, and `vcId` are
runtime protocol values. They are not frontend config and not `.env`.

Recovery APIs:

```http
GET /opendid/wallet/transactions
GET /opendid/wallet/transactions/:transactionId
```

Transaction status:

```txt
offer_created
profile_requested
request_submitted
completed
failed
expired
```

`nextAction` tells the app what to do next:

| `nextAction` | Frontend action |
| --- | --- |
| `request_issue_profile` | Continue issue profile step |
| `request_issue_vc` | Send encrypted issue request |
| `complete_or_poll_issue_result` | Complete issue or poll result |
| `request_verify_profile` | Continue verify profile step |
| `request_verify_vp` | Send encrypted VP |
| `confirm_verify` | Confirm verification |
| `none` | Flow done or failed |

## 8. Screen Change Examples

### Admin creates festival

```text
Admin web: POST /festivals
Mobile app: refetch GET /festivals
Result: new active/public festival appears
```

### Admin changes booth permission to adult

```text
Admin web: PATCH /booths/:boothId
Staff app: next POST /verification/qr uses new required_permission
Result: user without Adult VC gets missing_credential
```

### Admin approves staff request

```text
Admin web: POST /staff-requests/:requestId/approve
Backend: Staff VC issued
Mobile app: polling GET /festivals/:festivalId/staff/me
Result: staffMode becomes true, scanner button appears
```

### Staff scans QR

```text
Staff app: POST /verification/qr
Backend: token, Staff VC scope, user credentials, booth rule, usage duplicate checked
Admin web: report polling GET /reports/summary
Result: scan count updates; no usage count until complete API
```

### Staff completes benefit

```text
Staff app: POST /verification/benefit/complete
Backend: usage_records created
User app: same QR/benefit later returns already_used
Admin web: usage and booth counts increase
```

### Student verification approved

```text
Admin web: PATCH /student-verifications/:verificationId/status
Backend: Student VC issued
Mobile app: polling GET /passes/me
Result: student pass becomes active
```

## 9. What Is Already Considered

The backend already accounts for:

- Admin web and mobile app sharing the same festival/booth/pass data.
- DID not meaning role by itself.
- Role/permission coming from credentials.
- Admin VC only after admin profile approval.
- Student VC only after student verification approval.
- Staff VC only after staff request approval.
- Staff scanner access controlled by Staff VC scope.
- QR containing token only, not identity or VC documents.
- QR verification and usage completion being separate.
- Duplicate use blocked through `usage_records`.
- Reports reflecting scan logs and usage records.
- Runtime values being generated by APIs, not fixed in env.

## 10. Current Limitation

There is no realtime push channel yet. If the product needs instant UI updates
without polling, add one of these later:

- WebSocket for staff/admin operation rooms.
- SSE for dashboard report updates.
- Push notification for staff approval result.

For the hackathon MVP, focused polling and refetch-on-mutation are enough and
match the current backend design.
