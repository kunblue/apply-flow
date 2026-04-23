const AUTH_TOKEN_STORAGE_KEY = 'apply-flow-auth-token';

function canUseLocalStorage(): boolean {
  return typeof globalThis !== 'undefined' && 'localStorage' in globalThis;
}

export function getAuthToken(): string | null {
  if (!canUseLocalStorage()) {
    return null;
  }
  return globalThis.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string): void {
  if (!canUseLocalStorage()) {
    return;
  }
  globalThis.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken(): void {
  if (!canUseLocalStorage()) {
    return;
  }
  globalThis.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}
