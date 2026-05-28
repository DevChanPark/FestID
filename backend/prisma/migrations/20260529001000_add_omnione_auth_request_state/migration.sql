ALTER TABLE "auth_requests"
ADD COLUMN "oacx_token" TEXT,
ADD COLUMN "oacx_tx_id" TEXT,
ADD COLUMN "oacx_cx_id" TEXT,
ADD COLUMN "oacx_provider" TEXT,
ADD COLUMN "oacx_request_type" TEXT,
ADD COLUMN "oacx_auth_flow" TEXT,
ADD COLUMN "oacx_use_convertor" BOOLEAN,
ADD COLUMN "oacx_status" TEXT,
ADD COLUMN "oacx_result_code" TEXT;

CREATE INDEX "auth_requests_oacx_tx_id_idx" ON "auth_requests"("oacx_tx_id");
CREATE INDEX "auth_requests_oacx_cx_id_idx" ON "auth_requests"("oacx_cx_id");
