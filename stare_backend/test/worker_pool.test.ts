import path from 'path';
import WorkerPool from '../lib/worker_pool';

describe('WorkerPool', () => {
    let pool: WorkerPool;
    const workerPath = path.resolve(__dirname, 'simple-worker.js');

    beforeEach(() => {
        pool = new WorkerPool(1, workerPath);
    });

    afterEach(() => {
        pool.close();
    });

    test('successfully processes a task', (done) => {
        pool.runTask({ message: 'Hello' }, (err, result) => {
            expect(err).toBeNull();
            expect(result).toEqual({ err: null, result: 'Success: Hello' });
            done();
        });
    });

    test('queues tasks when no workers are free', (done) => {
        let completedCount = 0;

        // First task occupies the only worker thread
        pool.runTask({ message: 'Task 1' }, (err, result) => {
            expect(err).toBeNull();
            expect(result).toEqual({ err: null, result: 'Success: Task 1' });
            completedCount++;
            if (completedCount === 2) done();
        });

        // Second task should be queued
        pool.runTask({ message: 'Task 2' }, (err, result) => {
            expect(err).toBeNull();
            expect(result).toEqual({ err: null, result: 'Success: Task 2' });
            completedCount++;
            if (completedCount === 2) done();
        });
    });

    test('handles worker crashes and spawns a new worker', (done) => {
        // A crash forces process.exit(1) in the worker script,
        // which the Worker thread catches and emits as 'error'.
        pool.runTask({ shouldFail: true, crash: true }, (err, result) => {
            expect(err).toBeDefined();
            expect(err!.message).toMatch(/Worker( stopped)?/);

            // Verify the pool spawned a replacement worker by running another task
            pool.runTask({ message: 'After crash' }, (err2, result2) => {
                expect(err2).toBeNull();
                expect(result2).toEqual({ err: null, result: 'Success: After crash' });
                done();
            });
        });
    });

    test('handles worker emitting error when task is not assigned', (done) => {
        // We can simulate an unassigned error by hooking into the internal worker
        // that is free, and manually sending a crash task without setting kTaskInfo.
        const internalWorker = (pool as any).workers[0];

        pool.on('error', (err) => {
            expect(err).toBeDefined();
            expect(err.message).toMatch(/Worker/);
            done();
        });

        // Send a message directly to bypass runTask
        internalWorker.postMessage({ shouldFail: true, crash: true });
    });
});
