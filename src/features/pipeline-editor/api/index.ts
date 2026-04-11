import { api } from '$core/api/client';
import { API_V1 } from '$core/api/endpoints';
import type { FlowDefinition } from '$core/types/pipeline';

export async function savePipeline(pipeline: FlowDefinition) {
	return api.post(API_V1.PIPELINES, pipeline);
}

export async function loadPipeline(id: string) {
	return api.get<FlowDefinition>(`${API_V1.PIPELINES}/${id}`);
}

export async function validateNode(nodeId: string, data: unknown) {
	return api.post(API_V1.PIPELINE_VALIDATE(nodeId), data);
}

export async function runPipeline(id: string) {
	return api.post(API_V1.PIPELINE_RUN(id));
}
