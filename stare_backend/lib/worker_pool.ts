import { AsyncResource } from 'async_hooks';
import { EventEmitter } from 'events';
import { Worker } from 'worker_threads';
import debug from 'debug';

const debugInstance = debug('stare.js:server.worker_pool');

const kTaskInfo = Symbol('kTaskInfo');
const kWorkerFreedEvent = Symbol('kWorkerFreedEvent');

interface Task {
  task: any;
  callback: (err: Error | null, result?: any) => void;
}

interface WorkerWithTaskInfo extends Worker {
  [kTaskInfo]?: WorkerPoolTaskInfo;
}

class WorkerPoolTaskInfo extends AsyncResource {
  callback: (err: Error | null, result?: any) => void;

  constructor(callback: (err: Error | null, result?: any) => void) {
    super('WorkerPoolTaskInfo');
    this.callback = callback;
  }

  done(err: Error | null, result?: any): void {
    this.runInAsyncScope(this.callback, null, err, result);
    this.emitDestroy();  // `TaskInfo`s are used only once.
  }
}

class WorkerPool extends EventEmitter {
  private numThreads: number;
  private workers: WorkerWithTaskInfo[];
  private freeWorkers: WorkerWithTaskInfo[];
  private tasks: Task[];

  constructor(numThreads: number, path: string) {
    super();
    this.numThreads = numThreads;
    this.workers = [];
    this.freeWorkers = [];
    this.tasks = [];

    for (let i = 0; i < numThreads; i++) {
      this.addNewWorker(path);
    }

    // Any time the kWorkerFreedEvent is emitted, dispatch
    // the next task pending in the queue, if any.
    this.on(kWorkerFreedEvent, () => {
      if (this.tasks.length > 0) {
        const { task, callback } = this.tasks.shift()!;
        this.runTask(task, callback);
      }
    });
  }

  private addNewWorker(path: string): void {
    const worker: WorkerWithTaskInfo = new Worker(path);
    
    worker.on('message', (result: any) => {
      // In case of success: Call the callback that was passed to `runTask`,
      // remove the `TaskInfo` associated with the Worker, and mark it as free
      // again.
      if (worker[kTaskInfo]) {
        worker[kTaskInfo].done(null, result);
        worker[kTaskInfo] = undefined;
      }
      this.freeWorkers.push(worker);
      this.emit(kWorkerFreedEvent);
    });
    
    worker.on('error', (err: Error) => {
      // In case of an uncaught exception: Call the callback that was passed to
      // `runTask` with the error.
      if (worker[kTaskInfo]) {
        worker[kTaskInfo].done(err, null);
      } else {
        this.emit('error', err);
      }
      // Remove the worker from the list and start a new Worker to replace the
      // current one.
      const index = this.workers.indexOf(worker);
      if (index > -1) {
        this.workers.splice(index, 1);
      }
      this.addNewWorker(path);
    });

    this.workers.push(worker);
    this.freeWorkers.push(worker);
    this.emit(kWorkerFreedEvent);
  }

  runTask(data: any, callback: (err: Error | null, result?: any) => void): void {
    if (this.freeWorkers.length === 0) {
      // No free threads, wait until a worker thread becomes free.
      this.tasks.push({ task: data, callback });
      return;
    }

    const worker = this.freeWorkers.pop()!;
    worker[kTaskInfo] = new WorkerPoolTaskInfo(callback);
    worker.postMessage(data);
  }

  close(): void {
    debugInstance("Terminating workers...");
    for (const worker of this.workers) {
      worker.terminate();
    }
  }
}

export default WorkerPool;