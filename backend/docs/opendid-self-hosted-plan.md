# CamPass OpenDID Self-Hosted Integration Plan

This project uses OmniOne CX for the original mobile ID verification step and
OpenDID for CamPass service credential issuance.

## Fixed Direction

- Mobile ID verification: OmniOne CX.
- DID/VC infrastructure: OmniOne OpenDID official GitHub components.
- Integration style: self-hosted OpenDID servers, not a third-party remote API.
- CamPass backend remains the policy/API layer for festivals, passes, QR tokens,
  usage records, and scan logs.

## OpenDID Components

Minimum target:

- `did-issuer-server`: issues CamPass Entry, Adult, Student, Staff, and Admin VCs.
- `did-verifier-server`: verifies VC/VP/status when QR verification needs an
  external credential status check.

Likely supporting components:

- `did-api-server`: blockchain/DID registry API access.
- `did-wallet-server`: holder/wallet interaction if the mobile app stores real
  OpenDID credentials.
- `did-ta-server`: trust-agent/root trust setup when required by the official
  deployment guide.

Official source references:

- https://github.com/OmniOneID
- https://omnioneid.github.io/?locale=en

## CamPass Responsibility Boundary

```text
Mobile ID app / OmniOne CX
  -> CX verification result
  -> CamPass AuthResult
  -> User and local DID mapping
  -> OpenDID Issuer VC issuance
  -> CamPass credentials metadata row
  -> QR token and usage policy
```

CamPass QR payload still contains only a short-lived token:

```text
campass://qr?token={token}
```

Raw mobile ID data, raw resident data, birth date, phone, and VC document bodies
must not be placed inside the QR payload or staff-facing verification response.

## Environment Contract

```env
OPENDID_MODE="self_hosted"
OPENDID_CREDENTIAL_ISSUANCE_ENABLED="false"
OPENDID_VERIFICATION_ENABLED="false"
OPENDID_CREDENTIAL_ISSUE_MODE="official_wallet"
OPENDID_CREDENTIAL_VERIFY_MODE="official_vp"
OPENDID_ISSUER_BASE_URL=""
OPENDID_VERIFIER_BASE_URL=""
OPENDID_API_BASE_URL=""
OPENDID_WALLET_BASE_URL=""
OPENDID_API_TOKEN=""
OPENDID_ISSUER_DID="did:campass:issuer"
OPENDID_ISSUER_KID=""
OPENDID_ISSUER_SERVICE_ID="campass"
OPENDID_CREDENTIAL_ISSUE_PATH="/issuer/api/v1/issue-vc"
OPENDID_CREDENTIAL_REVOKE_PATH="/issuer/api/v1/revoke-vc"
OPENDID_CREDENTIAL_VERIFY_PATH="/verifier/api/v1/request-verify"
OPENDID_ISSUER_HEALTH_PATH="/actuator/health"
OPENDID_VERIFIER_HEALTH_PATH="/actuator/health"
OPENDID_ENTRY_SCHEMA_ID="campass-entry-v1"
OPENDID_ENTRY_SCHEMA_NAME="campass_entry"
OPENDID_ENTRY_VC_PLAN_ID=""
OPENDID_ENTRY_ISSUE_PROFILE_ID=""
OPENDID_ENTRY_CREDENTIAL_DEFINITION_ID=""
OPENDID_ENTRY_VERIFY_POLICY_ID=""
OPENDID_ADULT_SCHEMA_ID="campass-adult-v1"
OPENDID_ADULT_SCHEMA_NAME="campass_adult"
OPENDID_ADULT_VC_PLAN_ID=""
OPENDID_ADULT_ISSUE_PROFILE_ID=""
OPENDID_ADULT_CREDENTIAL_DEFINITION_ID=""
OPENDID_ADULT_VERIFY_POLICY_ID=""
OPENDID_STUDENT_SCHEMA_ID="campass-student-v1"
OPENDID_STUDENT_SCHEMA_NAME="campass_student"
OPENDID_STUDENT_VC_PLAN_ID=""
OPENDID_STUDENT_ISSUE_PROFILE_ID=""
OPENDID_STUDENT_CREDENTIAL_DEFINITION_ID=""
OPENDID_STUDENT_VERIFY_POLICY_ID=""
OPENDID_STAFF_SCHEMA_ID="campass-staff-v1"
OPENDID_STAFF_SCHEMA_NAME="campass_staff"
OPENDID_STAFF_VC_PLAN_ID=""
OPENDID_STAFF_ISSUE_PROFILE_ID=""
OPENDID_STAFF_CREDENTIAL_DEFINITION_ID=""
OPENDID_STAFF_VERIFY_POLICY_ID=""
OPENDID_ADMIN_SCHEMA_ID="campass-admin-v1"
OPENDID_ADMIN_SCHEMA_NAME="campass_admin"
OPENDID_ADMIN_VC_PLAN_ID=""
OPENDID_ADMIN_ISSUE_PROFILE_ID=""
OPENDID_ADMIN_CREDENTIAL_DEFINITION_ID=""
OPENDID_ADMIN_VERIFY_POLICY_ID=""
```

