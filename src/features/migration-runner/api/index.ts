import { api } from '$core/api/client';
import { API_V1 } from '$core/api/endpoints';

export interface JobStatus {
	id: string;
	status: 'pending' | 'running' | 'completed' | 'failed';
	progress: number;
	totalRows: number;
	processedRows: number;
	error?: string;
}

export async function startJob(pipelineId: string) {
	return api.post<{ jobId: string }>(API_V1.MIGRATION_JOBS, { pipelineId });
}

export async function stopJob(jobId: string) {
	return api.post(API_V1.MIGRATION_JOB_STOP(jobId));
}

export async function getStatus(jobId: string) {
	return api.get<JobStatus>(API_V1.MIGRATION_JOB_STATUS(jobId));
}
