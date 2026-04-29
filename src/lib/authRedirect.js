export function getAuthCallbackUrl() {
  if (typeof window === 'undefined') return 'https://vizuden.com/auth/callback';

  const { hostname, protocol, origin } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:3000/auth/callback`;
  }

  return `${origin}/auth/callback`;
}
