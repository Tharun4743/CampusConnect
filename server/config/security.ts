/**
 * Central security configuration. Fails fast when misconfigured.
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) return secret;
  throw new Error("JWT_SECRET environment variable is required.");
}

export function assertSecurityConfigAtStartup(): void {
  getJwtSecret();
}

/** Allowed CORS origin for cookie-based auth. Never allows null origin. */
export function getAllowedOrigin(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
}
