const STORAGE_PREFIX = 'mtk_';

export function getItem<T>(key: string): T | null {
	if (typeof localStorage === 'undefined') return null;
	const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as T;
	} catch {
		return null;
	}
}

export function setItem<T>(key: string, value: T): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
}

export function removeItem(key: string): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
}

export function clearAll(): void {
	if (typeof localStorage === 'undefined') return;
	const keysToRemove: string[] = [];
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key?.startsWith(STORAGE_PREFIX)) {
			keysToRemove.push(key);
		}
	}
	keysToRemove.forEach((key) => localStorage.removeItem(key));
}
