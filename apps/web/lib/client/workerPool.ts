// Advanced Worker Pool Manager for parallel processing with cancel/retry support

export interface WorkerTask {
    id: string;
    buffer: ArrayBuffer;
    operation: string;
    options: any;
    fileId?: string; // For cache namespacing
    toolId?: string; // For cache namespacing
    onProgress?: (progress: number) => void;
    onCancel?: () => void;
    retryCount?: number;
    maxRetries?: number;
}

export interface WorkerResult {
    success: boolean;
    data?: any;
    error?: string;
    cached?: boolean;
}

type WorkerType = 'image' | 'video' | 'pdf';

interface ActiveTask {
    task: WorkerTask;
    resolve: (result: WorkerResult) => void;
    reject: (error: Error) => void;
    worker?: Worker;
    cancelled?: boolean;
}

export class WorkerPoolManager {
    private workers: Worker[] = [];
    private availableWorkers: Worker[] = [];
    private taskQueue: ActiveTask[] = [];
    private activeTasks = new Map<string, ActiveTask>();
    private activeTasksCount = 0;
    private maxWorkers: number;
    private workerType: WorkerType;
    private errorCounts = new Map<Worker, number>();
    private readonly MAX_ERRORS_PER_WORKER = 3;
    private readonly RETRY_DELAYS = [1000, 2000, 5000]; // Exponential backoff

