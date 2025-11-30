// Default API base - use Docker internal networking if available, fallback to localhost
const DEFAULT_API_BASE = process.env.NEXT_PUBLIC_API_BASE || 
  (process.env.NODE_ENV === 'production' && process.env.DOCKER_ENV === 'true' 
    ? 'http://backend:8080/api/v1' 
    : 'http://localhost:8080/api/v1');

const API_VERSION_REGEX = /\/api\/v\d+(?:\/|$)/i;
const API_VERSION_CAPTURE_REGEX = /^(.*?\/api\/v\d+)(?:\/.*)?$/i;
const API_SEGMENT_REGEX = /\/api(?:\/|$)/i;

const stripTrailingSlashes = (value: string) => value.replace(/\/+$/, '');
const stripLeadingSlashes = (value: string) => value.replace(/^\/+/, '');

/**
 * Normalise the API base URL so that it always points to the FastAPI
 * `/api/v1` prefix regardless of how the environment variable is provided.
 */
export function resolveApiBase(rawBase?: string | null): string {
  if (!rawBase || !rawBase.trim()) {
    return DEFAULT_API_BASE;
  }

  const cleaned = stripTrailingSlashes(rawBase.trim());
  const lower = cleaned.toLowerCase();

  if (API_VERSION_REGEX.test(lower)) {
    const match = cleaned.match(API_VERSION_CAPTURE_REGEX);
    return match ? match[1]! : cleaned;
  }

  if (API_SEGMENT_REGEX.test(lower)) {
    return `${cleaned}/v1`;
  }

  return `${cleaned}/api/v1`;
}

export const API_BASE = resolveApiBase(process.env.NEXT_PUBLIC_API_BASE);

export function buildApiUrl(path: string): string {
  if (!path) {
    return API_BASE;
  }

  const normalisedPath = stripLeadingSlashes(path);
  return `${stripTrailingSlashes(API_BASE)}/${normalisedPath}`;
}

