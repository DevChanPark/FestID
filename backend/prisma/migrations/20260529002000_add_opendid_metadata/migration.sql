ALTER TABLE "users"
ADD COLUMN "external_did" TEXT,
ADD COLUMN "did_document_json" JSONB,
ADD COLUMN "did_registered_at" TIMESTAMP(3),
ADD COLUMN "did_registration_tx_id" TEXT;

ALTER TABLE "credentials"
ADD COLUMN "credential_provider" TEXT NOT NULL DEFAULT 'internal',
ADD COLUMN "external_credential_id" TEXT,
ADD COLUMN "vc_jwt" TEXT,
ADD COLUMN "vc_document_json" JSONB,
ADD COLUMN "proof_json" JSONB,
ADD COLUMN "schema_id" TEXT,
ADD COLUMN "issuer_service_id" TEXT,
ADD COLUMN "credential_status_id" TEXT,
ADD COLUMN "external_status" TEXT,
ADD COLUMN "issued_tx_id" TEXT,
ADD COLUMN "revoked_tx_id" TEXT;

CREATE UNIQUE INDEX "users_external_did_key" ON "users"("external_did");
CREATE UNIQUE INDEX "credentials_external_credential_id_key" ON "credentials"("external_credential_id");
CREATE INDEX "credentials_credential_provider_type_status_idx" ON "credentials"("credential_provider", "type", "status");
CREATE INDEX "credentials_credential_status_id_idx" ON "credentials"("credential_status_id");