`OPENDID_CREDENTIAL_ISSUANCE_ENABLED` and `OPENDID_VERIFICATION_ENABLED` are
intentionally false by default. This keeps local development stable before the
holder wallet issuance/verification flow is connected.

Mode values:

- `OPENDID_CREDENTIAL_ISSUE_MODE=official_wallet`: use the official OpenDID
  holder wallet issuance protocol. This is the default for self-hosted
  OmniOneID servers.
- `OPENDID_CREDENTIAL_ISSUE_MODE=custom_direct`: call a custom compatible
  server-to-server adapter endpoint with CamPass' normalized credential payload.
- `OPENDID_CREDENTIAL_VERIFY_MODE=official_vp`: use the official OpenDID
  encrypted VP verification protocol. This is the default for self-hosted
  OmniOneID servers.
- `OPENDID_CREDENTIAL_VERIFY_MODE=custom_status`: call a custom compatible
  server-to-server credential status adapter endpoint.

The current CamPass provider supports the `custom_direct` and `custom_status`
adapter payloads. With the default official modes, enabling issuance or
verification fails loudly until the mobile wallet/holder protocol is connected.

## Official API Path Baseline

The self-hosted servers expose protocol APIs under their own service prefix.
The examples in official docs use paths such as:

Issuer:

- `POST /issuer/api/v1/request-offer`
- `POST /issuer/api/v1/inspect-propose-issue`
- `POST /issuer/api/v1/generate-issue-profile`
- `POST /issuer/api/v1/issue-vc`
- `POST /issuer/api/v1/complete-vc`
- `POST /issuer/api/v1/issue-vc/result`
- `POST /issuer/api/v1/revoke-vc`
- `POST /issuer/api/v1/status`

Verifier:

- `POST /verifier/api/v1/request-offer-qr`
- `POST /verifier/api/v1/request-profile`
- `POST /verifier/api/v1/request-verify`
- `POST /verifier/api/v1/confirm-verify`

The CamPass adapter intentionally keeps these paths configurable because the
official servers may be deployed behind a context path such as `/issuer` or
`/verifier`.

## Credential Type Mapping

After registering CamPass credential schemas, plans, profiles, definitions, and
verify policies in the official OpenDID admin consoles, map the resulting IDs
back into CamPass env values by credential type:

| CamPass VC | OpenDID values |
| --- | --- |
| Entry VC | `OPENDID_ENTRY_SCHEMA_NAME`, `OPENDID_ENTRY_VC_PLAN_ID`, `OPENDID_ENTRY_VERIFY_POLICY_ID` |
| Adult VC | `OPENDID_ADULT_SCHEMA_NAME`, `OPENDID_ADULT_VC_PLAN_ID`, `OPENDID_ADULT_VERIFY_POLICY_ID` |
| Student VC | `OPENDID_STUDENT_SCHEMA_NAME`, `OPENDID_STUDENT_VC_PLAN_ID`, `OPENDID_STUDENT_VERIFY_POLICY_ID` |
| Staff VC | `OPENDID_STAFF_SCHEMA_NAME`, `OPENDID_STAFF_VC_PLAN_ID`, `OPENDID_STAFF_VERIFY_POLICY_ID` |
| Admin VC | `OPENDID_ADMIN_SCHEMA_NAME`, `OPENDID_ADMIN_VC_PLAN_ID`, `OPENDID_ADMIN_VERIFY_POLICY_ID` |

