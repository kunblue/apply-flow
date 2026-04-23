import { getAuthToken } from './auth-token';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type ApiFetchInit = RequestInit & {
  skipJson?: boolean;
};

export async function apiFetch(path: string, init: ApiFetchInit = {}): Promise<Response> {
  const { headers, ...rest } = init;
  const authToken = getAuthToken();
  const normalizedHeaders = new Headers(headers ?? {});
  if (authToken && !normalizedHeaders.has('Authorization')) {
    normalizedHeaders.set('Authorization', `Bearer ${authToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: normalizedHeaders,
  });

  return response;
}

export async function apiJson<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const response = await apiFetch(path, init);
  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(message || `Request failed with status ${response.status}`, response.status);
  }
  return (await response.json()) as T;
}
