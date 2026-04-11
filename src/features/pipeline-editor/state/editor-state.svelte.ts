import type {
  BaseNode,
  BaseEdge,
  ConfigItem,
  HistoryEntry,
} from "$core/types/pipeline";

interface EditorState {
  readonly nodes: BaseNode[];
  readonly edges: BaseEdge[];
  readonly selectedNodeId: string | null;
  readonly configs: ConfigItem[];
  readonly pipelineName: string;
  readonly pipelineId: string | null;
  readonly loading: boolean;
  readonly saving: boolean;
  readonly running: boolean;
  readonly error: string | null;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  pushHistory: () => void;
  undo: () => boolean;
  redo: () => boolean;
  addConfigNode: (config: ConfigItem) => void;
  setNodes: (value: BaseNode[]) => void;
  setEdges: (value: BaseEdge[]) => void;
  selectNode: (id: string | null) => void;
  setConfigs: (value: ConfigItem[]) => void;
  setPipelineName: (value: string) => void;
  setPipelineId: (value: string | null) => void;
  setLoading: (value: boolean) => void;
  setSaving: (value: boolean) => void;
  setRunning: (value: boolean) => void;
  setError: (value: string | null) => void;
}

export function createEditorState(): EditorState {
  let nodes = $state.raw<BaseNode[]>([]);
  let edges = $state.raw<BaseEdge[]>([]);
  let selectedNodeId = $state<string | null>(null);
  let configs = $state.raw<ConfigItem[]>([]);
  let pipelineName = $state("");
  let pipelineId = $state<string | null>(null);

  let history = $state.raw<HistoryEntry[]>([]);
  let historyIndex = $state(-1);
  let loading = $state(false);
  let saving = $state(false);
  let running = $state(false);
  let error = $state<string | null>(null);

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
      type: "config",
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
    setPipelineName(value: string) {
      pipelineName = value;
    },
    setPipelineId(value: string | null) {
      pipelineId = value;
    },
    setLoading(value: boolean) {
      loading = value;
    },
    setSaving(value: boolean) {
      saving = value;
    },
    setRunning(value: boolean) {
      running = value;
    },
    setError(value: string | null) {
      error = value;
    },
  };
}
