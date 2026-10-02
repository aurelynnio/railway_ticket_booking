/**
 * Shared secret-strength checks.
 *
 * These exist because a placeholder that merely *looks* long used to pass the
 * production guard: `replace-with-a-random-secret-of-at-least-32-characters`
 * is 54 characters and does not contain `change-me`, so it was accepted and the
 * service booted with a secret that is public in the repository.
 *
 * Treat any repo-visible or guessable value as a hard failure everywhere, so a
 * misconfigured deploy fails closed instead of silently running insecure.
 */

/** Minimum acceptable length for an HMAC signing secret. */
export const MIN_SECRET_LENGTH = 32;

/**
 * Fragments that mark a value as a template/placeholder rather than a secret.
 * Matched case-insensitively as substrings.
 */
const PLACEHOLDER_FRAGMENTS = [
  'change-me',
  'change_me',
  'changeme',
  'replace-with',
  'replace_with',
  'replaceme',
  'placeholder',
  'your-secret',
  'your_secret',
  'your-key',
  'your_key',
  'insert-',
  'todo',
  'xxxxxxxx',
  'aaaaaaaa',
  'example',
  'sample',
  'dummy',
  'test-secret',
  'test_secret',
  'insecure',
];

/** Distinct characters required, to reject low-entropy values like "aaaa...". */
const MIN_DISTINCT_CHARACTERS = 12;

/**
 * Returns a human-readable reason when `secret` is unusable, or `null` when it
 * is acceptable. Callers should fail fast on a non-null result.
 */
export function describeWeakJwtSecret(secret: string): string | null {
  const value = secret.trim();

  if (value.length < MIN_SECRET_LENGTH) {
    return `must be at least ${MIN_SECRET_LENGTH} characters (got ${value.length})`;
  }

  const lowered = value.toLowerCase();
  const fragment = PLACEHOLDER_FRAGMENTS.find((entry) =>
    lowered.includes(entry),
  );
  if (fragment) {
    return `looks like a placeholder (contains "${fragment}")`;
  }

  const distinctCharacters = new Set(value).size;
  if (distinctCharacters < MIN_DISTINCT_CHARACTERS) {
    return `has too little entropy (only ${distinctCharacters} distinct characters)`;
  }

  return null;
}
