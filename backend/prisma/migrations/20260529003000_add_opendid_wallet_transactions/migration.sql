-- CreateEnum
CREATE TYPE "OpenDidWalletFlowType" AS ENUM ('issue', 'verify');

-- CreateEnum
CREATE TYPE "OpenDidWalletFlowStatus" AS ENUM ('offer_created', 'profile_requested', 'request_submitted', 'completed', 'failed', 'expired');

-- CreateTable
CREATE TABLE "opendid_wallet_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "credential_id" TEXT,
    "festival_id" TEXT,
    "credential_type" "CredentialType" NOT NULL,
    "flow_type" "OpenDidWalletFlowType" NOT NULL,
    "status" "OpenDidWalletFlowStatus" NOT NULL DEFAULT 'offer_created',
    "request_id" TEXT,
    "tx_id" TEXT,
    "offer_id" TEXT,
    "vc_plan_id" TEXT,
    "policy_id" TEXT,
    "holder_did" TEXT,
    "payload_json" JSONB,
    "profile_json" JSONB,
    "result_json" JSONB,
    "raw_json" JSONB,
    "error_code" TEXT,
    "error_message" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opendid_wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "opendid_wallet_transactions_user_id_flow_type_status_idx" ON "opendid_wallet_transactions"("user_id", "flow_type", "status");

-- CreateIndex
CREATE INDEX "opendid_wallet_transactions_credential_id_idx" ON "opendid_wallet_transactions"("credential_id");

-- CreateIndex
CREATE INDEX "opendid_wallet_transactions_festival_id_credential_type_flow_type_idx" ON "opendid_wallet_transactions"("festival_id", "credential_type", "flow_type");

-- CreateIndex
CREATE INDEX "opendid_wallet_transactions_tx_id_idx" ON "opendid_wallet_transactions"("tx_id");

-- CreateIndex
CREATE INDEX "opendid_wallet_transactions_offer_id_idx" ON "opendid_wallet_transactions"("offer_id");

-- CreateIndex
CREATE INDEX "opendid_wallet_transactions_expires_at_idx" ON "opendid_wallet_transactions"("expires_at");

-- AddForeignKey
ALTER TABLE "opendid_wallet_transactions" ADD CONSTRAINT "opendid_wallet_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opendid_wallet_transactions" ADD CONSTRAINT "opendid_wallet_transactions_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "credentials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opendid_wallet_transactions" ADD CONSTRAINT "opendid_wallet_transactions_festival_id_fkey" FOREIGN KEY ("festival_id") REFERENCES "festivals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
