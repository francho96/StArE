import http from 'http';

const ENDPOINT =
  process.env.ENDPOINT ||
  'http://localhost:3001/stare/mock?query=test&metrics=language&numberOfResults=10';
const REQUESTS_PER_CONCURRENCY = parseInt(process.env.REQUESTS || '50', 10);
const CONCURRENCY_LEVELS = [1, 2, 5, 10, 15];
const ITERATIONS = parseInt(process.env.ITERATIONS || '10', 10);

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
      try {
        const status = await makeRequest();
        if (status === 200) {
          completed++;
        } else {
          errors++;
        }
      } catch (err) {
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
    durationMs: duration,
    reqPerSec: requests / (duration / 1000),
  };
}

function calculateStats(data) {
  const n = data.length;
  const mean = data.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(
    data.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / n,
  );
  const min = Math.min(...data);
  const max = Math.max(...data);
  return { mean, std, min, max };
}

async function main() {
  const CONCURRENCY_LEVELS = process.env.CONCURRENCY
    ? process.env.CONCURRENCY.split(',').map(Number)
    : [1, 2, 5, 10, 15];

  console.log(`Starting Multiple Benchmark at ${ENDPOINT}`);
  console.log(`Requests per level: ${REQUESTS_PER_CONCURRENCY}`);
  console.log(`Iterations: ${ITERATIONS}`);
  console.log(`Concurrency levels: ${CONCURRENCY_LEVELS.join(', ')}`);

  const summary = [];

  for (const c of CONCURRENCY_LEVELS) {
    console.log(`\nTesting concurrency: ${c}`);
    const results = [];
    for (let i = 1; i <= ITERATIONS; i++) {
      process.stdout.write(`  Iteration ${i}/${ITERATIONS}... `);
      const res = await runBenchmark(c, REQUESTS_PER_CONCURRENCY);
      results.push(res);
      console.log(`Done (${res.reqPerSec.toFixed(2)} req/s)`);
    }

    const durations = results.map((r) => r.durationMs);
    const rps = results.map((r) => r.reqPerSec);

    const ds = calculateStats(durations);
    const rs = calculateStats(rps);

    summary.push({
      Concurrencia: c,
      Peticiones: REQUESTS_PER_CONCURRENCY,
      'Avg Time (ms)': ds.mean.toFixed(2),
      'Min Time (ms)': ds.min.toFixed(2),
      'Max Time (ms)': ds.max.toFixed(2),
      'Std Time (ms)': ds.std.toFixed(2),
      'Avg RPS': rs.mean.toFixed(2),
      'Min RPS': rs.min.toFixed(2),
      'Max RPS': rs.max.toFixed(2),
      'Std RPS': rs.std.toFixed(2),
    });
  }

  console.log('\n--- Resumen Final ---');
  console.table(summary);
}

main().catch(console.error);
