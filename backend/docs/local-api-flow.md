# Local API Flow

This flow intentionally does not mock mobile ID authentication.

## 1. Start Infrastructure

```bash
npm install
npm run db:up
npm run db:deploy
npm run prisma:generate
npm run start:dev
```

If Docker is not installed, install Docker Desktop first and rerun `npm run db:up`.

## 2. Connect Real Mobile ID Provider

`omnione_cx` calls the OmniOne CX VC-Verifier server API. `mobile_id_sdk` and `raonsecure_sdk` still return `PROVIDER_NOT_IMPLEMENTED` until their SDK docs are wired.

```http
GET /auth/mobile-id/providers
POST /auth/mobile-id/start
GET /auth/mobile-id/requests/:authRequestId
POST /auth/mobile-id/verify
```

After provider integration succeeds, a real user will be created with a DID.

## 3. Bootstrap First Admin

Set one of these values in `.env` after the real user exists:

```txt
SEED_ADMIN_USER_IDS="real-user-id"
SEED_ADMIN_DIDS="did:campass:user:..."
DEV_BOOTSTRAP_OWNER_USER_ID="real-user-id"
```

Then restart the server and run:

```bash
npm run dev:bootstrap-data
```

The bootstrap script only creates operating data:

- active public festival
- pass templates
- booths

It does not create auth sessions, fake users, or fake credentials.

## 4. Admin Web Flow

```txt
POST /admin/profile
PATCH /admin/profiles/:profileId/proof-status
GET  /admin/profiles
POST /festivals
POST /festivals/:festivalId/booths
POST /festivals/:festivalId/booths/import-csv
POST /festivals/:festivalId/pass-templates
GET  /festivals/:festivalId/credentials
POST /credentials/:credentialId/revoke
POST /festivals/:festivalId/staff-invites
POST /staff-invites/:inviteCode/revoke
GET  /festivals/:festivalId/staff-requests
POST /staff-requests/:requestId/approve
GET  /festivals/:festivalId/reports/summary
```

Only seed admin or super_admin can approve admin profiles.

### Uploads

```txt
POST /uploads/admin-proof
POST /uploads/student-proof
POST /uploads/booth-poster
POST /uploads/festival-image
```

All upload APIs use `multipart/form-data` with a `file` field and return `fileUrl`.

Allowed file types:

- `admin-proof`, `student-proof`: PDF, JPEG, PNG
- `booth-poster`, `festival-image`: JPEG, PNG, WEBP

### Booth CSV Import

```txt
POST /festivals/:festivalId/booths/import-csv
```

Use `multipart/form-data`:

- `file`: CSV file
- `upsert`: optional boolean, defaults to true

CSV columns:

```csv
name,description,category,location,operating_status,current_waiting_count,expected_wait_time,required_permission,benefit_policy,poster_url
정문 입장 게이트,Entry VC 입장 처리,event,정문,open,0,0,entry,none,
재학생 굿즈 부스,Student VC 굿즈 지급,goods,학생회관 앞,open,0,10,student,student_once,https://...
```

Allowed values:

- `category`: `food`, `experience`, `goods`, `event`, `alcohol`
- `operating_status`: `open`, `crowded`, `closing_soon`, `closed`
- `required_permission`: `none`, `entry`, `student`, `adult`, `staff`
- `benefit_policy`: `none`, `once_per_user`, `once_per_day`, `student_once`, `adult_once`

## 5. Mobile App Flow

```txt
GET  /festivals
GET  /festivals/:festivalId
GET  /festivals/:festivalId/booths
POST /festivals/:festivalId/passes/issue
GET  /festivals/:festivalId/passes/me
POST /festivals/:festivalId/qr
POST /staff-invites/:inviteCode/request
GET  /festivals/:festivalId/staff/me
```

## 6. OpenDID Wallet Flow

These APIs bridge the mobile app/wallet and the self-hosted OpenDID
issuer/verifier servers. They require the same CamPass access token as the app.

```txt
POST /opendid/wallet/issue-offer
POST /opendid/wallet/issue-inspect-propose
POST /opendid/wallet/issue-profile
POST /opendid/wallet/issue-vc
POST /opendid/wallet/issue-complete
GET  /opendid/wallet/issue-result/:transactionId

POST /opendid/wallet/verify-offer
POST /opendid/wallet/verify-profile
POST /opendid/wallet/verify-vp
POST /opendid/wallet/verify-confirm

GET  /opendid/wallet/transactions
GET  /opendid/wallet/transactions/:transactionId
```

Every offer response includes `walletTransactionId`. The app should pass that
value into the next step and can call `GET /opendid/wallet/transactions` to
recover active flows after app refresh/restart. Transaction responses include a
sanitized `nextAction` such as `request_issue_profile`, `request_issue_vc`,
`confirm_verify`, or `none`.

The backend stores OpenDID raw protocol payloads server-side. CamPass QR payloads
still contain only short QR tokens and never contain VC documents or personal
identity fields.

## 7. Staff Scan Flow

```txt
POST /verification/qr
POST /verification/entry/complete
POST /verification/benefit/complete
POST /verification/event/complete
POST /verification/adult-check/complete
POST /verification/student-check/complete
```

The server returns verification results only, not private identity fields.
