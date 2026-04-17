import type { ConfigMapping } from '$core/types/pipeline';
import type {
  ConfigSavePayload,
  DatasourceColumn,
  FieldMappingConfigData,
  MappingRow,
  TransformerOption,
  ValidatorOption,
} from '$core/types/schema-mapper';
import {
  createConfig,
  getConfig,
  getDatasourceTableColumns,
  getDatasourceTables,
  getTransformers,
  getValidators,
  updateConfig,
} from '$features/schema-mapper/api';

export interface FieldMappingState {
  readonly mode: 'create' | 'edit';
  readonly configId: string | null;
  readonly currentStep: number;
  readonly maxReachedStep: number;
  readonly configType: 'std' | 'custom';
  readonly configName: string;
  readonly script: string;
  readonly sourceDatasourceId: string | null;
  readonly sourceDatasourceName: string | null;
  readonly sourceDatabaseName: string | null;
  readonly sourceTables: string[];
  readonly sourceTableName: string | null;
  readonly sourceColumns: DatasourceColumn[];
  readonly targetDatasourceId: string | null;
  readonly targetDatasourceName: string | null;
  readonly targetDatabaseName: string | null;
  readonly targetTables: string[];
  readonly targetTableName: string | null;
  readonly targetColumns: DatasourceColumn[];
  readonly mappings: MappingRow[];
  readonly transformers: TransformerOption[];
  readonly validators: ValidatorOption[];
  readonly generateSql: string;
  readonly loading: boolean;
  readonly saving: boolean;
  readonly loadingTables: boolean;
  readonly loadingColumns: boolean;
  readonly loadingOptions: boolean;
  readonly error: string | null;
  readonly isDirty: boolean;
  clearError: () => void;
  setConfigType: (type: 'std' | 'custom') => void;
  setConfigName: (name: string) => void;
  setScript: (script: string) => void;
  setSourceDatasource: (opts: {
    id: string | null;
    name?: string | null;
    dbname?: string | null;
  }) => Promise<void>;
  setSourceTable: (table: string | null) => Promise<void>;
  setTargetDatasource: (opts: {
    id: string | null;
    name?: string | null;
    dbname?: string | null;
  }) => Promise<void>;
  setTargetTable: (table: string | null) => Promise<void>;
  updateMapping: (index: number, updates: Partial<MappingRow>) => void;
  addMapping: (row?: Partial<MappingRow>) => void;
  removeMapping: (index: number) => void;
  setGenerateSql: (sql: string) => void;
  autoGenerateSql: () => void;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  loadConfig: (id: string) => Promise<void>;
  loadOptions: () => Promise<void>;
  save: () => Promise<string | null>;
}

function buildMappingRows(
  configMappings: ConfigMapping[],
  sourceColumns: DatasourceColumn[],
  targetColumns: DatasourceColumn[]
): MappingRow[] {
  const sourceTypes = new Map(sourceColumns.map((c) => [c.name, c.type]));
  const targetColumnNames = new Set(targetColumns.map((c) => c.name));

  return configMappings.map((m) => ({
    sourceColumn: m.source,
    sourceType: sourceTypes.get(m.source) ?? '',
    targetColumn: m.target,
    targetExists: m.target ? targetColumnNames.has(m.target) : false,
    transformers: m.transformers ?? [],
    validators: m.validators ?? [],
    transformerParams: m.transformer_params ?? {},
    defaultValue:
      m.default_value !== undefined && m.default_value !== null
        ? String(m.default_value)
        : '',
    ignore: m.ignore,
  }));
}

function buildInitialMappings(
  columns: DatasourceColumn[],
  _targetColumns: DatasourceColumn[]
): MappingRow[] {
  return columns.map((col) => ({
    sourceColumn: col.name,
    sourceType: col.type,
    targetColumn: '',
    targetExists: false,
    transformers: [],
    validators: [],
    transformerParams: {},
    defaultValue: '',
    ignore: true,
  }));
}

