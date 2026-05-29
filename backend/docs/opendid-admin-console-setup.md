# OpenDID Admin Console Setup

This checklist turns the self-hosted OmniOneID issuer/verifier servers into
values CamPass can use.

## 1. Start Servers

```bash
cd backend
npm run opendid:doctor
npm run opendid:up
npm run opendid:inspect-api-docs
```

Open:

- Issuer Admin: `http://localhost:8091`
- Verifier Admin: `http://localhost:8092`

Default local admin data is documented in
`docs/opendid-self-hosted-runbook.md`. Reset the password before using the
console.

## 2. Issuer Setup

In the issuer admin console:

1. Register or confirm issuer entity information.
2. Register issuer DID to the trust anchor when required.
3. Create or import issuer wallet.
4. Confirm wallet file exists in:

```text
backend/.opendid/compose/issuer-config/issuer.wallet
```

5. Create VC schemas and VC plans.

Recommended schema names:

| CamPass VC | Schema name | Env value |
| --- | --- | --- |
| Entry | `campass_entry` | `OPENDID_ENTRY_SCHEMA_NAME` |
| Adult | `campass_adult` | `OPENDID_ADULT_SCHEMA_NAME` |
| Student | `campass_student` | `OPENDID_STUDENT_SCHEMA_NAME` |
| Staff | `campass_staff` | `OPENDID_STAFF_SCHEMA_NAME` |
| Admin | `campass_admin` | `OPENDID_ADMIN_SCHEMA_NAME` |

Record:

```txt
OPENDID_ISSUER_DID
OPENDID_ISSUER_KID
OPENDID_ENTRY_VC_PLAN_ID
OPENDID_ADULT_VC_PLAN_ID
OPENDID_STUDENT_VC_PLAN_ID
OPENDID_STAFF_VC_PLAN_ID
OPENDID_ADMIN_VC_PLAN_ID
```

## 3. Verifier Setup

In the verifier admin console:

1. Register or confirm verifier entity information.
2. Register verifier DID to the trust anchor when required.
3. Create or import verifier wallet.
4. Confirm wallet file exists in:

```text
backend/.opendid/compose/verifier-config/verifier.wallet
```

5. Create verify policies for each CamPass VC.

Record:

```txt
OPENDID_ENTRY_VERIFY_POLICY_ID
OPENDID_ADULT_VERIFY_POLICY_ID
OPENDID_STUDENT_VERIFY_POLICY_ID
OPENDID_STAFF_VERIFY_POLICY_ID
OPENDID_ADMIN_VERIFY_POLICY_ID
```

## 4. Export Candidate Env

After the official issuer/verifier DB contains schemas, plans, and policies:

```bash
cd backend
npm run opendid:export-env
```

Copy confirmed values into `.env`. Do not copy TODO placeholders blindly.

Then run:

```bash
npm run integration:check
npm run integration:check:probe
npm run opendid:inspect-api-docs
```

## 5. Enable Modes

For official holder wallet protocol, keep:

```env
OPENDID_CREDENTIAL_ISSUE_MODE="official_wallet"
OPENDID_CREDENTIAL_VERIFY_MODE="official_vp"
```

Enable only after a real mobile wallet flow can complete:

```env
OPENDID_CREDENTIAL_ISSUANCE_ENABLED="true"
OPENDID_VERIFICATION_ENABLED="true"
```

If no holder wallet is connected yet, leave both flags `false`. The CamPass
wallet bridge APIs can still be used for integration testing.

## 6. Data Safety

Never commit or send these in chat screenshots:

- `issuer.wallet`
- `verifier.wallet`
- wallet passwords
- issuer private keys
- verifier private keys
- deployed DB passwords
- production API tokens

QR payloads must stay in this form:

```text
campass://qr?token=short-lived-token
```

Do not put VC documents or personal identity claims in QR payloads.
