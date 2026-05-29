#!/usr/bin/env node

const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');
const envPath = path.join(rootDir, '.env');
const envExamplePath = path.join(rootDir, '.env.example');
const strict = process.argv.includes('--strict');
const probe = process.argv.includes('--probe');
const target = readArg('--target') ?? process.env.INTEGRATION_TARGET ?? 'core';

const credentialTypes = ['ENTRY', 'ADULT', 'STUDENT', 'STAFF', 'ADMIN'];
const targetGroups = {
  core: ['core'],
  cx: ['core', 'cx'],
  opendid: ['core', 'opendid'],
  frontend: ['core', 'frontend'],
  e2e: ['core', 'cx', 'opendid', 'frontend'],
};
const fillableDefaults = {
  OMNIONE_CX_BASE_URL: 'https://cx.raonsecure.co.kr:18543',
  OMNIONE_CX_WEB_BASE_URL: 'https://cx.raonsecure.co.kr:17543/ent/esign',
  OMNIONE_CX_CONFIG_URL:
    'https://cx.raonsecure.co.kr:17543/ent/esign/config/config.mid.json',
  OMNIONE_CX_PROVIDER_ID: 'comdl_v1.5',
  OMNIONE_CX_SIGN_TYPE: 'ENT_MID',
  OMNIONE_CX_REQUEST_TYPE: 'WEB2APP',
  OMNIONE_CX_USE_CONVERTOR: 'false',
  OPENDID_ISSUER_BASE_URL: 'http://localhost:8091',
  OPENDID_VERIFIER_BASE_URL: 'http://localhost:8092',
  OPENDID_ISSUER_SERVICE_ID: 'campass',
  OPENDID_ISSUER_HEALTH_PATH: '/actuator/health',
  OPENDID_VERIFIER_HEALTH_PATH: '/actuator/health',
  OPENDID_ISSUE_OFFER_PATH: '/issuer/api/v1/request-offer',
  OPENDID_ISSUE_INSPECT_PROPOSE_PATH:
    '/issuer/api/v1/inspect-propose-issue',
  OPENDID_ISSUE_PROFILE_PATH: '/issuer/api/v1/generate-issue-profile',
  OPENDID_CREDENTIAL_ISSUE_PATH: '/issuer/api/v1/issue-vc',
  OPENDID_ISSUE_COMPLETE_PATH: '/issuer/api/v1/complete-vc',
  OPENDID_ISSUE_RESULT_PATH: '/issuer/api/v1/issue-vc/result',
  OPENDID_CREDENTIAL_REVOKE_PATH: '/issuer/api/v1/revoke-vc',
  OPENDID_VERIFY_OFFER_PATH: '/verifier/api/v1/request-offer-qr',
  OPENDID_VERIFY_PROFILE_PATH: '/verifier/api/v1/request-profile',
  OPENDID_CREDENTIAL_VERIFY_PATH: '/verifier/api/v1/request-verify',
  OPENDID_VERIFY_CONFIRM_PATH: '/verifier/api/v1/confirm-verify',
  ADMIN_WEB_ORIGIN: 'http://localhost:5173',
  MOBILE_APP_DEEP_LINK_SCHEME: 'campass',
  CAMPASS_QR_TTL_SECONDS: '180',
};

