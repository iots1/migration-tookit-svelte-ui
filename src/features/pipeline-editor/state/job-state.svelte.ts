import type {
  JobBatchEvent,
  JobCompletedEvent,
  JobErrorEvent,
} from '$core/types/pipeline';

import { env } from '$env/dynamic/public';
import { io } from 'socket.io-client';

interface JobBatchLog {
  step: string;
  batchNum: number;
  rowsProcessed: number;
}

type JobStatus = 'running' | 'completed' | 'error';

interface JobState {
  readonly active: boolean;
  readonly status: JobStatus | null;
  readonly jobId: string | null;
  readonly runId: string | null;
  readonly currentStep: string | null;
  readonly totalRows: number;
  readonly batches: JobBatchLog[];
  readonly errorMessage: string | null;
  connect: (jobId: string, runId: string) => void;
  disconnect: () => void;
}

export function createJobState(): JobState {
  let active = $state(false);
  let status = $state<JobStatus | null>(null);
  let jobId = $state<string | null>(null);
  let runId = $state<string | null>(null);
  let currentStep = $state<string | null>(null);
  let totalRows = $state(0);
  let batches = $state<JobBatchLog[]>([]);
  let errorMessage = $state<string | null>(null);

  let socket: ReturnType<typeof io> | null = null;

  function connect(newJobId: string, newRunId: string) {
    disconnect();

    jobId = newJobId;
    runId = newRunId;
    active = true;
    status = 'running';
    currentStep = null;
    totalRows = 0;
    batches = [];
    errorMessage = null;

    const baseEnvUrl =
      env?.PUBLIC_WS_URL ??
      env?.PUBLIC_API_URL ??
      'http://localhost:8000/api/v1';

    const wsUrl = baseEnvUrl
      .replace(/\/api\/v1\/?$/, '')
      .replace(/^http/, 'ws');

    socket = io(wsUrl, {
      path: '/ws/socket.io/',
      transports: ['websocket', 'polling'],
    });

    socket.on('job:batch', (data: JobBatchEvent) => {
      currentStep = data.step;
      totalRows += data.rows_processed;
      batches = [
        ...batches,
        {
          step: data.step,
          batchNum: data.batch_num,
          rowsProcessed: data.rows_processed,
        },
      ];
    });

    socket.on('job:error', (data: JobErrorEvent) => {
      currentStep = data.step;
      errorMessage = data.error_message;
      status = 'error';
      active = false;
      batches = [
        ...batches,
        {
          step: data.step,
          batchNum: data.batch_num,
          rowsProcessed: 0,
        },
      ];
      socket?.disconnect();
      socket = null;
    });

    socket.on('job:completed', (data: JobCompletedEvent) => {
      totalRows = data.total_rows;
      status = 'completed';
      active = false;
      socket?.disconnect();
      socket = null;
    });

    socket.on('connect_error', () => {
      errorMessage = 'WebSocket connection failed. Job may still be running.';
      status = 'error';
      active = false;
      socket?.disconnect();
      socket = null;
    });
  }

  function disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    active = false;
  }

  return {
    get active() {
      return active;
    },
    get status() {
      return status;
    },
    get jobId() {
      return jobId;
    },
    get runId() {
      return runId;
    },
    get currentStep() {
      return currentStep;
    },
    get totalRows() {
      return totalRows;
    },
    get batches() {
      return batches;
    },
    get errorMessage() {
      return errorMessage;
    },
    connect,
    disconnect,
  };
}
