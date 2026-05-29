# Frontend Integration Guide

This guide is the contract between the admin web, mobile app, and CamPass
backend. Do not put mobile ID personal data, OpenDID wallet files, private keys,
or VC documents inside CamPass QR payloads.

For detailed cross-client screen refresh rules, approval state transitions, QR
scan effects, and report synchronization, see
`docs/web-app-state-sync-guide.md`.

## 1. Common Auth Flow

Use this flow from both admin web and mobile app.

```http
GET  /auth/mobile-id/providers
POST /auth/mobile-id/start
GET  /auth/mobile-id/requests/:authRequestId
POST /auth/mobile-id/verify
GET  /auth/me
```

Start request:

```json
{
  "provider": "omnione_cx",
  "clientType": "mobile_app",
  "authFlow": "app",
  "oacxProvider": "comdl_v1.5",
  "requestType": "WEB2APP",
  "zkpType": "AdultVerify",
  "useConvertor": false
}
```

Frontend responsibility:

- Render or open the invocation payload returned by `start`.
- Poll `GET /auth/mobile-id/requests/:authRequestId` only for UX state.
- Send the provider completion payload to `verify`.
- Store only the returned CamPass `accessToken`.

Backend responsibility:

- Store OACX `token`, `txId`, `cxId`, nonce, and state server-side.
- Normalize provider output to `AuthResult`.
- Create/link user DID.
- Return CamPass user profile and access token.

## 2. Mobile App User Flow

```http
GET  /festivals
GET  /festivals/:festivalId
GET  /festivals/:festivalId/booths
POST /festivals/:festivalId/passes/issue
GET  /festivals/:festivalId/passes/me
POST /festivals/:festivalId/qr
```

Pass issue request:

```json
{
  "requestedTypes": ["entry", "adult", "student"],
  "studentProof": {
    "schoolName": "Kwangwoon University",
    "studentId": "2023123456",
    "schoolEmail": "student@kw.ac.kr",
    "proofFileUrl": "/uploads/student-proof/example.pdf"
  }
}
```

QR response:

```json
{
  "qrPayload": "campass://qr?token=short-lived-token",
  "expiresAt": "2026-05-29T12:10:00.000Z"
}
```

The app must refresh QR before expiry. The QR payload contains only a short
server token.

## 3. Staff Mode Flow

```http
POST /staff-invites/:inviteCode/request
GET  /festivals/:festivalId/staff/me
POST /verification/qr
POST /verification/entry/complete
POST /verification/benefit/complete
POST /verification/event/complete
POST /verification/adult-check/complete
POST /verification/student-check/complete
```

Scanner request:

```json
{
  "token": "qr-token",
  "festivalId": "festival-id",
  "scanPurpose": "benefit",
  "boothId": "booth-id"
}
```

Staff scope mapping:

| `scanPurpose` | Required Staff VC scope |
| --- | --- |
| `entry` | `entry_scan` |
| `benefit` | `benefit_check` |
| `event` | `event_check` |
| `adult_check` | `adult_check` |
| `student_check` | `student_check` |

Verification result values:

```txt
allowed
denied
expired
already_used
missing_credential
invalid_qr
missing_staff_scope
```

The staff UI must display only result messages and permission booleans. Do not
display name, birth date, phone, resident number, or raw credential claims.

Staff users, invite codes, staff request ids, and Staff VC subject DIDs are
runtime values. They are created by the staff invite/request/approval APIs and
must not be hard-coded into `.env`.

## 4. OpenDID Issue Flow

Use this when the app/wallet needs to receive an official OpenDID VC for a
CamPass credential.

```http
POST /opendid/wallet/issue-offer
POST /opendid/wallet/issue-inspect-propose
POST /opendid/wallet/issue-profile
POST /opendid/wallet/issue-vc
POST /opendid/wallet/issue-complete
GET  /opendid/wallet/issue-result/:transactionId
GET  /opendid/wallet/transactions/:transactionId
```

Step 1:

```json
POST /opendid/wallet/issue-offer
{
  "credentialId": "campass-credential-id"
}
```

