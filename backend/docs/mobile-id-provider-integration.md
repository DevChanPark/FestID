# Mobile ID Provider Integration

This backend does not include mock mobile ID authentication.

`omnione_cx` is implemented against the supplied OmniOne CX VC-Verifier API flow. `mobile_id_sdk` and `raonsecure_sdk` remain disabled until their real SDK/API documentation is added. The rest of the backend consumes only normalized `AuthResult`.

## Provider Status

```http
GET /auth/mobile-id/providers
```

Returns configuration readiness for:

- `omnione_cx`
- `mobile_id_sdk`
- `raonsecure_sdk`

The response lists required env keys and missing values. A configured provider is not automatically implemented; it only means env requirements are present.

## Auth Request Lifecycle

```txt
POST /auth/mobile-id/start
-> auth_requests row created with authRequestId, nonce, state, expiresAt
-> provider.startAuth() called
-> OmniOne CX returns official app/QR invocation payloads
-> non-OmniOne providers return PROVIDER_NOT_IMPLEMENTED until SDK docs are wired
```

```http
GET /auth/mobile-id/requests/:authRequestId
POST /auth/mobile-id/requests/expire-stale
```

The status response never returns nonce or state.

## OmniOne CX Defaults From The Guide

Use the guide values as local defaults until the hackathon operator issues
team-specific values:

```env
OMNIONE_CX_BASE_URL="https://cx.raonsecure.co.kr:18543"
OMNIONE_CX_WEB_BASE_URL="https://cx.raonsecure.co.kr:17543/ent/esign"
OMNIONE_CX_CONFIG_URL="https://cx.raonsecure.co.kr:17543/ent/esign/config/config.mid.json"
OMNIONE_CX_PROVIDER_ID="comdl_v1.5"
OMNIONE_CX_SIGN_TYPE="ENT_MID"
OMNIONE_CX_REQUEST_TYPE="WEB2APP"
OMNIONE_CX_USE_CONVERTOR="false"
```

## Required SDK Mapping

For non-OmniOne providers, when SDK docs are available, implement only the provider internals:

```txt
startAuth:
- provider auth endpoint or SDK invocation payload
- authRequestId passthrough
- nonce/state placement
- redirect/callback URI
- client/app identifier

verify:
- token/JWT/authCode/VP/eVP verification
- signature or JWKS/public key verification
- nonce/state claim verification
- provider user id mapping
- birthDate/isAdult mapping
- verifiedAt mapping
- provider error mapping
```

The provider must return:

```ts
interface AuthResult {
  provider: "omnione_cx" | "mobile_id_sdk" | "raonsecure_sdk";
  providerUserId: string;
  name?: string;
  phone?: string;
  birthDate?: string;
  isAdult?: boolean;
  verifiedAt: string;
  raw?: unknown;
}
```

Do not let raw SDK responses leak into user, DID, VC, QR, or report modules.

## Implemented OmniOne CX Verifier Flow

The supplied OmniOne CX VC-Verifier API manual uses an OACX server API flow, not a frontend-only SDK flow.

Backend-owned flow:

```txt
POST /auth/mobile-id/start
-> POST {OACX_BASE_URL}/oacx/api/v1.0/trans               create token + txId
-> POST {OACX_BASE_URL}/oacx/api/v1.0/authen/app/request  WebToApp/AppToApp
   or POST {OACX_BASE_URL}/oacx/api/v1.0/authen/qr/request
-> store authRequestId, token, txId, cxId, provider, nonce/state
-> return deep links, m200 message, or QR image payload to frontend
```

Frontend-owned action:

```txt
Open returned WebToApp/AppToApp link or show returned QR image.
The user submits mobile ID from the official mobile ID app.
```

Backend-owned verification:

```txt
POST /auth/mobile-id/verify
-> POST {OACX_BASE_URL}/oacx/api/v1.0/authen/app/result
   or POST {OACX_BASE_URL}/oacx/api/v1.0/authen/qr/result
-> POST {OACX_BASE_URL}/oacx/api/v1.0/trans/token
-> normalize parsed token payload to AuthResult
```

Important:

- Do not return parsed personal identity payloads to the frontend.
- Store OACX `token`, `txId`, and `cxId` server-side with `authRequestId`.
- The frontend should only receive UI invocation data such as `androidLink`, `iosLink`, `ssPayLink`, `m200`, or `qrBase64`.
- `provider_id` examples from the manual include `coidentitydocument`, `comdl`, `comrc`, `comnh`, and `coresidence`; request APIs use values like `comdl_v1.5`.
- `AuthResult.providerUserId` maps to `ci` first, then `userDid`, `vcId`, `cxid`, or `txid`.
- `AuthResult.birthDate` maps from `birth`.
- `AuthResult.phone` maps from `telno`.
- `AuthResult.isAdult` uses direct adult flags when present, otherwise derives age from `birth`.

Start request options accepted by `POST /auth/mobile-id/start`:

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

For QR authentication, use `"authFlow": "qr"`.

## Environment Keys

```txt
OMNIONE_CX_BASE_URL
OMNIONE_CX_WEB_BASE_URL
OMNIONE_CX_CONFIG_URL
OMNIONE_CX_PROVIDER_ID
OMNIONE_CX_SIGN_TYPE
OMNIONE_CX_REQUEST_TYPE
OMNIONE_CX_USE_CONVERTOR
OMNIONE_CX_ZKP_TYPE

MOBILE_ID_SDK_BASE_URL
MOBILE_ID_SDK_CLIENT_ID
MOBILE_ID_SDK_CLIENT_SECRET
MOBILE_ID_SDK_REDIRECT_URI
MOBILE_ID_SDK_JWKS_URL

RAONSECURE_SDK_BASE_URL
RAONSECURE_SDK_CLIENT_ID
RAONSECURE_SDK_CLIENT_SECRET
RAONSECURE_SDK_REDIRECT_URI
RAONSECURE_SDK_JWKS_URL
```
