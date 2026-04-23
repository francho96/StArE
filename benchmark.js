const http = require('http');

const ENDPOINT =
  process.env.ENDPOINT ||
  'http://localhost:3001/stare/mock?query=test&metrics=language&numberOfResults=10';
const REQUESTS_PER_CONCURRENCY = parseInt(process.env.REQUESTS || '50', 10);
const CONCURRENCY_LEVELS = [1, 2, 5, 10];

async function makeRequest() {
  return new Promise((resolve, reject) => {
    http
      .get(ENDPOINT, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => resolve(res.statusCode));
      })
      .on('error', (err) => reject(err));
  });
}

async function runBenchmark(concurrency, requests) {
  const start = Date.now();
  let completed = 0;
  let errors = 0;

  const worker = async () => {
    while (completed + errors < requests) {
      const currentReq = completed + errors;
      if (currentReq >= requests) break;

      try {
        const status = await makeRequest();
        if (status === 200) {
          completed++;
        } else {
          console.log('Non-200 Status:', status);
          errors++;
        }
      } catch (err) {
        console.error('Request Error:', err.message);
        errors++;
      }
    }
  };

  const promises = [];
  for (let i = 0; i < concurrency; i++) {
    promises.push(worker());
  }

  await Promise.all(promises);
  const end = Date.now();
  const duration = end - start;

  return {
    concurrency,
    requests,
    completed,
    errors,
    durationMs: duration,
    reqPerSec: (requests / (duration / 1000)).toFixed(2),
  };
}

async function main() {
  console.log(`Starting Benchmark at ${ENDPOINT}`);
  console.log(`Total Requests per level: ${REQUESTS_PER_CONCURRENCY}`);

  for (const c of CONCURRENCY_LEVELS) {
    console.log(`\nTesting concurrency: ${c}`);
    const result = await runBenchmark(c, REQUESTS_PER_CONCURRENCY);
    console.table([result]);
  }
}

main().catch(console.error);
