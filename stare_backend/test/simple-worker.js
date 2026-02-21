// Simple worker for testing functionality of WorkerPool
const { parentPort } = require('worker_threads');

if (parentPort) {
  parentPort.on('message', (taskData) => {
    if (taskData.shouldFail) {
      if (taskData.crash) {
        throw new Error('Worker synthetic crash'); // Force a crash
      } else {
        parentPort.postMessage({ err: new Error('Worker synthetic fail'), result: null });
      }
    } else {
      parentPort.postMessage({ err: null, result: `Success: ${taskData.message}` });
    }
  });
}
