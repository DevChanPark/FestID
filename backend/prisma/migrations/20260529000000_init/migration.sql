-- CreateEnum
CREATE TYPE "AuthProviderType" AS ENUM ('omnione_cx', 'mobile_id_sdk', 'raonsecure_sdk');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('admin_web', 'mobile_app');

-- CreateEnum
CREATE TYPE "AuthRequestStatus" AS ENUM ('pending', 'verified', 'expired', 'failed');

-- CreateEnum
CREATE TYPE "DidMethod" AS ENUM ('campass', 'omnione', 'opendid');

-- CreateEnum
CREATE TYPE "ProofStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "FestivalStatus" AS ENUM ('draft', 'active', 'ended');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('public', 'private');

-- CreateEnum
CREATE TYPE "BoothCategory" AS ENUM ('food', 'experience', 'goods', 'event', 'alcohol');

-- CreateEnum
CREATE TYPE "OperatingStatus" AS ENUM ('open', 'crowded', 'closing_soon', 'closed');

-- CreateEnum
CREATE TYPE "RequiredPermission" AS ENUM ('none', 'entry', 'student', 'adult', 'staff');

-- CreateEnum
CREATE TYPE "BenefitPolicy" AS ENUM ('none', 'once_per_user', 'once_per_day', 'student_once', 'adult_once');

-- CreateEnum
CREATE TYPE "CredentialType" AS ENUM ('entry', 'student', 'adult', 'staff', 'admin');

-- CreateEnum
CREATE TYPE "CredentialStatus" AS ENUM ('issued', 'pending', 'expired', 'revoked');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('active', 'expired', 'revoked');