Official issuer `request-offer` uses `vcPlanId`, while verifier
`request-offer-qr` uses `policyId`. The official self-hosted servers expose
these paths with `/issuer` and `/verifier` service prefixes. The CamPass adapter
sends the configured IDs in its server-to-server payload so the provider
implementation can switch between a custom direct endpoint and the official
sequential protocol without changing public CamPass APIs.

## Status API

Super admins can check sanitized OpenDID configuration from CamPass:

```http
GET /opendid/status
GET /opendid/status?probe=true
```

The response never returns API tokens, issuer keys, or wallet passwords. When
`probe=true`, CamPass calls the configured issuer/verifier health endpoints.

## Official Wallet Flow API

CamPass exposes authenticated helper APIs for the official holder wallet flow:

```http
POST /opendid/wallet/issue-offer
POST /opendid/wallet/issue-profile
POST /opendid/wallet/verify-offer
POST /opendid/wallet/verify-profile
```

These APIs do not place VC documents or personal data into CamPass QR payloads.
They only bridge the mobile/admin client and the self-hosted OpenDID
issuer/verifier protocol:

- `issue-offer`: accepts a CamPass `credentialId`, checks that it belongs to the
  authenticated user and is `issued`, resolves the credential type's
  `OPENDID_*_VC_PLAN_ID`, and calls `/issuer/api/v1/request-offer`.
- `issue-profile`: forwards holder DID data to `/issuer/api/v1/generate-issue-profile`.
- `verify-offer`: resolves the credential type's `OPENDID_*_VERIFY_POLICY_ID`
  and calls `/verifier/api/v1/request-offer-qr`.
- `verify-profile`: forwards the OpenDID offer id to `/verifier/api/v1/request-profile`.

The existing `OpenDidCredentialProvider.issueCredential()` remains reserved for
custom direct adapter endpoints. Official OpenDID issuance is a holder wallet
protocol and must use the wallet flow above.

## Credential Storage

`credentials` stores both CamPass policy fields and OpenDID metadata:

- `credential_provider`: `internal` or `opendid`.
- `external_credential_id`: OpenDID credential identifier.
- `vc_jwt`: issued VC JWT when the issuer returns a compact credential.
- `vc_document_json`: issued VC document when the issuer returns JSON.
- `proof_json`: VC proof/signature metadata.
- `schema_id`: CamPass/OpenDID VC schema id.
- `issuer_service_id`: issuer service identifier.
- `credential_status_id`: status/revocation lookup id.
- `external_status`: status returned by OpenDID.
- `issued_tx_id`, `revoked_tx_id`: chain/registry transaction ids when returned.

## VC Policy Defaults

- Issuer strategy: single CamPass issuer.
- Entry VC: valid until festival end.
- Adult VC: valid until festival end.
- Student VC: valid until festival end.
- Staff VC: valid until festival end.
- Admin VC: valid for 1 year.

## Next Required External Inputs

When OpenDID servers are running, fill in:

- issuer server base URL.
- verifier server base URL.
- issuer DID.
- issuer key id.
- API token or server-to-server auth method.
- actual issue/revoke/verify API paths.
- exact response examples from the running servers.

## Local Runbook

Use the local runbook for cloning official components and preparing a
self-hosted compose workspace:

- [OpenDID Self-Hosted Runbook](./opendid-self-hosted-runbook.md)

Helper scripts:

```bash
npm run opendid:clone
npm run opendid:prepare
npm run opendid:patch-local
npm run opendid:doctor
npm run opendid:inspect-api-docs
npm run opendid:export-env
npm run opendid:build-images
npm run opendid:up
```
