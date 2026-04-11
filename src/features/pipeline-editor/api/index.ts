import { api } from "$core/api/client";
import { API_V1 } from "$core/api/endpoints";
import type {
  ConfigItem,
  ConfigsResponse,
  FlowDefinition,
  PipelineRunResponse,
} from "$core/types/pipeline";

export async function loadConfigs(): Promise<ConfigItem[]> {
  const response = await api.get<ConfigsResponse>(API_V1.CONFIGS);
  return response.data;
}

export async function loadConfig(id: string) {
  return api.get<ConfigsResponse>(API_V1.CONFIG_DETAIL(id));
}

export async function savePipeline(pipeline: FlowDefinition) {
  return api.post<{ id: string; message: string }>(API_V1.PIPELINES, pipeline);
}

export async function runPipeline(id: string) {
  return api.post<PipelineRunResponse>(API_V1.PIPELINE_RUN(id));
}
