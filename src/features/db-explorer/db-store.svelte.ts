import type { TableSchema } from '$core/types/schema';

export function createDbStore() {
	let tables = $state<TableSchema[]>([]);
	let selectedTable = $state<string | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);

	return {
		get tables() {
			return tables;
		},
		get selectedTable() {
			return selectedTable;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		setTables(value: TableSchema[]) {
			tables = value;
		},
		selectTable(name: string | null) {
			selectedTable = name;
		},
		setLoading(value: boolean) {
			loading = value;
		},
		setError(value: string | null) {
			error = value;
		}
	};
}
