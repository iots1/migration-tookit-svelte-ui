const API_BASE: string =
	(import.meta.env.PUBLIC_API_URL as string | undefined) ?? 'http://localhost:3000/api/v1';

interface RequestOptions extends Omit<RequestInit, 'body'> {
	body?: unknown;
}

interface ApiErrorBody {
	message?: string;
}

class ApiClient {
	private readonly baseUrl: string;

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl;
	}

	private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
		const { body, headers: customHeaders, ...rest } = options;

		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			...(customHeaders as Record<string, string>)
		};

		const response = await fetch(`${this.baseUrl}${endpoint}`, {
			...rest,
			headers,
			body: body !== undefined ? JSON.stringify(body) : undefined
		});

		if (!response.ok) {
			const errorBody = await (response.json() as Promise<ApiErrorBody>).catch(() => ({
				message: response.statusText
			}));
			throw new Error(errorBody.message ?? `API Error: ${response.status}`);
		}

		return (await response.json()) as T;
	}

	async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: 'GET' });
	}

	async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: 'POST', body });
	}

	async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: 'PUT', body });
	}

	async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: 'DELETE' });
	}
}

export const api = new ApiClient(API_BASE);
