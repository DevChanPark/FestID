# External Values And Runtime Values

This document separates values that CamPass can default, values that must be
created in external systems, values owned by frontend projects, and values that
are created dynamically while the service runs.

## 1. Values The Backend Can Default

These can be filled by the backend template for local development. They are not
team-specific secrets.

```env
OMNIONE_CX_WEB_BASE_URL="https://cx.raonsecure.co.kr:17543/ent/esign"
OMNIONE_CX_CONFIG_URL="https://cx.raonsecure.co.kr:17543/ent/esign/config/config.mid.json"
OMNIONE_CX_PROVIDER_ID="comdl_v1.5"
OMNIONE_CX_SIGN_TYPE="ENT_MID"
OMNIONE_CX_REQUEST_TYPE="WEB2APP"
OMNIONE_CX_USE_CONVERTOR="false"

OPENDID_ISSUER_BASE_URL="http://localhost:8091"
OPENDID_VERIFIER_BASE_URL="http://localhost:8092"
OPENDID_ISSUER_HEALTH_PATH="/actuator/health"
OPENDID_VERIFIER_HEALTH_PATH="/actuator/health"

OPENDID_ISSUE_OFFER_PATH="/issuer/api/v1/request-offer"
OPENDID_ISSUE_INSPECT_PROPOSE_PATH="/issuer/api/v1/inspect-propose-issue"
OPENDID_ISSUE_PROFILE_PATH="/issuer/api/v1/generate-issue-profile"
OPENDID_CREDENTIAL_ISSUE_PATH="/issuer/api/v1/issue-vc"
OPENDID_ISSUE_COMPLETE_PATH="/issuer/api/v1/complete-vc"
OPENDID_ISSUE_RESULT_PATH="/issuer/api/v1/issue-vc/result"
OPENDID_CREDENTIAL_REVOKE_PATH="/issuer/api/v1/revoke-vc"
OPENDID_VERIFY_OFFER_PATH="/verifier/api/v1/request-offer-qr"
OPENDID_VERIFY_PROFILE_PATH="/verifier/api/v1/request-profile"
OPENDID_CREDENTIAL_VERIFY_PATH="/verifier/api/v1/request-verify"
OPENDID_VERIFY_CONFIRM_PATH="/verifier/api/v1/confirm-verify"

ADMIN_WEB_ORIGIN="http://localhost:5173"
MOBILE_APP_DEEP_LINK_SCHEME="campass"
CAMPASS_QR_TTL_SECONDS="180"
```

For deployed environments, replace localhost URLs with deployed issuer/verifier
URLs.

## 2. Values Created In OmniOne CX Or Provided By Operator

These are needed for live mobile ID authentication.

```env
OMNIONE_CX_BASE_URL
OMNIONE_CX_ZKP_TYPE
```

How to get them:

- Use the hackathon guide defaults if the operator says the shared CX endpoint
  is allowed.
- Otherwise request the OACX server API base URL and allowed provider values
  from the hackathon operator or RaonSecure/OmniOne contact.
- Request success/failure samples for:
  - `/oacx/api/v1.0/trans`
  - `/oacx/api/v1.0/authen/app/request`
  - `/oacx/api/v1.0/authen/qr/request`
  - `/oacx/api/v1.0/authen/app/result`
  - `/oacx/api/v1.0/authen/qr/result`
  - `/oacx/api/v1.0/trans/token`

## 3. Values Created In OpenDID Admin Consoles

These cannot be guessed by the backend. They are IDs generated after creating
issuer/verifier entities, schemas, plans, and policies.

Issuer console:

```env
OPENDID_ISSUER_DID
OPENDID_ISSUER_KID
OPENDID_ENTRY_VC_PLAN_ID
OPENDID_ADULT_VC_PLAN_ID
OPENDID_STUDENT_VC_PLAN_ID
OPENDID_STAFF_VC_PLAN_ID
OPENDID_ADMIN_VC_PLAN_ID
```

Verifier console:

```env
OPENDID_ENTRY_VERIFY_POLICY_ID
OPENDID_ADULT_VERIFY_POLICY_ID
OPENDID_STUDENT_VERIFY_POLICY_ID
OPENDID_STAFF_VERIFY_POLICY_ID
OPENDID_ADMIN_VERIFY_POLICY_ID
```

Optional metadata, useful for audit and future automation:

```env
OPENDID_ENTRY_ISSUE_PROFILE_ID
OPENDID_ADULT_ISSUE_PROFILE_ID
OPENDID_STUDENT_ISSUE_PROFILE_ID
OPENDID_STAFF_ISSUE_PROFILE_ID
OPENDID_ADMIN_ISSUE_PROFILE_ID

OPENDID_ENTRY_CREDENTIAL_DEFINITION_ID
OPENDID_ADULT_CREDENTIAL_DEFINITION_ID
OPENDID_STUDENT_CREDENTIAL_DEFINITION_ID
OPENDID_STAFF_CREDENTIAL_DEFINITION_ID
OPENDID_ADMIN_CREDENTIAL_DEFINITION_ID
```

How to get them:

1. Start issuer/verifier servers.
2. Open issuer admin and create VC schemas/plans.
3. Open verifier admin and create verification policies.
4. Run:

```bash
npm run opendid:export-env
```

5. Copy confirmed values into `.env`.

## 4. Values Owned By Frontend Projects

These should be decided with frontend/mobile teams. They are not backend secrets.

```env
ADMIN_WEB_ORIGIN
MOBILE_APP_DEEP_LINK_SCHEME
ANDROID_PACKAGE_NAME
IOS_BUNDLE_ID
MOBILE_ID_REDIRECT_URI
CAMPASS_QR_TTL_SECONDS
```

`ANDROID_PACKAGE_NAME`, `IOS_BUNDLE_ID`, and `MOBILE_ID_REDIRECT_URI` may remain
empty until the mobile app project exists or the mobile ID operator requires
app-bound callback registration.

## 5. Runtime Values That Must Not Be Env

These are created continuously by real users and APIs. Do not predefine them in
`.env`.

| Runtime value | Created by |
| --- | --- |
| User DID | Mobile ID login and DID service |
| Admin VC | Admin profile approval |
| Entry/Adult/Student VC | Pass issue and approval flows |
| Staff invite code | `POST /festivals/:festivalId/staff-invites` |
| Staff request id | `POST /staff-invites/:inviteCode/request` |
| Staff VC subject/scope | Staff approval flow |
| QR token | `POST /festivals/:festivalId/qr` |
| usage record | Verification complete APIs |
| scan log | `POST /verification/qr` |
| OpenDID `walletTransactionId` | OpenDID wallet bridge offer APIs |
| OpenDID `txId`, `offerId`, `vcId` | OpenDID issuer/verifier/wallet protocol |

Staff members are not static environment values. The only static part is the
allowed scope vocabulary:

```txt
entry_scan
benefit_check
event_check
adult_check
student_check
```

Each staff user receives scope through a Staff VC when an admin approves a staff
request.

## 6. Recommended Checks

Core backend only:

```bash
npm run integration:check
```

Mobile ID live auth:

```bash
npm run integration:check:cx
```

OpenDID issuer/verifier setup:

```bash
npm run integration:check:opendid
npm run opendid:inspect-api-docs
```

Frontend contract:

```bash
npm run integration:check:frontend
```

Full E2E:

```bash
npm run integration:check:e2e
npm run integration:check:probe
```
