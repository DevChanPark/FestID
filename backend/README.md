# CamPass/FestID Backend

NestJS backend core for the CamPass/FestID hackathon service.

This project intentionally does not include mock mobile ID authentication. Until the real mobile ID, OmniOne CX, or RaonSecure SDK documentation is wired in, provider implementations return `PROVIDER_NOT_IMPLEMENTED`.

## Core Flow

```txt
Mobile ID SDK verification
-> AuthResult normalization
-> User lookup/create
-> DID create/link
-> Service VC issue/verify
-> Short QR token
-> Staff scope + credential + usage validation
```

## First Commands

```bash
npm install
npm run db:up
npm run db:deploy
npm run prisma:generate
npm run integration:check
npm run build
npm run start:dev
```

## Local Environment

- Postgres runs through `docker-compose.yml` on `localhost:5432`.
- `.env.example` is the template for local secrets.
- `.env` is intentionally ignored by Git.
- Seed/super-admin access can be bootstrapped by setting `SEED_ADMIN_USER_IDS` or `SEED_ADMIN_DIDS` after a real mobile ID login creates the first user.
- `npm run dev:bootstrap-data` can create demo festival/booth/template data for an existing real user. It does not create mock auth, fake users, or fake credentials.
- Local file uploads are stored under `uploads/` and served from `/uploads/...`.

See `docs/local-api-flow.md` for the local API flow.
See `docs/mobile-id-provider-integration.md` for the SDK integration contract.
See `docs/frontend-integration-guide.md` for admin web/mobile app API contracts.
See `docs/external-values-and-runtime-values.md` for values that are defaults,
external setup outputs, frontend-owned values, or runtime-created values.
See `docs/opendid-admin-console-setup.md` for OpenDID console setup.
See `docs/e2e-test-checklist.md` for the end-to-end demo checklist.
