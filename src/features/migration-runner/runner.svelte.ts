import type { JobStatus } from './api';

export function createRunnerState() {
  let currentJobId = $state<string | null>(null);
  let status = $state<JobStatus | null>(null);
  let logs = $state<string[]>([]);
  let pollingInterval = $state<ReturnType<typeof setInterval> | null>(null);

  function startPolling(
    jobId: string,
    fetchStatus: (id: string) => Promise<JobStatus>,
  ) {
    stopPolling();
    currentJobId = jobId;

    pollingInterval = setInterval(async () => {
      try {
        status = await fetchStatus(jobId);
        if (status.status === 'completed' || status.status === 'failed') {
          stopPolling();
        }
      } catch (err) {
        logs.push(`Error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }, 2000);
  }

  function stopPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }

  function addLog(message: string) {
    logs = [...logs, message];
  }

  return {
    get currentJobId() {
      return currentJobId;
    },
    get status() {
      return status;
    },
    get logs() {
      return logs;
    },
    get isPolling() {
      return pollingInterval !== null;
    },
    startPolling,
    stopPolling,
    addLog,
  };
}
