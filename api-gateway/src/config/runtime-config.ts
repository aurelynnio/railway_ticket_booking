type Environment = NodeJS.ProcessEnv;

/**
 * Values that are placeholders rather than real configuration. Matched exactly
 * (case-insensitively) before the substring check below.
 */
const PLACEHOLDER_VALUES = new Set([
  '',
  'change-me',
  'test_tmn_code',
  'test_secure_secret',
  'replace-with-vnpay-tmn-code',
  'replace-with-vnpay-secret',
]);

/**
 * Fragments that mark a value as a template. Substring matching catches
 * placeholders that merely look long enough to pass a length check — the exact
 * gap that let `replace-with-a-random-secret-of-at-least-32-characters` be used
 * as a production JWT secret.
 */
const PLACEHOLDER_FRAGMENTS = [
  'change-me',
  'change_me',
  'changeme',
  'replace-with',
  'replace_with',
  'placeholder',
  'your-',
  'your_',
];

function isPlaceholderValue(value: string): boolean {
  const lowered = value.toLowerCase();
  return (
    PLACEHOLDER_VALUES.has(lowered) ||
    PLACEHOLDER_FRAGMENTS.some((fragment) => lowered.includes(fragment))
  );
}

function requireValue(environment: Environment, name: string): string {
  const value = environment[name]?.trim() ?? '';

  if (isPlaceholderValue(value)) {
    throw new Error(`${name} must be configured when NODE_ENV=production`);
  }

  return value;
}

/**
 * Validates a comma-separated origin allow-list. Every entry must be an HTTPS
 * URL, and a wildcard is rejected because the gateway authenticates with
 * cookies (`credentials: true`), where a wildcard origin is never safe.
 */
function requireHttpsOriginList(environment: Environment, name: string): void {
  const value = requireValue(environment, name);
  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  for (const origin of origins) {
    if (origin === '*') {
      throw new Error(
        `${name} cannot be a wildcard when cookie credentials are enabled`,
      );
    }

    try {
      if (new URL(origin).protocol !== 'https:') {
        throw new Error('URL must use HTTPS');
      }
    } catch {
      throw new Error(
        `${name} must be a valid HTTPS URL when NODE_ENV=production`,
      );
    }
  }
}

function requireHttpsUrl(environment: Environment, name: string): void {
  const value = requireValue(environment, name);

  try {
    if (new URL(value).protocol !== 'https:') {
      throw new Error('URL must use HTTPS');
    }
  } catch {
    throw new Error(`${name} must be a valid HTTPS URL when NODE_ENV=production`);
  }
}

export function validateApiGatewayRuntimeConfig(
  environment: Environment = process.env,
): void {
  if (environment.NODE_ENV !== 'production') {
    return;
  }

  requireHttpsOriginList(environment, 'CLIENT_ORIGIN');
  requireValue(environment, 'RABBITMQ_URL');
  requireValue(environment, 'VNPAY_TMN_CODE');
  requireValue(environment, 'VNPAY_SECURE_SECRET');
  requireHttpsUrl(environment, 'VNPAY_PUBLIC_BASE_URL');

  if (environment.VNPAY_TEST_MODE === 'true') {
    throw new Error('VNPAY_TEST_MODE must be false when NODE_ENV=production');
  }
}
