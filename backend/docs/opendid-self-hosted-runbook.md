# OpenDID Self-Hosted Runbook

This runbook keeps the official OmniOneID OpenDID servers outside this
repository and connects them to the CamPass backend through environment values.

Official sources:

- https://github.com/OmniOneID/did-issuer-server
- https://github.com/OmniOneID/did-verifier-server
- https://github.com/OmniOneID/did-release

## 1. Clone Official Components

```bash
cd backend
npm run opendid:clone
```

By default, the script clones official repositories into:

```text
backend/.opendid/did-issuer-server
backend/.opendid/did-verifier-server
```

Override location or branch when needed:

```bash
OPENDID_WORKDIR=/path/to/opendid OPENDID_BRANCH=develop npm run opendid:clone
```

The `.opendid` folder is ignored by git. Do not commit official source copies or
generated OpenDID wallets into the CamPass repository.

## 2. Requirements

Official installation guides list:

- Java 21 or higher.
- Gradle 7.0 or higher.
- Docker and Docker Compose when running with containers.
- PostgreSQL.
- Node.js/npm if using the official admin console frontend.

Default server ports from the official docs:

- Issuer: `8091`.
- Verifier: `8092`.

## 3. Configure Servers

Official config directories:

```text
backend/.opendid/did-issuer-server/source/did-issuer-server/src/main/resources/config
backend/.opendid/did-verifier-server/source/did-verifier-server/src/main/resources/config
```

The local Docker flow copies these config files into an external compose folder,
then syncs them into Docker named volumes before starting each container. The
servers read `/app/config` from named volumes instead of macOS bind mounts so
Spring Boot can load YAML config reliably under Colima/Docker Desktop.

Important files to review:

- `application.yml`
- `application-database.yml`
- `application-wallet.yml`
- `application-blockchain.yml`
- `blockchain.properties` when present

Important values to set:

- PostgreSQL JDBC URL, username, password.
- Server port.
- Wallet file absolute path.
- Wallet password.
- Blockchain/API server URL.
- Issuer DID and key id.
- Verifier DID and key id.

## 4. Build Official Docker Images

Build the official Docker images:

```bash
cd backend
npm run opendid:build-images
```

## 5. Prepare Compose Folder

Generate the local compose workspace:

```bash
cd backend
npm run opendid:prepare
npm run opendid:patch-local
```

This copies the official config files into:

```text
backend/.opendid/compose/issuer-config
backend/.opendid/compose/verifier-config
```

Then edit the copied config files. Do not edit or commit generated wallet files,
passwords, keys, or deployed DB credentials.

`opendid:patch-local` applies local compose defaults:

- issuer/verifier Spring profile: `dev`.
- issuer DB: `jdbc:postgresql://opendid-issuer-db:5432/issuer`.
- verifier DB: `jdbc:postgresql://opendid-verifier-db:5432/verifier`.
- wallet paths: `/app/config/issuer.wallet`, `/app/config/verifier.wallet`.
- blockchain config path: `/app/config/blockchain.properties`.
- EVM URL: `http://host.docker.internal:8545`.
- TAS URL: `http://host.docker.internal:8090`.

Override local patch values with env vars when needed:

```bash
OPENDID_TAS_URL=http://host.docker.internal:8090 \
OPENDID_EVM_NETWORK_URL=http://host.docker.internal:8545 \
OPENDID_ISSUER_WALLET_PASSWORD='...' \
OPENDID_VERIFIER_WALLET_PASSWORD='...' \
npm run opendid:patch-local
```

Run:

```bash
cd backend
npm run opendid:doctor
npm run opendid:up
npm run opendid:ps
```

`opendid:up` syncs:

- `backend/.opendid/compose/issuer-config` -> `campass_opendid_issuer_config`
- `backend/.opendid/compose/verifier-config` -> `campass_opendid_verifier_config`

After a config edit, run `npm run opendid:restart` or `npm run opendid:up` again
so the named volumes receive the latest files.

Health checks:

```bash
curl http://localhost:8091/actuator/health
curl http://localhost:8092/actuator/health
```

Admin consoles:

- Issuer Admin: http://localhost:8091
- Verifier Admin: http://localhost:8092

Local initial admin data is loaded by the official Liquibase changelog:

- login id: `admin@opendid.omnione.net`
- role: `ROOT`
- password reset: required on first setup

The stored initial password hash is the SHA-256 value for `password`. The admin
UI is expected to handle the client-side password hashing flow. For direct API
checks, send the SHA-256 hash as `loginPassword`; do not use this default
credential outside local development.

Useful compose helpers:

```bash
npm run opendid:inspect-api-docs
npm run opendid:export-env
npm run opendid:logs
npm run opendid:restart
npm run opendid:down
```

