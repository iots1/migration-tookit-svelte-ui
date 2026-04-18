import { tick } from 'svelte';

import type {
  ColumnItem,
  DatasourceItem,
  QueryResult,
  QueryTab,
  TableItem,
} from '$core/types/db-explorer';
import {
  executeQuery,
  listColumns,
  listDatasources,
  listTables,
} from '$features/db-explorer/api';

const STORAGE_KEY = 'db-explorer-query-tabs';
const MSSQL_TYPES = ['mssql', 'sqlserver', 'microsoft sql server'];

function isQueryTab(value: unknown): value is QueryTab {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.sql === 'string'
  );
}

function loadStoredTabs(): {
  tabs: QueryTab[];
  activeTabId: string;
} | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const data = parsed as Record<string, unknown>;
    if (!Array.isArray(data.tabs)) return null;
    const validTabs = data.tabs.filter(isQueryTab);
    if (validTabs.length === 0) return null;
    const storedActiveId =
      typeof data.activeTabId === 'string' ? data.activeTabId : '';
    const activeId = validTabs.some((t) => t.id === storedActiveId)
      ? storedActiveId
      : validTabs[0].id;
    return { tabs: validTabs, activeTabId: activeId };
  } catch {
    return null;
  }
}

function saveToStorage(tabsToSave: QueryTab[], activeId: string): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ tabs: tabsToSave, activeTabId: activeId })
    );
  } catch {
    // storage unavailable
  }
}

export interface DbExplorerState {
  readonly datasources: DatasourceItem[];
  readonly selectedDatasourceId: string | null;
  readonly activeDatasource: DatasourceItem | undefined;
  readonly loadingDatasources: boolean;
  readonly tabs: QueryTab[];
  readonly activeTabId: string;
  readonly sql: string;
  readonly tables: TableItem[];
  readonly loadingTables: boolean;
  readonly expandedTables: Record<string, ColumnItem[]>;
  readonly loadingColumns: Record<string, boolean>;
  readonly running: boolean;
  readonly results: QueryResult[];
  readonly error: string | null;
  readonly globalError: string | null;
  readonly defaultLimit: number;
  selectDatasource: (id: string | null) => void;
  fetchDatasources: () => Promise<void>;
  setSql: (value: string) => void;
  setDefaultLimit: (value: number) => void;
  runQuery: () => Promise<void>;
  clearResults: () => void;
  fetchTables: (datasourceId: string) => Promise<void>;
  toggleTableColumns: (tableName: string) => Promise<void>;
  insertTableName: (tableName: string) => void;
  insertColumnName: (columnName: string) => void;
  generateSelectTemplate: (tableName: string) => string;
  addTab: () => void;
  removeTab: (id: string) => void;
  renameTab: (id: string, title: string) => void;
  closeOtherTabs: (id: string) => void;
  closeAllTabs: () => void;
  selectTab: (id: string) => void;
  openAndRunTableQuery: (tableName: string) => Promise<void>;
}

