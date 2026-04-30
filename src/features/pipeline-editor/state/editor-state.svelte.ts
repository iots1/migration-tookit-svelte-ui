import type { BaseEdge, BaseNode, HistoryEntry } from '$core/types/common';
import type { ConfigItem, PipelineRunResponse } from '$core/types/pipeline';
import {
  createJob,
  loadConfigs,
  loadPipeline,
  reconstructPipelineFromEntity,
  runPipeline,
  savePipeline,
  toPipelineSavePayload,
  updatePipeline,
} from '$features/pipeline-editor/api';

interface EditorState {
  readonly nodes: BaseNode[];
  readonly edges: BaseEdge[];
  readonly selectedNodeId: string | null;
  readonly configs: ConfigItem[];
  readonly pipelineName: string;
  readonly pipelineDescription: string;
  readonly pipelineId: string | null;
  readonly loading: boolean;
  readonly saving: boolean;
  readonly running: boolean;
  readonly error: string | null;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly isDrawerOpen: boolean;
  pushHistory: () => void;
  undo: () => boolean;
  redo: () => boolean;
  addConfigNode: (config: ConfigItem) => void;
  updateNodePosition: (
    nodeId: string,
    position: { x: number; y: number }
  ) => void;
  setNodes: (value: BaseNode[]) => void;
  setEdges: (value: BaseEdge[]) => void;
  selectNode: (id: string | null) => void;
  setConfigs: (value: ConfigItem[]) => void;
  setLoading: (value: boolean) => void;
  setError: (value: string | null) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  clearPipeline: () => void;
  setPipelineFromLoad: (
    name: string,
    description: string,
    nodes: BaseNode[],
    edges: BaseEdge[]
  ) => void;
  setPipelineId: (value: string | null) => void;
  deleteNode: (nodeId: string) => void;
  /** Loads configs and optionally loads an existing pipeline by ID. */
  initialize: (editUuid: string) => Promise<string | null>;
  /** Refreshes configs and updates a specific node's data from the config. */
  updateNodeFromConfig: (configId: string) => Promise<void>;
  /** Saves pipeline, creates a job, returns job ID or null. */
  saveAndCreateJob: (
    name: string,
    description: string
  ) => Promise<string | null>;
  /** Saves pipeline and returns its ID, or null on failure. */
  save: (name: string, description: string) => Promise<string | null>;
  /** Saves then runs pipeline, returns run response or null on failure. */
  saveAndRun: () => Promise<PipelineRunResponse | null>;
  /** Debounced auto-save for existing pipelines. */
  scheduleAutoSave: () => void;
}

