export interface DatabaseSchema {
  name: string;
  tables: TableSchema[];
}

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
  primaryKey?: string;
}

export interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey?: boolean;
}