export function createDbExplorerState(): DbExplorerState {
  const stored = loadStoredTabs();
  const defaultTab: QueryTab = {
    id: crypto.randomUUID(),
    title: 'Query 1',
    sql: '',
  };

  let tabs = $state.raw<QueryTab[]>(stored ? stored.tabs : [defaultTab]);
  let activeTabId = $state(stored ? stored.activeTabId : defaultTab.id);
  let tabResults = $state.raw<Record<string, QueryResult[]>>({});
  let tabRunning = $state<Record<string, boolean>>({});
  let tabErrors = $state<Record<string, string | null>>({});
  let datasources = $state.raw<DatasourceItem[]>([]);
  let selectedDatasourceId = $state<string | null>(null);
  let loadingDatasources = $state(false);
  let tables = $state.raw<TableItem[]>([]);
  let loadingTables = $state(false);
  let expandedTables = $state<Record<string, ColumnItem[]>>({});
  let loadingColumns = $state<Record<string, boolean>>({});
  let defaultLimit = $state(1000);
  let globalError = $state<string | null>(null);

  // Immediate save — for structural changes (add/remove/rename tab)
  let persistTimer: ReturnType<typeof setTimeout> | undefined;

  function persistNow(): void {
    clearTimeout(persistTimer);
    saveToStorage(tabs, activeTabId);
  }

  // Debounced save — for per-keystroke SQL changes
  function schedulePersist(): void {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      saveToStorage(tabs, activeTabId);
    }, 500);
  }

  function isMssql(): boolean {
    if (!selectedDatasourceId) return false;
    const ds = datasources.find((d) => d.id === selectedDatasourceId);
    if (!ds) return false;
    return MSSQL_TYPES.includes(ds.db_type.toLowerCase());
  }

  function nextTabTitle(): string {
    let maxNum = 0;
    for (const tab of tabs) {
      const match = tab.title.match(/^Query (\d+)$/);
      if (match) {
        const num = Number.parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    return `Query ${maxNum + 1}`;
  }

  // --- Shared inner functions (avoids `this` dependency) ---

  function buildSelectTemplate(tableName: string): string {
    if (isMssql()) {
      return `SELECT TOP ${defaultLimit} * FROM ${tableName};`;
    }
    return `SELECT * FROM ${tableName} LIMIT ${defaultLimit};`;
  }

  function applySetSql(value: string): void {
    tabs = tabs.map((t) => (t.id === activeTabId ? { ...t, sql: value } : t));
    schedulePersist();
  }

  async function runQueryInner(): Promise<void> {
    const tabId = activeTabId;
    const currentSql = tabs.find((t) => t.id === tabId)?.sql;
    if (!selectedDatasourceId || !currentSql?.trim()) return;

    const queries = currentSql
      .split(';')
      .map((q) => q.trim())
      .filter((q) => q.length > 0);
    if (queries.length === 0) return;

    tabRunning = { ...tabRunning, [tabId]: true };
    tabErrors = { ...tabErrors, [tabId]: null };
    tabResults = { ...tabResults, [tabId]: [] };

    try {
      for (const query of queries) {
        const res = await executeQuery({
          cmd: query,
          datasource_id: selectedDatasourceId,
        });
        const currentResults = tabResults[tabId] ?? [];
        tabResults = {
          ...tabResults,
          [tabId]: [...currentResults, res],
        };
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Query execution failed';
      tabErrors = { ...tabErrors, [tabId]: message };
    } finally {
      tabRunning = { ...tabRunning, [tabId]: false };
    }
  }

  async function fetchTablesInner(datasourceId: string): Promise<void> {
    loadingTables = true;
    globalError = null;
    try {
      tables = await listTables(datasourceId);
    } catch (err) {
      globalError =
        err instanceof Error ? err.message : 'Failed to load tables';
    } finally {
      loadingTables = false;
    }
  }

  return {
    get datasources() {
      return datasources;
    },
    get selectedDatasourceId() {
      return selectedDatasourceId;
    },
    get activeDatasource() {
      return datasources.find((ds) => ds.id === selectedDatasourceId);
    },
    get loadingDatasources() {
      return loadingDatasources;
    },
    get tabs() {
      return tabs;
    },
    get activeTabId() {
      return activeTabId;
    },
    get sql() {
      return tabs.find((t) => t.id === activeTabId)?.sql ?? '';
    },
    get tables() {
      return tables;
    },
    get loadingTables() {
      return loadingTables;
    },
    get expandedTables() {
      return expandedTables;
    },
    get loadingColumns() {
      return loadingColumns;
    },
    get running() {
      return tabRunning[activeTabId] ?? false;
    },
    get results() {
      return tabResults[activeTabId] ?? [];
    },
    get error() {
      return tabErrors[activeTabId] ?? null;
    },
    get globalError() {
      return globalError;
    },
    get defaultLimit() {
      return defaultLimit;
    },

    selectDatasource(id: string | null) {
      selectedDatasourceId = id;
      tabResults = {};
      tabErrors = {};
      tabRunning = {};
      tables = [];
      expandedTables = {};
      globalError = null;
      if (id) void fetchTablesInner(id);
    },

    async fetchDatasources() {
      loadingDatasources = true;
      globalError = null;
      try {
        const items = await listDatasources();
        datasources = items;
      } catch (err) {
        globalError =
          err instanceof Error ? err.message : 'Failed to load datasources';
      } finally {
        loadingDatasources = false;
      }
    },

    setSql(value: string) {
      applySetSql(value);
    },

    setDefaultLimit(value: number) {
      const parsed = Number.parseInt(String(value), 10);
      defaultLimit = Number.isNaN(parsed) || parsed < 1 ? 1000 : parsed;
    },

    async runQuery() {
      await runQueryInner();
    },

    clearResults() {
      tabResults = { ...tabResults, [activeTabId]: [] };
      tabErrors = { ...tabErrors, [activeTabId]: null };
    },

    async fetchTables(datasourceId: string) {
      await fetchTablesInner(datasourceId);
    },

    async toggleTableColumns(tableName: string) {
      if (!selectedDatasourceId) return;
      if (expandedTables[tableName]) {
        const { [tableName]: _, ...rest } = expandedTables;
        expandedTables = rest;
        return;
      }
      loadingColumns = { ...loadingColumns, [tableName]: true };
      try {
        const cols = await listColumns(selectedDatasourceId, tableName);
        expandedTables = { ...expandedTables, [tableName]: cols };
      } catch (err) {
        globalError =
          err instanceof Error ? err.message : 'Failed to load columns';
      } finally {
        const { [tableName]: _, ...rest } = loadingColumns;
        loadingColumns = rest;
      }
    },

    insertTableName(tableName: string) {
      const template = buildSelectTemplate(tableName);
      const currentSql = tabs.find((t) => t.id === activeTabId)?.sql ?? '';
      applySetSql(currentSql ? `${currentSql}\n${template}` : template);
    },

    insertColumnName(columnName: string) {
      const currentSql = tabs.find((t) => t.id === activeTabId)?.sql ?? '';
      applySetSql(currentSql ? `${currentSql} ${columnName}` : columnName);
    },

    generateSelectTemplate(tableName: string): string {
      return buildSelectTemplate(tableName);
    },

    addTab() {
      const newTab: QueryTab = {
        id: crypto.randomUUID(),
        title: nextTabTitle(),
        sql: '',
      };
      tabs = [...tabs, newTab];
      activeTabId = newTab.id;
      persistNow();
    },

    async openAndRunTableQuery(tableName: string) {
      if (!selectedDatasourceId) return;
      const sqlStr = buildSelectTemplate(tableName);
      const newTab: QueryTab = {
        id: crypto.randomUUID(),
        title: tableName,
        sql: sqlStr,
      };
      tabs = [...tabs, newTab];
      activeTabId = newTab.id;
      persistNow();
      await tick();
      await runQueryInner();
    },

    removeTab(id: string) {
      if (tabs.length <= 1) return;
      const index = tabs.findIndex((t) => t.id === id);
      if (index === -1) return;

      const newTabs = tabs.filter((t) => t.id !== id);
      const { [id]: _r, ...restResults } = tabResults;
      const { [id]: _e, ...restErrors } = tabErrors;
      const { [id]: _ru, ...restRunning } = tabRunning;
      tabResults = restResults;
      tabErrors = restErrors;
      tabRunning = restRunning;

      if (activeTabId === id) {
        const newIndex = Math.min(index, newTabs.length - 1);
        activeTabId = newTabs[newIndex].id;
      }

      tabs = newTabs;
      persistNow();
    },

    selectTab(id: string) {
      if (!tabs.some((t) => t.id === id)) return;
      activeTabId = id;
      persistNow();
    },

    renameTab(id: string, title: string) {
      tabs = tabs.map((t) => (t.id === id ? { ...t, title } : t));
      persistNow();
    },

    closeOtherTabs(id: string) {
      const keep = tabs.find((t) => t.id === id);
      if (!keep) return;
      const closedIds = tabs.filter((t) => t.id !== id).map((t) => t.id);
      tabs = [keep];
      activeTabId = id;
      for (const closedId of closedIds) {
        const { [closedId]: _r, ...rest } = tabResults;
        tabResults = rest;
        const { [closedId]: _e, ...restE } = tabErrors;
        tabErrors = restE;
        const { [closedId]: _ru, ...restRu } = tabRunning;
        tabRunning = restRu;
      }
      persistNow();
    },

    closeAllTabs() {
      const first = tabs[0];
      if (!first) return;
      const closedIds = tabs.slice(1).map((t) => t.id);
      tabs = [first];
      activeTabId = first.id;
      for (const closedId of closedIds) {
        const { [closedId]: _r, ...rest } = tabResults;
        tabResults = rest;
        const { [closedId]: _e, ...restE } = tabErrors;
        tabErrors = restE;
        const { [closedId]: _ru, ...restRu } = tabRunning;
        tabRunning = restRu;
      }
      persistNow();
    },
  };
}
