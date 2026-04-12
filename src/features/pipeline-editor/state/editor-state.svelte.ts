import type { BaseEdge, BaseNode, HistoryEntry } from '$core/types/common';
import type { ConfigItem, PipelineRunResponse } from '$core/types/pipeline';
import {
  runPipeline,
  savePipeline,
  toPipelineSavePayload,
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
    edges: BaseEdge[],
  ) => void;
  setPipelineId: (value: string | null) => void;
  /** Saves pipeline and returns its ID, or null on failure. */
  save: (name: string, description: string) => Promise<string | null>;
  /** Saves then runs pipeline, returns run response or null on failure. */
  saveAndRun: () => Promise<PipelineRunResponse | null>;
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
        sourceDb: config.attributes.json_data.source.database,
        sourceTable: config.attributes.json_data.source.table,
        targetDb: config.attributes.json_data.target.database,
        targetTable: config.attributes.json_data.target.table,
        mappingCount: config.attributes.json_data.mappings.length,
      },
    };
    nodes = [...nodes, newNode];
    pushHistory();
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
    newEdges: BaseEdge[],
  ) {
    nodes = newNodes;
    edges = newEdges;
    pipelineName = name;
    pipelineDescription = description;
    pushHistory();
  }

  async function save(
    name: string,
    description: string,
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
      const result = await savePipeline(payload);
      pipelineId = result.id;
      return result.id;
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
      const result = await savePipeline(payload);
      pipelineId = result.id;

      running = true;
      const runResult = await runPipeline(result.id);
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
  };
}