-- CreateEnum
CREATE TYPE "StaffRequestStatus" AS ENUM ('requested', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "QrPurpose" AS ENUM ('entry', 'benefit', 'event', 'adult_check', 'student_check');

-- CreateEnum
CREATE TYPE "ScanPurpose" AS ENUM ('entry', 'benefit', 'event', 'adult_check', 'student_check');

-- CreateEnum
CREATE TYPE "VerificationResult" AS ENUM ('allowed', 'denied', 'expired', 'already_used', 'missing_credential', 'invalid_qr', 'missing_staff_scope');

-- CreateEnum
CREATE TYPE "UsageType" AS ENUM ('entry', 'benefit', 'event', 'adult_check', 'student_check');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "provider" "AuthProviderType" NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "birth_date" TEXT,
    "is_adult" BOOLEAN,
    "did" TEXT,
    "did_method" "DidMethod" NOT NULL DEFAULT 'campass',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_requests" (
    "id" TEXT NOT NULL,
    "provider" "AuthProviderType" NOT NULL,
    "client_type" "ClientType" NOT NULL,
    "nonce" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "status" "AuthRequestStatus" NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "school_name" TEXT NOT NULL,
    "organization_name" TEXT NOT NULL,
    "department" TEXT,
    "position" TEXT,
    "role" TEXT NOT NULL,
    "proof_status" "ProofStatus" NOT NULL DEFAULT 'pending',
    "proof_file_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_verifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "festival_id" TEXT NOT NULL,
    "school_name" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school_email" TEXT NOT NULL,
    "proof_file_url" TEXT,
    "status" "ProofStatus" NOT NULL DEFAULT 'pending',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "festivals" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "school_name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "operating_time" TEXT,
    "image_url" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'private',
    "status" "FestivalStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "festivals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booths" (
    "id" TEXT NOT NULL,
    "festival_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "BoothCategory" NOT NULL,
    "location" TEXT,
    "operating_status" "OperatingStatus" NOT NULL DEFAULT 'open',
    "current_waiting_count" INTEGER NOT NULL DEFAULT 0,
    "expected_wait_time" INTEGER,
    "required_permission" "RequiredPermission" NOT NULL DEFAULT 'none',
    "benefit_policy" "BenefitPolicy" NOT NULL DEFAULT 'none',
    "poster_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pass_templates" (
    "id" TEXT NOT NULL,
    "festival_id" TEXT NOT NULL,
    "type" "CredentialType" NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "verification_rule" JSONB,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pass_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credentials" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subject_did" TEXT NOT NULL,
    "issuer_did" TEXT NOT NULL,
    "festival_id" TEXT,
    "type" "CredentialType" NOT NULL,
    "status" "CredentialStatus" NOT NULL DEFAULT 'issued',
    "claims_json" JSONB NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_invites" (
    "id" TEXT NOT NULL,
    "festival_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "invite_code" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "scope_json" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_requests" (
    "id" TEXT NOT NULL,
    "invite_id" TEXT NOT NULL,
    "festival_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "requested_role" TEXT NOT NULL,
    "masked_did" TEXT NOT NULL,
    "status" "StaffRequestStatus" NOT NULL DEFAULT 'requested',
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "festival_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "purpose" "QrPurpose" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qr_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_logs" (
    "id" TEXT NOT NULL,
    "festival_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "user_id" TEXT,
    "booth_id" TEXT,
    "qr_token_id" TEXT,
    "scan_purpose" "ScanPurpose" NOT NULL,
    "result" "VerificationResult" NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_records" (
    "id" TEXT NOT NULL,
    "festival_id" TEXT NOT NULL,
    "booth_id" TEXT,
    "user_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "usage_type" "UsageType" NOT NULL,
    "usage_key" TEXT NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_did_key" ON "users"("did");

-- CreateIndex
CREATE UNIQUE INDEX "users_provider_provider_user_id_key" ON "users"("provider", "provider_user_id");

-- CreateIndex
CREATE INDEX "auth_requests_provider_status_idx" ON "auth_requests"("provider", "status");

-- CreateIndex
CREATE UNIQUE INDEX "admin_profiles_user_id_key" ON "admin_profiles"("user_id");

-- CreateIndex
CREATE INDEX "student_verifications_festival_id_status_idx" ON "student_verifications"("festival_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "student_verifications_user_id_festival_id_key" ON "student_verifications"("user_id", "festival_id");

-- CreateIndex
CREATE INDEX "festivals_status_visibility_idx" ON "festivals"("status", "visibility");

-- CreateIndex
CREATE INDEX "booths_festival_id_operating_status_idx" ON "booths"("festival_id", "operating_status");

-- CreateIndex
CREATE INDEX "pass_templates_festival_id_type_idx" ON "pass_templates"("festival_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "pass_templates_festival_id_type_key" ON "pass_templates"("festival_id", "type");

-- CreateIndex
CREATE INDEX "credentials_user_id_festival_id_type_status_idx" ON "credentials"("user_id", "festival_id", "type", "status");

-- CreateIndex
CREATE INDEX "credentials_subject_did_type_status_idx" ON "credentials"("subject_did", "type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "staff_invites_invite_code_key" ON "staff_invites"("invite_code");

-- CreateIndex
CREATE INDEX "staff_invites_festival_id_status_idx" ON "staff_invites"("festival_id", "status");

-- CreateIndex
CREATE INDEX "staff_requests_festival_id_status_idx" ON "staff_requests"("festival_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "staff_requests_user_id_festival_id_key" ON "staff_requests"("user_id", "festival_id");

-- CreateIndex
CREATE UNIQUE INDEX "qr_tokens_token_key" ON "qr_tokens"("token");

-- CreateIndex
CREATE INDEX "qr_tokens_festival_id_user_id_purpose_idx" ON "qr_tokens"("festival_id", "user_id", "purpose");

-- CreateIndex
CREATE INDEX "scan_logs_festival_id_created_at_idx" ON "scan_logs"("festival_id", "created_at");

-- CreateIndex
CREATE INDEX "scan_logs_staff_id_created_at_idx" ON "scan_logs"("staff_id", "created_at");

-- CreateIndex
CREATE INDEX "scan_logs_qr_token_id_idx" ON "scan_logs"("qr_token_id");

-- CreateIndex
CREATE INDEX "usage_records_festival_id_usage_type_used_at_idx" ON "usage_records"("festival_id", "usage_type", "used_at");

-- CreateIndex
CREATE UNIQUE INDEX "usage_records_festival_id_user_id_usage_type_usage_key_key" ON "usage_records"("festival_id", "user_id", "usage_type", "usage_key");

-- AddForeignKey
ALTER TABLE "admin_profiles" ADD CONSTRAINT "admin_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_verifications" ADD CONSTRAINT "student_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_verifications" ADD CONSTRAINT "student_verifications_festival_id_fkey" FOREIGN KEY ("festival_id") REFERENCES "festivals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "festivals" ADD CONSTRAINT "festivals_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booths" ADD CONSTRAINT "booths_festival_id_fkey" FOREIGN KEY ("festival_id") REFERENCES "festivals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pass_templates" ADD CONSTRAINT "pass_templates_festival_id_fkey" FOREIGN KEY ("festival_id") REFERENCES "festivals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_festival_id_fkey" FOREIGN KEY ("festival_id") REFERENCES "festivals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_invites" ADD CONSTRAINT "staff_invites_festival_id_fkey" FOREIGN KEY ("festival_id") REFERENCES "festivals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_invites" ADD CONSTRAINT "staff_invites_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_requests" ADD CONSTRAINT "staff_requests_invite_id_fkey" FOREIGN KEY ("invite_id") REFERENCES "staff_invites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_requests" ADD CONSTRAINT "staff_requests_festival_id_fkey" FOREIGN KEY ("festival_id") REFERENCES "festivals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_requests" ADD CONSTRAINT "staff_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_tokens" ADD CONSTRAINT "qr_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_tokens" ADD CONSTRAINT "qr_tokens_festival_id_fkey" FOREIGN KEY ("festival_id") REFERENCES "festivals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_logs" ADD CONSTRAINT "scan_logs_qr_token_id_fkey" FOREIGN KEY ("qr_token_id") REFERENCES "qr_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;
