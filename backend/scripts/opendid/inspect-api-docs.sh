#!/usr/bin/env bash
set -euo pipefail

ISSUER_BASE_URL="${OPENDID_ISSUER_BASE_URL:-http://localhost:8091}"
VERIFIER_BASE_URL="${OPENDID_VERIFIER_BASE_URL:-http://localhost:8092}"
ISSUE_PATH="${OPENDID_CREDENTIAL_ISSUE_PATH:-/issuer/api/v1/issue-vc}"
REVOKE_PATH="${OPENDID_CREDENTIAL_REVOKE_PATH:-/issuer/api/v1/revoke-vc}"
VERIFY_PATH="${OPENDID_CREDENTIAL_VERIFY_PATH:-/verifier/api/v1/request-verify}"
ISSUE_OFFER_PATH="${OPENDID_ISSUE_OFFER_PATH:-/issuer/api/v1/request-offer}"
ISSUE_PROFILE_PATH="${OPENDID_ISSUE_PROFILE_PATH:-/issuer/api/v1/generate-issue-profile}"
VERIFY_OFFER_PATH="${OPENDID_VERIFY_OFFER_PATH:-/verifier/api/v1/request-offer-qr}"
VERIFY_PROFILE_PATH="${OPENDID_VERIFY_PROFILE_PATH:-/verifier/api/v1/request-profile}"

require_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "$command_name is required." >&2
    exit 1
  fi
}

fetch_api_docs() {
  local base_url="$1"
  local output_file="$2"
  curl -fsS "${base_url%/}/api-docs" -o "$output_file"
}

require_command curl
require_command node

ISSUER_DOCS="$(mktemp)"
VERIFIER_DOCS="$(mktemp)"
trap 'rm -f "$ISSUER_DOCS" "$VERIFIER_DOCS"' EXIT

fetch_api_docs "$ISSUER_BASE_URL" "$ISSUER_DOCS"
fetch_api_docs "$VERIFIER_BASE_URL" "$VERIFIER_DOCS"

node - "$ISSUER_DOCS" "$VERIFIER_DOCS" "$ISSUE_PATH" "$REVOKE_PATH" "$VERIFY_PATH" "$ISSUE_OFFER_PATH" "$ISSUE_PROFILE_PATH" "$VERIFY_OFFER_PATH" "$VERIFY_PROFILE_PATH" <<'NODE'
const fs = require('fs');

const [
  ,
  ,
  issuerDocsPath,
  verifierDocsPath,
  issuePath,
  revokePath,
  verifyPath,
  issueOfferPath,
  issueProfilePath,
  verifyOfferPath,
  verifyProfilePath,
] = process.argv;

const issuerDocs = JSON.parse(fs.readFileSync(issuerDocsPath, 'utf8'));
const verifierDocs = JSON.parse(fs.readFileSync(verifierDocsPath, 'utf8'));

function printCheck(label, docs, paths) {
  console.log(`\n${label}`);
  for (const path of paths) {
    const methods = docs.paths?.[path];
    if (!methods) {
      console.log(`MISS ${path}`);
      continue;
    }

    console.log(`OK   ${path} [${Object.keys(methods).join(', ')}]`);
  }
}

function printMatching(label, docs, prefix) {
  const paths = Object.keys(docs.paths ?? {})
    .filter((path) => path.startsWith(prefix))
    .sort();

  console.log(`\n${label} exposed paths`);
  for (const path of paths) {
    console.log(path);
  }
}

printCheck('Configured issuer paths', issuerDocs, [
  issueOfferPath,
  issueProfilePath,
  issuePath,
  revokePath,
]);
printCheck('Configured verifier paths', verifierDocs, [
  verifyOfferPath,
  verifyProfilePath,
  verifyPath,
]);
printMatching('Issuer protocol', issuerDocs, '/issuer/api/v1/');
printMatching('Verifier protocol', verifierDocs, '/verifier/api/v1/');
NODE
