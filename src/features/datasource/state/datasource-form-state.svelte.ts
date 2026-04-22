import type {
  DatasourceDetail,
  DatasourceSavePayload,
} from '$core/types/datasource';
import {
  createDatasource,
  getDatasource,
  updateDatasource,
} from '$features/datasource/api';

export interface DatasourceFormState {
  readonly loading: boolean;
  readonly saving: boolean;
  readonly error: string | null;
  readonly isDirty: boolean;
  readonly id: string | null;
  readonly name: string;
  readonly db_type: string;
  readonly host: string;
  readonly port: string;
  readonly dbname: string;
  readonly username: string;
  readonly password: string;
  load: (id: string) => Promise<void>;
  setName: (value: string) => void;
  setDbType: (value: string) => void;
  setHost: (value: string) => void;
  setPort: (value: string) => void;
  setDbname: (value: string) => void;
  setUsername: (value: string) => void;
  setPassword: (value: string) => void;
  save: () => Promise<string | null>;
  clearError: () => void;
}

export function createDatasourceFormState(
  mode: 'create' | 'edit',
  initialId: string | null
): DatasourceFormState {
  let loading = $state(false);
  let saving = $state(false);
  let error = $state<string | null>(null);
  let initial = $state<DatasourceDetail | null>(null);

  let name = $state('');
  let db_type = $state('postgresql');
  let host = $state('');
  let port = $state('5432');
  let dbname = $state('');
  let username = $state('');
  let password = $state('');

  const id = initialId;
  const isCreate = mode === 'create';

  const isDirty = $derived(
    isCreate
      ? Boolean(name || host || dbname || username || password)
      : Boolean(
          initial &&
          (name !== initial.name ||
            db_type !== initial.db_type ||
            host !== initial.host ||
            port !== initial.port ||
            dbname !== initial.dbname ||
            username !== initial.username ||
            password !== initial.password)
        )
  );

  async function load(datasourceId: string) {
    try {
      loading = true;
      error = null;
      const response = await getDatasource(datasourceId);
      const ds = response.data;
      initial = ds;
      name = ds.name;
      db_type = ds.db_type;
      host = ds.host;
      port = ds.port;
      dbname = ds.dbname;
      username = ds.username;
      password = ds.password;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load datasource';
    } finally {
      loading = false;
    }
  }

  function buildPayload(): DatasourceSavePayload {
    return { name, db_type, host, port, dbname, username, password };
  }

  async function save(): Promise<string | null> {
    try {
      saving = true;
      error = null;
      const payload = buildPayload();
      if (isCreate) {
        const result = await createDatasource(payload);
        return result.id;
      }
      const result = await updateDatasource(id ?? '', payload);
      return result.id;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save datasource';
      return null;
    } finally {
      saving = false;
    }
  }

  return {
    get loading() {
      return loading;
    },
    get saving() {
      return saving;
    },
    get error() {
      return error;
    },
    get isDirty() {
      return isDirty;
    },
    get id() {
      return id;
    },
    get name() {
      return name;
    },
    get db_type() {
      return db_type;
    },
    get host() {
      return host;
    },
    get port() {
      return port;
    },
    get dbname() {
      return dbname;
    },
    get username() {
      return username;
    },
    get password() {
      return password;
    },
    load,
    setName(value: string) {
      name = value;
    },
    setDbType(value: string) {
      db_type = value;
    },
    setHost(value: string) {
      host = value;
    },
    setPort(value: string) {
      port = value;
    },
    setDbname(value: string) {
      dbname = value;
    },
    setUsername(value: string) {
      username = value;
    },
    setPassword(value: string) {
      password = value;
    },
    save,
    clearError() {
      error = null;
    },
  };
}
