import { env } from '$env/dynamic/public';

const API_BASE: string = env?.PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

interface ApiErrorBody {
  message?: string;
  errors?: Array<{ detail?: string }>;
}

function hasErrors(errorBody: ApiErrorBody): errorBody is ApiErrorBody & {
  errors: Array<{ detail?: string }>;
} {
  return Boolean(errorBody.errors) && Array.isArray(errorBody.errors);
}

class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { body, headers: customHeaders, ...rest } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(customHeaders as Record<string, string>),
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...rest,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await (response.json() as Promise<ApiErrorBody>).catch(
        () => ({
          message: response.statusText,
        })
      );
      let errorMessage = errorBody.message ?? `API Error: ${response.status}`;
      if (hasErrors(errorBody) && errorBody.errors.length > 0) {
        const details = errorBody.errors
          .map((e) => e.detail)
          .filter(
            (detail): detail is string =>
              detail !== undefined && detail !== null
          );
        if (details.length > 0) {
          errorMessage = details.join(', ');
        }
      }
      throw new Error(errorMessage);
    }

    return (await response.json()) as T;
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const { body, headers: customHeaders, ...rest } = options ?? {};

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(customHeaders as Record<string, string>),
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...rest,
      headers,
      method: 'DELETE',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await (response.json() as Promise<ApiErrorBody>).catch(
        () => ({
          message: response.statusText,
        })
      );
      let errorMessage = errorBody.message ?? `API Error: ${response.status}`;
      if (hasErrors(errorBody) && errorBody.errors.length > 0) {
        const details = errorBody.errors
          .map((e) => e.detail)
          .filter(
            (detail): detail is string =>
              detail !== undefined && detail !== null
          );
        if (details.length > 0) {
          errorMessage = details.join(', ');
        }
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}

export const api = new ApiClient(API_BASE);
