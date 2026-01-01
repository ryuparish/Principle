import { randomBytes } from 'crypto';

/**
 * Generate a URL-friendly share slug from a map name
 * Format: {sanitized-name}-{random-8-chars}
 * Example: "introduction-to-react-a7f3c2b1"
 */
export function generateShareSlug(mapName: string): string {
  // 1. Convert to URL-friendly format
  const baseSlug = mapName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with dash
    .replace(/^-|-$/g, '')         // Trim dashes
    .slice(0, 50);                 // Max 50 chars

  // 2. Add random suffix for uniqueness
  const randomSuffix = randomBytes(4).toString('hex');

  return `${baseSlug}-${randomSuffix}`;
}

/**
 * Generate a cryptographically secure share token
 * Used for unlisted maps (secret link sharing)
 * Returns 32-byte token in base64url format
 */
export function generateShareToken(): string {
  return randomBytes(32).toString('base64url');
}
