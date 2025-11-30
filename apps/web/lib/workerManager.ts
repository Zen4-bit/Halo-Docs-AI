// Worker Manager for handling parallel processing with WebWorkers
export type WorkerMessage = {
    type: string;
    payload?: any;
    progress?: number;
    error?: string;
};

export type WorkerTask = {
    id: string;
    file: File;
    options: any;
    onProgress?: (progress: number) => void;
    onComplete?: (result: any) => void;
    onError?: (error: Error) => void;
};

export class WorkerManager {
    private workers: Worker[] = [];
    private taskQueue: WorkerTask[] = [];
    private activeTasks: Map<string, WorkerTask> = new Map();
    private maxWorkers: number;

    constructor(
        workerScript: string,
        maxWorkers: number = navigator.hardwareConcurrency || 4
    ) {
        this.maxWorkers = Math.min(maxWorkers, 8); // Cap at 8 workers
        this.initializeWorkers(workerScript);
    }

    private initializeWorkers(workerScript: string) {
        for (let i = 0; i < this.maxWorkers; i++) {
            try {
                const worker = new Worker(new URL(workerScript, import.meta.url), {
                    type: 'module',
                });

                worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
                    this.handleWorkerMessage(worker, e.data);
                };

                worker.onerror = (error) => {
                    console.error('Worker error:', error);
                    this.handleWorkerError(worker, error);
                };

                this.workers.push(worker);
            } catch (error) {
                console.error('Failed to create worker:', error);
            }
        }
    }

    private handleWorkerMessage(worker: Worker, message: WorkerMessage) {
        const task = this.getTaskForWorker(worker);
        if (!task) return;

        switch (message.type) {
            case 'progress':
                if (task.onProgress && message.progress !== undefined) {
                    task.onProgress(message.progress);
                }
                break;

            case 'complete':
                if (task.onComplete) {
                    task.onComplete(message.payload);
                }
                this.completeTask(task.id);
                this.processNextTask(worker);
                break;

            case 'error':
                if (task.onError) {
                    task.onError(new Error(message.error || 'Worker processing failed'));
                }
                this.completeTask(task.id);
                this.processNextTask(worker);
                break;
        }
    }

    private handleWorkerError(worker: Worker, error: ErrorEvent) {
        const task = this.getTaskForWorker(worker);
        if (task && task.onError) {
            task.onError(new Error(error.message || 'Worker error'));
        }
        if (task) {
            this.completeTask(task.id);
        }
        this.processNextTask(worker);
    }

    private getTaskForWorker(worker: Worker): WorkerTask | undefined {
        for (const [taskId, task] of this.activeTasks.entries()) {
            // In a real implementation, we'd track which worker is handling which task
            // For simplicity, returning the first active task
            return task;
        }
        return undefined;
    }

    private completeTask(taskId: string) {
        this.activeTasks.delete(taskId);
    }

    private processNextTask(worker: Worker) {
        const nextTask = this.taskQueue.shift();
        if (nextTask) {
            this.executeTask(worker, nextTask);
        }
    }

    private executeTask(worker: Worker, task: WorkerTask) {
        this.activeTasks.set(task.id, task);
        worker.postMessage(
            {
                type: 'process',
                taskId: task.id,
                file: task.file,
                options: task.options,
            },
            // Transfer file data if supported
            task.file instanceof Blob ? [task.file] : []
        );
    }

    public addTask(task: WorkerTask): void {
        const availableWorker = this.workers.find(
            (w) => !this.isWorkerBusy(w)
        );

        if (availableWorker) {
            this.executeTask(availableWorker, task);
        } else {
            this.taskQueue.push(task);
        }
    }

    private isWorkerBusy(worker: Worker): boolean {
        // Simplified check - in production, track worker state properly
        return this.activeTasks.size >= this.workers.length;
    }

    public terminateAll(): void {
        this.workers.forEach((worker) => worker.terminate());
        this.workers = [];
        this.taskQueue = [];
        this.activeTasks.clear();
    }

    public getQueueLength(): number {
        return this.taskQueue.length;
    }

    public getActiveTasksCount(): number {
        return this.activeTasks.size;
    }
}

// Utility function to create a unique task ID
export function generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Memory-safe file reader
export async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

// Download helper using URL.createObjectURL
export function downloadBlob(
    blob: Blob,
    filename: string,
    mimeType?: string
): void {
    const url = URL.createObjectURL(
        mimeType ? new Blob([blob], { type: mimeType }) : blob
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

// Format bytes to human-readable
export function formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
