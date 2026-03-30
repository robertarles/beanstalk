const ALLOWED_SCHEMES = ['http:', 'https:'];

export function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_SCHEMES.includes(parsed.protocol);
  } catch {
    return false;
  }
}
