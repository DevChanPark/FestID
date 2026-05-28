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
OPENDID_ISSUER_BASE_URL=""
OPENDID_VERIFIER_BASE_URL=""
OPENDID_API_BASE_URL=""
OPENDID_WALLET_BASE_URL=""
OPENDID_API_TOKEN=""
OPENDID_ISSUER_DID="did:campass:issuer"
OPENDID_ISSUER_KID=""
OPENDID_ISSUER_SERVICE_ID="campass"
OPENDID_CREDENTIAL_ISSUE_PATH="/credentials/issue"
OPENDID_CREDENTIAL_REVOKE_PATH="/credentials/revoke"
OPENDID_CREDENTIAL_VERIFY_PATH="/credentials/verify"
OPENDID_ENTRY_SCHEMA_ID="campass-entry-v1"
OPENDID_ADULT_SCHEMA_ID="campass-adult-v1"
OPENDID_STUDENT_SCHEMA_ID="campass-student-v1"
OPENDID_STAFF_SCHEMA_ID="campass-staff-v1"
OPENDID_ADMIN_SCHEMA_ID="campass-admin-v1"
```

`OPENDID_CREDENTIAL_ISSUANCE_ENABLED` is intentionally false by default. This
keeps local development stable before the official OpenDID servers are running.
Once issuer/verifier endpoints are available, turn it on and set the exact paths
from the official server API.

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
