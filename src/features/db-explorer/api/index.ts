import { api } from '$core/api/client';
import { API_V1 } from '$core/api/endpoints';
import type { TableSchema } from '$core/types/schema';

export async function getTables() {
	return api.get<TableSchema[]>(API_V1.TABLES);
}

export async function getColumns(table: string) {
	return api.get<TableSchema>(API_V1.COLUMNS(table));
}
