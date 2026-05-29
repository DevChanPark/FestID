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

const credentialTypes = ['ENTRY', 'ADULT', 'STUDENT', 'STAFF', 'ADMIN'];

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
  const value = env[key];
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function isPlaceholder(env, key) {
  const value = String(env[key] ?? '').trim();
  return (
    value === '' ||
    value === '...' ||
    value.includes('replace-me') ||
    value.includes('did:campass:issuer')
  );
}

function checkGroup(title, checks, env) {
  const rows = checks.map((check) => {
    const filled = isFilled(env, check.key);
    const placeholder = filled && isPlaceholder(env, check.key);
    const ok = filled && !placeholder;
    const required = check.required !== false;
    return {
      key: check.key,
      label: check.label,
      required,
      ok,
      status: ok ? 'OK' : required ? 'MISS' : 'WARN',
    };
  });

  printGroup(title, rows);

  return {
    errors: rows.filter((row) => row.required && !row.ok),
    warnings: rows.filter((row) => !row.required && !row.ok),
  };
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
    ],
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
    ],
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
    ],
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
    ]),
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
    ],
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
  console.log(`strict: ${strict ? 'yes' : 'no'}`);
  console.log(`probe: ${probe ? 'yes' : 'no'}`);

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
        env.OPENDID_ISSUER_BASE_URL,
        env.OPENDID_ISSUER_HEALTH_PATH,
      ),
      probeEndpoint(
        'OpenDID verifier',
        env.OPENDID_VERIFIER_BASE_URL,
        env.OPENDID_VERIFIER_HEALTH_PATH,
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