    constructor(workerType: WorkerType, maxWorkers?: number) {
        this.workerType = workerType;
        this.maxWorkers = Math.min(
            maxWorkers || 4,
            typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 4) : 4
        );
        this.initializePool();
    }

    private initializePool(): void {
        for (let i = 0; i < this.maxWorkers; i++) {
            const worker = this.createWorker();
            this.workers.push(worker);
            this.availableWorkers.push(worker);
        }
    }

    private createWorker(): Worker {
        const workerPaths: Record<WorkerType, string> = {
            image: new URL('@/workers/image.worker.ts', import.meta.url).href,
            video: new URL('@/workers/ffmpeg.worker.ts', import.meta.url).href,
            pdf: new URL('@/workers/pdf.worker.ts', import.meta.url).href,
        };

        try {
            const worker = new Worker(workerPaths[this.workerType], {
                type: 'module',
                name: `${this.workerType}-worker-${Date.now()}`,
            });

            return worker;
        } catch (error) {
            console.error(`Failed to create ${this.workerType} worker:`, error);
            throw error;
        }
    }

    async execute(task: WorkerTask): Promise<WorkerResult> {
        return new Promise((resolve, reject) => {
            const activeTask: ActiveTask = { task, resolve, reject, cancelled: false };

            this.activeTasks.set(task.id, activeTask);

            if (this.availableWorkers.length > 0) {
                this.runTask(activeTask);
            } else {
                this.taskQueue.push(activeTask);
            }
        });
    }

    // Cancel a specific task
    cancel(taskId: string): boolean {
        const activeTask = this.activeTasks.get(taskId);

        if (!activeTask) {
            // Task might be in queue
            const queueIndex = this.taskQueue.findIndex(t => t.task.id === taskId);
            if (queueIndex !== -1) {
                const cancelledTasks = this.taskQueue.splice(queueIndex, 1);
                if (cancelledTasks[0]) {
                    cancelledTasks[0].task.onCancel?.();
                    cancelledTasks[0].reject(new Error('Task cancelled'));
                }
                return true;
            }
            return false;
        }

        activeTask.cancelled = true;
        activeTask.task.onCancel?.();

        // Send cancellation message to worker
        if (activeTask.worker) {
            try {
                activeTask.worker.postMessage({ action: 'cancel', taskId });
            } catch (error) {
                console.error('Failed to send cancel message:', error);
            }
        }

        this.activeTasks.delete(taskId);
        activeTask.reject(new Error('Task cancelled'));

        return true;
    }

    // Cancel all tasks
    cancelAll(): void {
        // Cancel queued tasks
        this.taskQueue.forEach(activeTask => {
            activeTask.task.onCancel?.();
            activeTask.reject(new Error('Task cancelled'));
        });
        this.taskQueue = [];

        // Cancel active tasks
        this.activeTasks.forEach((activeTask, taskId) => {
            this.cancel(taskId);
        });
    }

    private async retryTask(activeTask: ActiveTask): Promise<void> {
        const { task } = activeTask;
        const currentRetry = task.retryCount || 0;
        const maxRetries = task.maxRetries || 3;

        if (currentRetry >= maxRetries) {
            activeTask.reject(new Error(`Task failed after ${maxRetries} retries`));
            this.activeTasks.delete(task.id);
            return;
        }

        const delay = this.RETRY_DELAYS[Math.min(currentRetry, this.RETRY_DELAYS.length - 1)];

        console.log(`[WorkerPool] Retrying task ${task.id} in ${delay}ms (attempt ${currentRetry + 1}/${maxRetries})`);

        setTimeout(() => {
            task.retryCount = currentRetry + 1;
            this.runTask(activeTask);
        }, delay);
    }

    private runTask(activeTask: ActiveTask): void {
        if (activeTask.cancelled) {
            this.activeTasks.delete(activeTask.task.id);
            return;
        }

        const worker = this.availableWorkers.pop();
        if (!worker) {
            this.taskQueue.push(activeTask);
            return;
        }

        activeTask.worker = worker;
        this.activeTasksCount++;

        const { task } = activeTask;

        const messageHandler = (e: MessageEvent) => {
            const { event, data } = e.data;

            if (event === 'progress' && task.onProgress && activeTask.cancelled !== true) {
                task.onProgress(data.progress);
            } else if (event === 'done') {
                cleanup();
                this.activeTasksCount--;
                this.availableWorkers.push(worker);
                this.errorCounts.set(worker, 0); // Reset error count on success
                this.activeTasks.delete(task.id);

                if (activeTask.cancelled !== true) {
                    activeTask.resolve({ success: true, data: data.result });
                }

                this.processQueue();
            } else if (event === 'error') {
                cleanup();
                this.activeTasksCount--;

                if (!activeTask.cancelled) {
                    // Attempt retry
                    if ((task.retryCount || 0) < (task.maxRetries || 3)) {
                        this.retryTask(activeTask);
                    } else {
                        this.handleWorkerError(worker, new Error(data.message));
                        this.activeTasks.delete(task.id);
                        activeTask.reject(new Error(data.message));
                    }
                }

                this.processQueue();
            }
        };

        const errorHandler = (error: ErrorEvent) => {
            cleanup();
            this.activeTasksCount--;

            if (!activeTask.cancelled) {
                if ((task.retryCount || 0) < (task.maxRetries || 3)) {
                    this.retryTask(activeTask);
                } else {
                    this.handleWorkerError(worker, error.error || new Error(error.message));
                    this.activeTasks.delete(task.id);
                    activeTask.reject(error.error || new Error(error.message));
                }
            }

            this.processQueue();
        };

        const cleanup = () => {
            worker.removeEventListener('message', messageHandler);
            worker.removeEventListener('error', errorHandler);
        };

        worker.addEventListener('message', messageHandler);
        worker.addEventListener('error', errorHandler);

        // Clone buffer for transfer
        const transferBuffer = task.buffer.slice(0);

        // Send task to worker with transferable and namespace info
        worker.postMessage(
            {
                action: 'process',
                buffer: transferBuffer,
                options: {
                    ...task.options,
                    type: task.operation,
                    fileId: task.fileId,
                    toolId: task.toolId,
                },
                taskId: task.id,
            },
            [transferBuffer] // Transfer ownership to worker
        );
    }

    private handleWorkerError(worker: Worker, error: Error): void {
        const errorCount = (this.errorCounts.get(worker) || 0) + 1;
        this.errorCounts.set(worker, errorCount);

        console.error(`Worker error (${errorCount}/${this.MAX_ERRORS_PER_WORKER}):`, error);

        if (errorCount >= this.MAX_ERRORS_PER_WORKER) {
            // Worker is unreliable, replace it
            console.warn('Worker exceeded error limit, replacing...');
            worker.terminate();

            const index = this.workers.indexOf(worker);
            const newWorker = this.createWorker();

            if (index !== -1) {
                this.workers[index] = newWorker;
            }

            this.availableWorkers.push(newWorker);
            this.errorCounts.delete(worker);
        } else {
            // Return worker to pool
            this.availableWorkers.push(worker);
        }
    }

    private processQueue(): void {
        while (this.taskQueue.length > 0 && this.availableWorkers.length > 0) {
            const activeTask = this.taskQueue.shift();
            if (activeTask && !activeTask.cancelled) {
                this.runTask(activeTask);
            }
        }
    }

    // Clear cache for specific file/tool combination
    clearCache(fileId?: string, toolId?: string): void {
        this.workers.forEach(worker => {
            try {
                worker.postMessage({
                    action: 'clearCache',
                    fileId,
                    toolId,
                });
            } catch (error) {
                console.error('Failed to clear worker cache:', error);
            }
        });
    }

    getStats() {
        return {
            totalWorkers: this.workers.length,
            availableWorkers: this.availableWorkers.length,
            queuedTasks: this.taskQueue.length,
            activeTasks: this.activeTasksCount,
        };
    }

    terminate(): void {
        // Cancel all active and queued tasks
        this.cancelAll();

        // Terminate all workers
        this.workers.forEach(worker => worker.terminate());
        this.workers = [];
        this.availableWorkers = [];
        this.taskQueue = [];
        this.activeTasks.clear();
        this.activeTasksCount = 0;
        this.errorCounts.clear();
    }
}

// Global pool instances (singleton pattern)
let imagePool: WorkerPoolManager | null = null;
let videoPool: WorkerPoolManager | null = null;
let pdfPool: WorkerPoolManager | null = null;

export function getWorkerPool(type: WorkerType): WorkerPoolManager {
    switch (type) {
        case 'image':
            if (!imagePool) {
                imagePool = new WorkerPoolManager('image', 4);
            }
            return imagePool;

        case 'video':
            if (!videoPool) {
                videoPool = new WorkerPoolManager('video', 2); // Video processing is heavy
            }
            return videoPool;

        case 'pdf':
            if (!pdfPool) {
                pdfPool = new WorkerPoolManager('pdf', 3);
            }
            return pdfPool;

        default:
            throw new Error(`Unknown worker type: ${type}`);
    }
}

export function terminateAllPools(): void {
    imagePool?.terminate();
    videoPool?.terminate();
    pdfPool?.terminate();
    imagePool = null;
    videoPool = null;
    pdfPool = null;
}

// Helper to generate task IDs
export function generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