`opendid:inspect-api-docs` checks the configured issue/revoke/verify paths
against the running issuer/verifier OpenAPI specs.

`opendid:export-env` reads the local issuer/verifier databases and prints
CamPass `.env` candidates for issuer DID, VC plan IDs, issue profile IDs, and
verifier policy IDs.

## 6. Connect CamPass Backend

Set CamPass backend `.env`:

```env
OPENDID_MODE="self_hosted"
OPENDID_CREDENTIAL_ISSUANCE_ENABLED="false"
OPENDID_VERIFICATION_ENABLED="false"
OPENDID_CREDENTIAL_ISSUE_MODE="official_wallet"
OPENDID_CREDENTIAL_VERIFY_MODE="official_vp"
OPENDID_ISSUER_BASE_URL="http://localhost:8091"
OPENDID_VERIFIER_BASE_URL="http://localhost:8092"
OPENDID_ISSUER_DID="did:omnione:..."
OPENDID_ISSUER_KID="..."
OPENDID_ISSUER_SERVICE_ID="campass"
OPENDID_CREDENTIAL_ISSUE_PATH="/issuer/api/v1/issue-vc"
OPENDID_CREDENTIAL_REVOKE_PATH="/issuer/api/v1/revoke-vc"
OPENDID_CREDENTIAL_VERIFY_PATH="/verifier/api/v1/request-verify"
OPENDID_ENTRY_VC_PLAN_ID="..."
OPENDID_STUDENT_VC_PLAN_ID="..."
OPENDID_STAFF_VC_PLAN_ID="..."
OPENDID_ADMIN_VC_PLAN_ID="..."
```

Keep `OPENDID_CREDENTIAL_ISSUANCE_ENABLED=false` and
`OPENDID_VERIFICATION_ENABLED=false` until the official holder wallet protocol is
connected end to end. The self-hosted issuer/verifier APIs are not simple direct
server-to-server JSON endpoints:

- `official_wallet` issuance needs the holder wallet issue flow.
- `official_vp` verification needs the holder wallet encrypted VP flow.
- `custom_direct` / `custom_status` are only for a compatible adapter endpoint
  that accepts CamPass' normalized backend payloads.

Check sanitized status as a super admin:

```http
GET /opendid/status
GET /opendid/status?probe=true
```

With `probe=true`, the backend checks both health endpoints and whether the
configured issue/revoke/verify paths exist in each server's `/api-docs`.

Wallet flow helper APIs exposed by CamPass:

```http
POST /opendid/wallet/issue-offer
POST /opendid/wallet/issue-profile
POST /opendid/wallet/verify-offer
POST /opendid/wallet/verify-profile
```

`issue-offer` must be called with a CamPass credential id owned by the
authenticated user. The backend resolves the matching OpenDID VC plan id and
returns the official issuer offer payload. `verify-offer` resolves the matching
verifier policy id and returns the official verifier offer payload.

## 7. API Mapping

CamPass currently maps credential issuance to a configurable single call:

```text
CredentialIssuerService.issue*Credential()
-> OpenDidCredentialProvider.issueCredential()
-> {OPENDID_ISSUER_BASE_URL}{OPENDID_CREDENTIAL_ISSUE_PATH}
```

The official Issuer protocol includes multiple sequential calls:

```text
request-offer
inspect-propose-issue
generate-issue-profile
issue-vc
complete-vc
issue-vc-result
```

For the hackathon backend, keep CamPass APIs stable and adapt inside
`OpenDidCredentialProvider` after we confirm which official path or custom
non-standard endpoint will be used for server-to-server issuance.

## 8. Credential Plan Checklist

In the official Issuer Admin console, create or confirm:

- CamPass Entry VC schema and VC plan.
- CamPass Adult VC schema and VC plan.
- CamPass Student VC schema and VC plan.
- CamPass Staff VC schema and VC plan.
- CamPass Admin VC schema and VC plan.

In the official Verifier Admin console, create or confirm policies for:

- entry verification.
- adult verification.
- student verification.
- staff verification.
- admin verification.

Then copy IDs into `backend/.env`:

```env
OPENDID_ENTRY_SCHEMA_NAME="campass_entry"
OPENDID_ENTRY_VC_PLAN_ID="..."
OPENDID_ENTRY_VERIFY_POLICY_ID="..."

OPENDID_STUDENT_SCHEMA_NAME="campass_student"
OPENDID_STUDENT_VC_PLAN_ID="..."
OPENDID_STUDENT_VERIFY_POLICY_ID="..."
```

## 9. Do Not Expose

Never put these values in frontend code, QR payloads, screenshots, or git:

- issuer wallet files.
- verifier wallet files.
- wallet passwords.
- issuer private keys.
- OpenDID API tokens.
- database passwords for deployed environments.