Response includes:

```json
{
  "walletTransactionId": "transaction-id",
  "credentialType": "student",
  "vcPlanId": "opendid-vc-plan-id",
  "txId": "opendid-tx-id",
  "issueOfferPayload": {}
}
```

Send `issueOfferPayload` to the holder wallet. Keep `walletTransactionId` and
send it in later requests.

Step 2:

```json
POST /opendid/wallet/issue-profile
{
  "walletTransactionId": "transaction-id",
  "txId": "opendid-tx-id",
  "holderDid": "did:omnione:holder..."
}
```

Step 3:

```json
POST /opendid/wallet/issue-vc
{
  "walletTransactionId": "transaction-id",
  "txId": "opendid-tx-id",
  "accE2e": {},
  "encReqVc": "encrypted-request-vc"
}
```

Step 4:

```json
POST /opendid/wallet/issue-complete
{
  "walletTransactionId": "transaction-id",
  "txId": "opendid-tx-id",
  "vcId": "opendid-vc-id"
}
```

After completion, CamPass marks the credential `credentialProvider=opendid` and
stores the external VC id.

## 5. OpenDID Verify Flow

Use this when the app/wallet must submit a VP to the self-hosted verifier.

```http
POST /opendid/wallet/verify-offer
POST /opendid/wallet/verify-profile
POST /opendid/wallet/verify-vp
POST /opendid/wallet/verify-confirm
GET  /opendid/wallet/transactions/:transactionId
```

Step 1:

```json
POST /opendid/wallet/verify-offer
{
  "credentialType": "student"
}
```

Step 2:

```json
POST /opendid/wallet/verify-profile
{
  "walletTransactionId": "transaction-id",
  "offerId": "opendid-offer-id",
  "txId": "opendid-tx-id"
}
```

Step 3:

```json
POST /opendid/wallet/verify-vp
{
  "walletTransactionId": "transaction-id",
  "txId": "opendid-tx-id",
  "accE2e": {},
  "encVp": "encrypted-vp"
}
```

Step 4:

```json
POST /opendid/wallet/verify-confirm
{
  "walletTransactionId": "transaction-id",
  "offerId": "opendid-offer-id"
}
```

## 6. Transaction Recovery

Use this after app restart, refresh, or network interruption:

```http
GET /opendid/wallet/transactions?flowType=issue&status=profile_requested
GET /opendid/wallet/transactions/:transactionId
```

Response items include:

```json
{
  "id": "transaction-id",
  "flowType": "issue",
  "status": "profile_requested",
  "nextAction": "request_issue_vc",
  "txId": "opendid-tx-id",
  "offerId": "opendid-offer-id",
  "expiresAt": "2026-05-29T12:10:00.000Z"
}
```

`nextAction` values:

```txt
request_issue_profile
request_issue_vc
complete_or_poll_issue_result
request_verify_profile
request_verify_vp
confirm_verify
none
```

## 7. Admin Web Flow

```http
POST /admin/profile
GET  /admin/profile/me
GET  /admin/profiles
PATCH /admin/profiles/:profileId/proof-status
POST /festivals
PATCH /festivals/:festivalId
POST /festivals/:festivalId/booths
POST /festivals/:festivalId/pass-templates
POST /festivals/:festivalId/staff-invites
GET  /festivals/:festivalId/staff-requests
POST /staff-requests/:requestId/approve
POST /staff-requests/:requestId/reject
GET  /festivals/:festivalId/reports/summary
```

Only seed admin or `super_admin` can call:

```http
PATCH /admin/profiles/:profileId/proof-status
```

Admin VC is issued only when `proofStatus=approved`.

## 8. Frontend Values To Confirm

Confirm these before E2E testing:

```txt
ADMIN_WEB_ORIGIN
MOBILE_APP_DEEP_LINK_SCHEME
ANDROID_PACKAGE_NAME
IOS_BUNDLE_ID
MOBILE_ID_REDIRECT_URI
CAMPASS_QR_TTL_SECONDS
```
