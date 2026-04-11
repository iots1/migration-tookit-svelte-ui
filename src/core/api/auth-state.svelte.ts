import { writable } from 'svelte/store';

interface AuthState {
	token: string | null;
	isAuthenticated: boolean;
}

function createAuthState() {
	const { subscribe, set, update } = writable<AuthState>({
		token: typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null,
		isAuthenticated: false
	});

	return {
		subscribe,
		login(token: string) {
			localStorage.setItem('auth_token', token);
			update((s) => ({ ...s, token, isAuthenticated: true }));
		},
		logout() {
			localStorage.removeItem('auth_token');
			set({ token: null, isAuthenticated: false });
		}
	};
}

export const authState = createAuthState();