function generateSelectSql(
  mappings: MappingRow[],
  sourceTable: string
): string {
  const active = mappings.filter(
    (m) => !m.ignore && m.sourceColumn && m.targetColumn
  );
  if (active.length === 0) return '';
  const cols = active
    .map((m) => `    ${m.sourceColumn} AS ${m.targetColumn}`)
    .join(',\n');
  return `SELECT\n${cols}\nFROM ${sourceTable};`;
}

export function createFieldMappingState(
  mode: 'create' | 'edit',
  configId: string | null
): FieldMappingState {
  let currentStep = $state(1);
  let maxReachedStep = $state(1);
  let configType = $state<'std' | 'custom'>('std');
  let configName = $state('');
  let script = $state('');
  let sourceDatasourceId = $state<string | null>(null);
  let sourceDatasourceName = $state<string | null>(null);
  let sourceDatabaseName = $state<string | null>(null);
  let sourceTables = $state<string[]>([]);
  let sourceTableName = $state<string | null>(null);
  let sourceColumns = $state<DatasourceColumn[]>([]);
  let targetDatasourceId = $state<string | null>(null);
  let targetDatasourceName = $state<string | null>(null);
  let targetDatabaseName = $state<string | null>(null);
  let targetTables = $state<string[]>([]);
  let targetTableName = $state<string | null>(null);
  let targetColumns = $state<DatasourceColumn[]>([]);
  let mappings = $state.raw<MappingRow[]>([]);
  let transformers = $state<TransformerOption[]>([]);
  let validators = $state<ValidatorOption[]>([]);
  let generateSql = $state('');
  let loading = $state(false);
  let saving = $state(false);
  let loadingTables = $state(false);
  let loadingColumns = $state(false);
  let loadingOptions = $state(false);
  let error = $state<string | null>(null);
  let isDirty = $state(false);

  function refreshTargetExists() {
    const targetColumnNames = targetColumns.map((c) => c.name);
    mappings = mappings.map((m) => ({
      ...m,
      targetExists: m.targetColumn
        ? targetColumnNames.includes(m.targetColumn)
        : false,
    }));
  }

  async function loadConfig(id: string) {
    loading = true;
    error = null;
    try {
      const detail = await getConfig(id);
      configName = detail.config_name;
      configType = detail.config_type === 'custom' ? 'custom' : 'std';
      script = detail.script ?? '';
      generateSql = detail.generate_sql ?? '';
      sourceDatasourceId = detail.datasource_source_id;
      targetDatasourceId = detail.datasource_target_id;

      let jsonData: FieldMappingConfigData;
      try {
        const parsed =
          typeof detail.json_data === 'string'
            ? JSON.parse(detail.json_data)
            : (detail.json_data as unknown);

        // Ensure required structure exists (for custom configs with empty json_data)
        jsonData = {
          name: (parsed as Record<string, unknown>).name ?? detail.config_name,
          module: (parsed as Record<string, unknown>).module ?? '',
          source: (parsed as Record<string, unknown>).source ?? {
            database: '',
            table: '',
          },
          target: (parsed as Record<string, unknown>).target ?? {
            database: '',
            table: '',
          },
          mappings: (parsed as Record<string, unknown>).mappings ?? [],
        } as FieldMappingConfigData;
      } catch {
        jsonData = {
          name: detail.config_name,
          module: '',
          source: { database: '', table: '' },
          target: { database: '', table: '' },
          mappings: [],
        };
      }

      sourceTableName = jsonData.source?.table ?? null;
      sourceDatasourceName = jsonData.source?.datasource_name ?? null;
      sourceDatabaseName = jsonData.source?.database ?? null;
      targetTableName = jsonData.target?.table ?? null;
      targetDatasourceName = jsonData.target?.datasource_name ?? null;
      targetDatabaseName = jsonData.target?.database ?? null;

      const loadWarnings: string[] = [];

      if (sourceDatasourceId) {
        try {
          sourceTables = await getDatasourceTables(sourceDatasourceId);
        } catch {
          sourceTables = [];
          loadWarnings.push('Could not load source tables');
        }
      }

      if (sourceDatasourceId && sourceTableName) {
        try {
          sourceColumns = await getDatasourceTableColumns(
            sourceDatasourceId,
            sourceTableName
          );
        } catch {
          sourceColumns = [];
          loadWarnings.push(
            `Could not load columns for source table "${sourceTableName}"`
          );
        }
      }

      if (targetDatasourceId) {
        try {
          targetTables = await getDatasourceTables(targetDatasourceId);
        } catch {
          targetTables = [];
          loadWarnings.push('Could not load target tables');
        }
      }

      if (targetDatasourceId && targetTableName) {
        try {
          targetColumns = await getDatasourceTableColumns(
            targetDatasourceId,
            targetTableName
          );
        } catch {
          targetColumns = [];
          loadWarnings.push(
            `Could not load columns for target table "${targetTableName}"`
          );
        }
      }

      if (loadWarnings.length > 0) {
        error = loadWarnings.join(' · ');
      }

      if (jsonData.mappings && jsonData.mappings.length > 0) {
        mappings = buildMappingRows(
          jsonData.mappings,
          sourceColumns,
          targetColumns
        );
      } else if (sourceColumns.length > 0) {
        mappings = buildInitialMappings(sourceColumns, targetColumns);
      }

      maxReachedStep = 4;
      currentStep = configType === 'custom' ? 1 : 4;
      isDirty = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load config';
    } finally {
      loading = false;
    }
  }

  async function setSourceDatasource(opts: {
    id: string | null;
    name?: string | null;
    dbname?: string | null;
  }) {
    sourceDatasourceId = opts.id;
    sourceDatasourceName = opts.name ?? null;
    sourceDatabaseName = opts.dbname ?? null;
    sourceTables = [];
    sourceTableName = null;
    sourceColumns = [];
    mappings = [];
    if (!opts.id) return;
    loadingTables = true;
    try {
      const tables = await getDatasourceTables(opts.id);
      sourceTables = tables;
    } catch (err) {
      error =
        err instanceof Error ? err.message : 'Failed to load source tables';
    } finally {
      loadingTables = false;
    }
  }

  async function setSourceTable(table: string | null) {
    sourceTableName = table;
    sourceColumns = [];
    mappings = [];
    if (!sourceDatasourceId || !table) return;
    loadingColumns = true;
    try {
      const cols = await getDatasourceTableColumns(sourceDatasourceId, table);
      sourceColumns = cols;
      mappings = buildInitialMappings(sourceColumns, targetColumns);
    } catch (err) {
      error =
        err instanceof Error ? err.message : 'Failed to load source columns';
    } finally {
      loadingColumns = false;
    }
  }

  async function setTargetDatasource(opts: {
    id: string | null;
    name?: string | null;
    dbname?: string | null;
  }) {
    targetDatasourceId = opts.id;
    targetDatasourceName = opts.name ?? null;
    targetDatabaseName = opts.dbname ?? null;
    targetTables = [];
    targetTableName = null;
    targetColumns = [];
    refreshTargetExists();
    if (!opts.id) return;
    loadingTables = true;
    try {
      const tables = await getDatasourceTables(opts.id);
      targetTables = tables;
    } catch (err) {
      error =
        err instanceof Error ? err.message : 'Failed to load target tables';
    } finally {
      loadingTables = false;
    }
  }

  async function setTargetTable(table: string | null) {
    targetTableName = table;
    targetColumns = [];
    if (!targetDatasourceId || !table) return;
    loadingColumns = true;
    try {
      const cols = await getDatasourceTableColumns(targetDatasourceId, table);
      targetColumns = cols;
      refreshTargetExists();
    } catch (err) {
      error =
        err instanceof Error ? err.message : 'Failed to load target columns';
    } finally {
      loadingColumns = false;
    }
  }

  function goToStep(step: number) {
    if (step < 1 || step > 4) return;
    if (configType === 'custom' && step > 1) return;
    if (step <= maxReachedStep) {
      currentStep = step;
    }
  }

  function nextStep() {
    if (currentStep < 4 && currentStep < maxReachedStep + 1) {
      maxReachedStep = Math.max(maxReachedStep, currentStep + 1);
      currentStep = currentStep + 1;
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      currentStep = currentStep - 1;
    }
  }

  function addMapping(row?: Partial<MappingRow>) {
    const newRow: MappingRow = {
      sourceColumn: row?.sourceColumn ?? '',
      sourceType: row?.sourceType ?? '',
      targetColumn: row?.targetColumn ?? '',
      targetExists: row?.targetColumn
        ? targetColumns.some((c) => c.name === row.targetColumn)
        : false,
      transformers: row?.transformers ?? [],
      validators: row?.validators ?? [],
      transformerParams: row?.transformerParams ?? {},
      defaultValue: row?.defaultValue ?? '',
      ignore: row?.ignore ?? true,
      isManual: row?.isManual ?? true,
    };
    mappings = [...mappings, newRow];
    isDirty = true;
  }

  function removeMapping(index: number) {
    mappings = mappings.filter((_, i) => i !== index);
    isDirty = true;
  }

  function updateMapping(index: number, updates: Partial<MappingRow>) {
    const updated = [...mappings];
    const current = updated[index];
    if (!current) return;

    let newTargetColumn = current.targetColumn;
    let newIgnore = current.ignore;

    if ('targetColumn' in updates) {
      newTargetColumn = updates.targetColumn ?? '';
      if (newTargetColumn && current.ignore) {
        newIgnore = false;
      }
    }

    if ('ignore' in updates && updates.ignore) {
      newTargetColumn = '';
    }

    updated[index] = {
      ...current,
      ...updates,
      targetColumn: newTargetColumn,
      ignore: newIgnore,
    };

    const targetColumnNames = targetColumns.map((c) => c.name);
    updated[index] = {
      ...updated[index],
      targetExists: updated[index].targetColumn
        ? targetColumnNames.includes(updated[index].targetColumn)
        : false,
    };

    mappings = updated;
    isDirty = true;
  }

  function autoGenerateSql() {
    if (!sourceTableName) return;
    generateSql = generateSelectSql(mappings, sourceTableName);
  }

  async function save(): Promise<string | null> {
    if (!configName.trim()) {
      error = 'Config name is required';
      return null;
    }

    saving = true;
    error = null;

    try {
      let jsonDataStr: string;

      if (configType === 'custom') {
        jsonDataStr = JSON.stringify({});
      } else {
        const jsonData: FieldMappingConfigData = {
          name: configName,
          module: 'default',
          source: {
            database: sourceDatabaseName ?? sourceDatasourceName ?? '',
            table: sourceTableName ?? '',
            datasource_id: sourceDatasourceId ?? undefined,
            datasource_name: sourceDatasourceName ?? undefined,
          },
          target: {
            database: targetDatabaseName ?? targetDatasourceName ?? '',
            table: targetTableName ?? '',
            datasource_id: targetDatasourceId ?? undefined,
            datasource_name: targetDatasourceName ?? undefined,
          },
          mappings: mappings.map((m) => {
            const mapping: ConfigMapping = {
              source: m.sourceColumn,
              target: m.targetColumn,
              ignore: m.ignore,
            };
            if (m.transformers.length > 0) {
              mapping.transformers = m.transformers;
            }
            if (m.validators.length > 0) {
              mapping.validators = m.validators;
            }
            if (m.defaultValue) {
              mapping.default_value = m.defaultValue;
            }
            if (Object.keys(m.transformerParams).length > 0) {
              mapping.transformer_params = m.transformerParams;
            }
            return mapping;
          }),
        };
        jsonDataStr = JSON.stringify(jsonData);
      }

      const payload: ConfigSavePayload = {
        config_name: configName.trim(),
        table_name: sourceTableName ?? '',
        json_data: jsonDataStr,
        datasource_source_id: configType === 'std' ? sourceDatasourceId : null,
        datasource_target_id: targetDatasourceId,
        config_type: configType,
        script: configType === 'custom' ? script || null : null,
        generate_sql: configType === 'std' ? generateSql.trim() || null : null,
      };

      let savedId: string;
      if (mode === 'edit' && configId) {
        await updateConfig(configId, payload);
        savedId = configId;
      } else {
        const result = await createConfig(payload);
        savedId = result.id;
      }
      isDirty = false;
      return savedId;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save config';
      return null;
    } finally {
      saving = false;
    }
  }

  async function loadOptions() {
    loadingOptions = true;
    try {
      const [transformersData, validatorsData] = await Promise.all([
        getTransformers(),
        getValidators(),
      ]);
      transformers = transformersData;
      validators = validatorsData;
    } catch (err) {
      console.error('Failed to load transformers/validators:', err);
      // Set empty arrays as fallback
      transformers = [];
      validators = [];
    } finally {
      loadingOptions = false;
    }
  }

  return {
    get mode() {
      return mode;
    },
    get configId() {
      return configId;
    },
    get currentStep() {
      return currentStep;
    },
    get maxReachedStep() {
      return maxReachedStep;
    },
    get configType() {
      return configType;
    },
    get configName() {
      return configName;
    },
    get script() {
      return script;
    },
    get sourceDatasourceId() {
      return sourceDatasourceId;
    },
    get sourceDatasourceName() {
      return sourceDatasourceName;
    },
    get sourceDatabaseName() {
      return sourceDatabaseName;
    },
    get sourceTables() {
      return sourceTables;
    },
    get sourceTableName() {
      return sourceTableName;
    },
    get sourceColumns() {
      return sourceColumns;
    },
    get targetDatasourceId() {
      return targetDatasourceId;
    },
    get targetDatasourceName() {
      return targetDatasourceName;
    },
    get targetDatabaseName() {
      return targetDatabaseName;
    },
    get targetTables() {
      return targetTables;
    },
    get targetTableName() {
      return targetTableName;
    },
    get targetColumns() {
      return targetColumns;
    },
    get mappings() {
      return mappings;
    },
    get transformers() {
      return transformers;
    },
    get validators() {
      return validators;
    },
    get generateSql() {
      return generateSql;
    },
    get loading() {
      return loading;
    },
    get saving() {
      return saving;
    },
    get loadingTables() {
      return loadingTables;
    },
    get loadingColumns() {
      return loadingColumns;
    },
    get loadingOptions() {
      return loadingOptions;
    },
    get error() {
      return error;
    },
    get isDirty() {
      return isDirty;
    },
    clearError() {
      error = null;
    },
    setConfigType(type: 'std' | 'custom') {
      configType = type;
      isDirty = true;
      if (type === 'custom') {
        maxReachedStep = 1;
        currentStep = 1;
      }
    },
    setConfigName(name: string) {
      configName = name;
      isDirty = true;
    },
    setScript(s: string) {
      script = s;
      isDirty = true;
    },
    setSourceDatasource(opts: {
      id: string | null;
      name?: string | null;
      dbname?: string | null;
    }) {
      return setSourceDatasource(opts);
    },
    setSourceTable,
    setTargetDatasource(opts: {
      id: string | null;
      name?: string | null;
      dbname?: string | null;
    }) {
      return setTargetDatasource(opts);
    },
    setTargetTable,
    updateMapping,
    addMapping,
    removeMapping,
    setGenerateSql(sql: string) {
      generateSql = sql;
      isDirty = true;
    },
    autoGenerateSql,
    goToStep,
    nextStep,
    prevStep,
    loadConfig,
    loadOptions,
    save,
  };
}