export function createEditorState(): EditorState {
  let nodes = $state.raw<BaseNode[]>([]);
  let edges = $state.raw<BaseEdge[]>([]);
  let selectedNodeId = $state<string | null>(null);
  let configs = $state.raw<ConfigItem[]>([]);
  let pipelineName = $state('');
  let pipelineDescription = $state('');
  let pipelineId = $state<string | null>(null);

  let history = $state.raw<HistoryEntry[]>([]);
  let historyIndex = $state(-1);
  let loading = $state(false);
  let saving = $state(false);
  let running = $state(false);
  let error = $state<string | null>(null);
  let isDrawerOpen = $state(false);

  const MAX_HISTORY = 50;

  function pushHistory() {
    const entry: HistoryEntry = {
      nodes: structuredClone(nodes),
      edges: structuredClone(edges),
    };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(entry);
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }
    history = newHistory;
    historyIndex = history.length - 1;
  }

  function undo(): boolean {
    if (historyIndex <= 0) return false;
    historyIndex--;
    const entry = history[historyIndex];
    nodes = structuredClone(entry.nodes);
    edges = structuredClone(entry.edges);
    return true;
  }

  function redo(): boolean {
    if (historyIndex >= history.length - 1) return false;
    historyIndex++;
    const entry = history[historyIndex];
    nodes = structuredClone(entry.nodes);
    edges = structuredClone(entry.edges);
    return true;
  }

  function addConfigNode(config: ConfigItem) {
    const nodeId = `config-${config.id}-${Date.now()}`;
    const jsonData = (config.attributes.json_data ?? {}) as unknown as Record<
      string,
      unknown
    >;
    const source = (jsonData.source ?? {}) as Record<string, unknown>;
    const target = (jsonData.target ?? {}) as Record<string, unknown>;
    const mappings = (jsonData.mappings ?? []) as unknown[];

    const newNode: BaseNode = {
      id: nodeId,
      type: 'config',
      position: {
        x: 100 + Math.random() * 300,
        y: 100 + Math.random() * 300,
      },
      data: {
        label: config.attributes.config_name,
        configId: config.id,
        configType: config.attributes.config_type,
        tableName: config.attributes.table_name,
        sourceDb: (source.database as string) ?? '',
        sourceTable: (source.table as string) ?? '',
        targetDb: (target.database as string) ?? '',
        targetTable: (target.table as string) ?? '',
        mappingCount: mappings.length,
      },
    };
    nodes = [...nodes, newNode];
    pushHistory();
    scheduleAutoSave();
  }

  function updateNodePosition(
    nodeId: string,
    position: { x: number; y: number }
  ) {
    nodes = nodes.map((n) => (n.id === nodeId ? { ...n, position } : n));
    pushHistory();
    scheduleAutoSave();
  }

  function deleteNode(nodeId: string) {
    nodes = nodes.filter((n) => n.id !== nodeId);
    edges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
    if (selectedNodeId === nodeId) {
      selectedNodeId = null;
    }
    pushHistory();
    scheduleAutoSave();
  }

  function openDrawer() {
    isDrawerOpen = true;
  }

  function closeDrawer() {
    isDrawerOpen = false;
  }

  function clearPipeline() {
    nodes = [];
    edges = [];
    pipelineName = '';
    pipelineDescription = '';
    pipelineId = null;
    history = [];
    historyIndex = -1;
  }

  function setPipelineFromLoad(
    name: string,
    description: string,
    newNodes: BaseNode[],
    newEdges: BaseEdge[]
  ) {
    nodes = newNodes;
    edges = newEdges;
    pipelineName = name;
    pipelineDescription = description;
    pushHistory();
  }

  async function save(
    name: string,
    description: string
  ): Promise<string | null> {
    if (nodes.length === 0) {
      error = 'Add at least one config node before saving';
      return null;
    }
    try {
      saving = true;
      error = null;
      pipelineName = name;
      pipelineDescription = description;
      const payload = toPipelineSavePayload(name, description, nodes, edges);
      if (pipelineId) {
        await updatePipeline(pipelineId, payload);
      } else {
        const result = await savePipeline(payload);
        pipelineId = result.id;
      }
      return pipelineId;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save pipeline';
      return null;
    } finally {
      saving = false;
    }
  }

  async function saveAndRun(): Promise<PipelineRunResponse | null> {
    const name = pipelineName || `Pipeline ${Date.now()}`;
    const description = pipelineDescription || '';

    if (nodes.length === 0) {
      error = 'Add at least one config node before saving';
      return null;
    }
    try {
      saving = true;
      error = null;
      const payload = toPipelineSavePayload(name, description, nodes, edges);
      if (pipelineId) {
        await updatePipeline(pipelineId, payload);
      } else {
        const result = await savePipeline(payload);
        pipelineId = result.id;
      }

      running = true;
      const runResult = await runPipeline(pipelineId);
      return runResult;
    } catch (err) {
      error =
        err instanceof Error ? err.message : 'Failed to save or run pipeline';
      return null;
    } finally {
      saving = false;
      running = false;
    }
  }

  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  const AUTO_SAVE_DELAY = 1500;

  function scheduleAutoSave() {
    if (!pipelineId || nodes.length === 0) return;
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      void autoSave();
    }, AUTO_SAVE_DELAY);
  }

  async function autoSave() {
    if (!pipelineId || nodes.length === 0) return;
    try {
      error = null;
      const payload = toPipelineSavePayload(
        pipelineName,
        pipelineDescription,
        nodes,
        edges
      );
      await updatePipeline(pipelineId, payload);
      const hasNewItems =
        nodes.some((n) => !n.data.pipelineNodeId) ||
        edges.some((e) => !e.data?.pipelineEdgeId);
      if (hasNewItems) {
        await syncBackendIds();
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Auto-save failed';
    }
  }

  async function syncBackendIds() {
    if (!pipelineId) return;
    try {
      const entity = await loadPipeline(pipelineId);
      const result = await reconstructPipelineFromEntity(entity, configs);
      const loadedNodeIds: Record<string, string> = {};
      for (const ln of result.nodes) {
        const configId = ln.data.configId as string | undefined;
        const backendId = ln.data.pipelineNodeId as string | undefined;
        if (configId && backendId) {
          loadedNodeIds[configId] = backendId;
        }
      }
      const loadedEdgeIds: Record<string, string> = {};
      for (const le of result.edges) {
        const key = `${le.source}-${le.target}`;
        const backendId = le.data?.pipelineEdgeId as string | undefined;
        if (backendId) {
          loadedEdgeIds[key] = backendId;
        }
      }
      let nodesChanged = false;
      const updatedNodes = nodes.map((n) => {
        const configId = n.data.configId as string | undefined;
        const existingId = n.data.pipelineNodeId as string | undefined;
        if (configId && !existingId) {
          const newId = loadedNodeIds[configId];
          if (newId) {
            nodesChanged = true;
            return { ...n, data: { ...n.data, pipelineNodeId: newId } };
          }
        }
        return n;
      });
      if (nodesChanged) nodes = updatedNodes;
      let edgesChanged = false;
      const updatedEdges = edges.map((e) => {
        const key = `${e.source}-${e.target}`;
        const existingId = e.data?.pipelineEdgeId as string | undefined;
        if (!existingId) {
          const newId = loadedEdgeIds[key];
          if (newId) {
            edgesChanged = true;
            return {
              ...e,
              data: { ...(e.data ?? {}), pipelineEdgeId: newId },
            };
          }
        }
        return e;
      });
      if (edgesChanged) edges = updatedEdges;
    } catch {
      // silent — don't disrupt user flow
    }
  }

  async function initialize(editUuid: string): Promise<string | null> {
    try {
      loading = true;
      const loadedConfigs = await loadConfigs();
      configs = loadedConfigs;

      if (editUuid && editUuid !== 'new') {
        const entity = await loadPipeline(editUuid);
        const result = await reconstructPipelineFromEntity(entity, configs);
        setPipelineFromLoad(
          result.name,
          result.description,
          result.nodes,
          result.edges
        );
        pipelineId = editUuid;
        return editUuid;
      }
      return null;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load data';
      return null;
    } finally {
      loading = false;
    }
  }

  async function updateNodeFromConfig(configId: string): Promise<void> {
    const updatedConfigs = await loadConfigs();
    configs = updatedConfigs;
    const updated = updatedConfigs.find((c) => c.id === configId);
    if (updated) {
      const jsonData = updated.attributes.json_data as unknown as Record<
        string,
        unknown
      >;
      const source = (jsonData.source ?? {}) as Record<string, unknown>;
      const target = (jsonData.target ?? {}) as Record<string, unknown>;
      const mappings = (jsonData.mappings ?? []) as unknown[];

      nodes = nodes.map((n) =>
        (n.data.configId as string) === configId
          ? {
              ...n,
              data: {
                ...n.data,
                label: updated.attributes.config_name,
                configType: updated.attributes.config_type,
                tableName: updated.attributes.table_name,
                sourceTable: (source.table as string) ?? '',
                targetTable: (target.table as string) ?? '',
                mappingCount: mappings.length,
              },
            }
          : n
      );
    }
  }

  async function saveAndCreateJob(
    name: string,
    description: string
  ): Promise<string | null> {
    const id = await save(name, description);
    if (!id) return null;

    try {
      const jobResponse = await createJob({ pipeline_id: id });
      return jobResponse.job_id;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to start job';
      return null;
    }
  }

  return {
    get nodes() {
      return nodes;
    },
    get edges() {
      return edges;
    },
    get selectedNodeId() {
      return selectedNodeId;
    },
    get configs() {
      return configs;
    },
    get pipelineName() {
      return pipelineName;
    },
    get pipelineDescription() {
      return pipelineDescription;
    },
    get pipelineId() {
      return pipelineId;
    },
    get loading() {
      return loading;
    },
    get saving() {
      return saving;
    },
    get running() {
      return running;
    },
    get error() {
      return error;
    },
    get canUndo() {
      return historyIndex > 0;
    },
    get canRedo() {
      return historyIndex < history.length - 1;
    },
    get isDrawerOpen() {
      return isDrawerOpen;
    },
    pushHistory,
    undo,
    redo,
    addConfigNode,
    updateNodePosition,
    setNodes(value: BaseNode[]) {
      nodes = value;
    },
    setEdges(value: BaseEdge[]) {
      edges = value;
    },
    selectNode(id: string | null) {
      selectedNodeId = id;
    },
    setConfigs(value: ConfigItem[]) {
      configs = value;
    },
    setPipelineId(value: string | null) {
      pipelineId = value;
    },
    deleteNode,
    setLoading(value: boolean) {
      loading = value;
    },
    setError(value: string | null) {
      error = value;
    },
    openDrawer,
    closeDrawer,
    clearPipeline,
    setPipelineFromLoad,
    save,
    saveAndRun,
    saveAndCreateJob,
    initialize,
    updateNodeFromConfig,
    scheduleAutoSave,
  };
}
