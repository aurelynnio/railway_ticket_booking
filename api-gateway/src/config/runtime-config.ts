type Environment = NodeJS.ProcessEnv;

const PLACEHOLDER_VALUES = new Set([
  '',
  'change-me',
  'test_tmn_code',
  'test_secure_secret',
  'replace-with-vnpay-tmn-code',
  'replace-with-vnpay-secret',
]);

function requireValue(environment: Environment, name: string): string {
  const value = environment[name]?.trim() ?? '';

  if (PLACEHOLDER_VALUES.has(value.toLowerCase())) {
    throw new Error(`${name} must be configured when NODE_ENV=production`);
  }

  return value;
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

  requireHttpsUrl(environment, 'CLIENT_ORIGIN');
  requireValue(environment, 'RABBITMQ_URL');
  requireValue(environment, 'VNPAY_TMN_CODE');
  requireValue(environment, 'VNPAY_SECURE_SECRET');
  requireHttpsUrl(environment, 'VNPAY_PUBLIC_BASE_URL');

  if (environment.VNPAY_TEST_MODE === 'true') {
    throw new Error('VNPAY_TEST_MODE must be false when NODE_ENV=production');
  }
}