function readArg(name) {
  const exact = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (exact) {
    return exact.slice(name.length + 1);
  }

  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const env = {};
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    env[key] = unquote(rawValue.trim());
  }

  return env;
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function isFilled(env, key) {
  const value = effectiveValue(env, key);
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function isPlaceholder(env, key) {
  const value = String(effectiveValue(env, key) ?? '').trim();
  return (
    value === '' ||
    value === '...' ||
    value.includes('replace-me') ||
    value.includes('did:campass:issuer')
  );
}

function effectiveValue(env, key) {
  if (env[key] !== undefined && String(env[key]).trim() !== '') {
    return env[key];
  }

  return fillableDefaults[key];
}

function checkGroup(title, checks, env) {
  const rows = checks.map((check) => {
    const filled = isFilled(env, check.key);
    const placeholder = filled && isPlaceholder(env, check.key);
    const ok = filled && !placeholder;
    const usesDefault =
      !isFilledWithoutDefault(env, check.key) &&
      fillableDefaults[check.key] !== undefined;
    const inScope = isInTargetScope(check);
    const required = isRequiredForTarget(check);
    return {
      key: check.key,
      label: check.label,
      required,
      inScope,
      ok,
      usesDefault,
      status: ok ? (usesDefault ? 'DEF' : 'OK') : required ? 'MISS' : 'INFO',
    };
  });

  printGroup(title, rows);

  return {
    errors: rows.filter((row) => row.required && !row.ok),
    warnings: rows.filter((row) => row.inScope && !row.required && !row.ok),
  };
}

function isFilledWithoutDefault(env, key) {
  const value = env[key];
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function isRequiredForTarget(check) {
  if (check.required === false) {
    return false;
  }

  return isInTargetScope(check);
}

function isInTargetScope(check) {
  const scopes = targetGroups[target];
  if (!scopes) {
    return false;
  }

  return scopes.includes(check.scope ?? 'core');
}

function printGroup(title, rows) {
  console.log(`\n${title}`);
  for (const row of rows) {
    const suffix = row.label ? ` - ${row.label}` : '';
    console.log(`${row.status.padEnd(4)} ${row.key}${suffix}`);
  }
}

function buildChecks() {
  const checks = [];

  checks.push({
    title: 'Core backend',
    rows: [
      { key: 'DATABASE_URL' },
      { key: 'JWT_SECRET', label: 'must not be replace-me in shared demos' },
      { key: 'PUBLIC_BASE_URL' },
    ],
  });

  checks.push({
    title: 'OmniOne CX mobile ID',
    rows: [
      { key: 'OMNIONE_CX_BASE_URL' },
      { key: 'OMNIONE_CX_WEB_BASE_URL' },
      { key: 'OMNIONE_CX_CONFIG_URL' },
      { key: 'OMNIONE_CX_PROVIDER_ID' },
      { key: 'OMNIONE_CX_SIGN_TYPE' },
      { key: 'OMNIONE_CX_REQUEST_TYPE' },
      { key: 'OMNIONE_CX_USE_CONVERTOR' },
      { key: 'OMNIONE_CX_ZKP_TYPE', required: false },
    ].map((row) => ({ ...row, scope: 'cx' })),
  });

  checks.push({
    title: 'OpenDID self-hosted servers',
    rows: [
      { key: 'OPENDID_ISSUER_BASE_URL' },
      { key: 'OPENDID_VERIFIER_BASE_URL' },
      { key: 'OPENDID_ISSUER_DID' },
      { key: 'OPENDID_ISSUER_SERVICE_ID' },
      { key: 'OPENDID_ISSUER_HEALTH_PATH' },
      { key: 'OPENDID_VERIFIER_HEALTH_PATH' },
      { key: 'OPENDID_API_TOKEN', required: false },
      { key: 'OPENDID_ISSUER_KID', required: false },
    ].map((row) => ({ ...row, scope: 'opendid' })),
  });

  checks.push({
    title: 'OpenDID issuer/verifier paths',
    rows: [
      { key: 'OPENDID_ISSUE_OFFER_PATH' },
      { key: 'OPENDID_ISSUE_INSPECT_PROPOSE_PATH' },
      { key: 'OPENDID_ISSUE_PROFILE_PATH' },
      { key: 'OPENDID_CREDENTIAL_ISSUE_PATH' },
      { key: 'OPENDID_ISSUE_COMPLETE_PATH' },
      { key: 'OPENDID_ISSUE_RESULT_PATH' },
      { key: 'OPENDID_CREDENTIAL_REVOKE_PATH' },
      { key: 'OPENDID_VERIFY_OFFER_PATH' },
      { key: 'OPENDID_VERIFY_PROFILE_PATH' },
      { key: 'OPENDID_CREDENTIAL_VERIFY_PATH' },
      { key: 'OPENDID_VERIFY_CONFIRM_PATH' },
    ].map((row) => ({ ...row, scope: 'opendid' })),
  });

  checks.push({
    title: 'OpenDID VC plan and policy IDs',
    rows: credentialTypes.flatMap((type) => [
      { key: `OPENDID_${type}_SCHEMA_NAME` },
      { key: `OPENDID_${type}_VC_PLAN_ID` },
      { key: `OPENDID_${type}_VERIFY_POLICY_ID` },
      { key: `OPENDID_${type}_SCHEMA_ID`, required: false },
      { key: `OPENDID_${type}_ISSUE_PROFILE_ID`, required: false },
      { key: `OPENDID_${type}_CREDENTIAL_DEFINITION_ID`, required: false },
    ]).map((row) => ({ ...row, scope: 'opendid' })),
  });

  checks.push({
    title: 'Frontend contract values',
    rows: [
      { key: 'ADMIN_WEB_ORIGIN', required: false },
      { key: 'MOBILE_APP_DEEP_LINK_SCHEME', required: false },
      { key: 'ANDROID_PACKAGE_NAME', required: false },
      { key: 'IOS_BUNDLE_ID', required: false },
      { key: 'MOBILE_ID_REDIRECT_URI', required: false },
      { key: 'CAMPASS_QR_TTL_SECONDS', required: false },
    ].map((row) => ({ ...row, scope: 'frontend' })),
  });

  return checks;
}

async function probeEndpoint(label, baseUrl, healthPath) {
  if (!baseUrl || !healthPath) {
    return { label, ok: false, message: 'missing base URL or health path' };
  }

  const url = new URL(healthPath, withTrailingSlash(baseUrl));
  try {
    const result = await request(url);
    return {
      label,
      ok: result.statusCode >= 200 && result.statusCode < 300,
      message: `HTTP ${result.statusCode}`,
    };
  } catch (error) {
    return {
      label,
      ok: false,
      message: error instanceof Error ? error.message : 'request failed',
    };
  }
}

function request(url) {
  const transport = url.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const req = transport.get(url, { timeout: 5000 }, (res) => {
      res.resume();
      res.on('end', () => resolve({ statusCode: res.statusCode ?? 0 }));
    });
    req.on('timeout', () => {
      req.destroy(new Error('timeout'));
    });
    req.on('error', reject);
  });
}

function withTrailingSlash(value) {
  return value.endsWith('/') ? value : `${value}/`;
}

async function main() {
  const env = {
    ...parseEnvFile(envExamplePath),
    ...parseEnvFile(envPath),
    ...process.env,
  };
  const usingLocalEnv = fs.existsSync(envPath);

  console.log('CamPass integration readiness');
  console.log(`env file: ${usingLocalEnv ? envPath : `${envPath} missing, using .env.example defaults`}`);
  console.log(`target: ${target}`);
  console.log(`strict: ${strict ? 'yes' : 'no'}`);
  console.log(`probe: ${probe ? 'yes' : 'no'}`);
  console.log('status: OK=configured, DEF=using built-in local/default value, MISS=required for target, INFO=not required for target');
  console.log('targets: core, cx, opendid, frontend, e2e');

  const totals = buildChecks().reduce(
    (acc, group) => {
      const result = checkGroup(group.title, group.rows, env);
      acc.errors.push(...result.errors);
      acc.warnings.push(...result.warnings);
      return acc;
    },
    { errors: [], warnings: [] },
  );

  if (probe) {
    console.log('\nNetwork probes');
    const probes = await Promise.all([
      probeEndpoint(
        'OpenDID issuer',
        effectiveValue(env, 'OPENDID_ISSUER_BASE_URL'),
        effectiveValue(env, 'OPENDID_ISSUER_HEALTH_PATH'),
      ),
      probeEndpoint(
        'OpenDID verifier',
        effectiveValue(env, 'OPENDID_VERIFIER_BASE_URL'),
        effectiveValue(env, 'OPENDID_VERIFIER_HEALTH_PATH'),
      ),
    ]);
    for (const result of probes) {
      console.log(`${result.ok ? 'OK  ' : 'MISS'} ${result.label} - ${result.message}`);
      if (!result.ok) {
        totals.errors.push({ key: result.label });
      }
    }
  }

  console.log('\nSummary');
  console.log(`missing required: ${totals.errors.length}`);
  console.log(`missing optional: ${totals.warnings.length}`);

  console.log('\nRuntime-created values, not .env');
  for (const value of [
    'users.did',
    'staff_invites.invite_code',
    'staff_requests.id',
    'Staff VC subject DID and scope',
    'qr_tokens.token',
    'OpenDID walletTransactionId',
    'OpenDID txId / offerId / vcId',
  ]) {
    console.log(`- ${value}`);
  }

  if (totals.errors.length) {
    console.log('\nNext required values');
    for (const row of totals.errors.slice(0, 30)) {
      console.log(`- ${row.key}`);
    }
    if (totals.errors.length > 30) {
      console.log(`- ...and ${totals.errors.length - 30} more`);
    }
  }

  if (strict && totals.errors.length) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
