import 'dotenv/config';
import debug from 'debug';
import express from 'express';
import cors from 'cors';
import figlet from 'figlet';
import rateLimit from 'express-rate-limit';
import os from 'os';

const debugInstance = debug('simple-express-server');
const app = express();

interface StareOptions {
  engines: string[];
  enableMultiCore: boolean;
  workerThreads: number;
  requestTimeout: number;
  customScraper: string;
  customScraperOpts: {
    core: string;
  };
  personalMetrics?: { [key: string]: string };
  personalSERPs?: { [key: string]: string };
  solr: {
    baseUrl: string;
    core: string;
    titleProperty: string;
    linkProperty: string;
    snippetProperty: string;
    imageProperty: string;
    bodyProperty: string;
  };
}

interface StareResponse {
  totalResults: string | number;
  searchTerms: string;
  numberOfItems: number;
  startIndex: number;
  documents: Array<{
    title: string;
    link: string;
    snippet: string;
    image?: string;
    metrics?: { [key: string]: any };
  }>;
}

app.set('trust proxy', true);

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 2000,
  max: Number(process.env.RATE_LIMIT_MAX_PER_WINDOW) || 1,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    return req.hostname;
  }
});

app.use(cors());
app.use(limiter);
app.options('*', cors());

const myMetrics = {
  a: './my-metrics/a',
  b: './my-metrics/b'
};

const mySERPs = {
  personalSERP: './my-serps/my-serp'
};

const stare = require('../../dist').default({
  engines: ['google'],
  enableMultiCore: (process.env.ENABLE_MULTI_CORE === 'true') || false,
  workerThreads: Number(process.env.WORKER_THREADS) || os.cpus().length,
  requestTimeout: 2000,
  customScraper: "./my-custom-scraper",
  customScraperOpts: {
    core: "starejs-html"
  },
  // personalMetrics: myMetrics,
  // personalSERPs: mySERPs,
  solr: {
    baseUrl: process.env.SOLR_ENDPOINT || 'http://localhost:8983',
    core: 'starejs',
    titleProperty: 'title',
    linkProperty: 'link',
    snippetProperty: 'snippet',
    imageProperty: 'image',
    bodyProperty: 'body',
  },
} as StareOptions);

app.get('/stare/:engine', (request, response) => {
  const engine = request.params.engine;
  const { query, metrics, startIndex, numberOfResults } = request.query;
  
  debugInstance(`Handling arguments: %O`, request.query);
  
  if (!query || !metrics || !numberOfResults) {
    response.status(400).json({ 
      error: 'Missing required parameters: query, metrics, numberOfResults' 
    });
    return;
  }

  const metricList = (metrics as string).split(",");
  
  console.time('Time taken');
  
  stare(
    engine, 
    query as string, 
    Number(numberOfResults), 
    metricList, 
    Number(startIndex || 0)
  )
    .then((result: StareResponse) => {
      console.timeEnd('Time taken');
      response.status(200).json(result);
    })
    .catch((err: Error) => {
      debugInstance(err);
      response.status(500).json({ 
        error: 'Internal server error', 
        message: err.message 
      });
    });
});

app.get("/health", (request, response) => {
  response.status(200).send("Healthy!");
});

app.get('/ip', (request, response) => {
  response.send({
    ip: request.ip, 
    host: request.host, 
    hostname: request.hostname, 
    headers: request.headers
  });
});

const PORT = process.env.SERVER_PORT || 3000;

app.listen(PORT, () => {
  debugInstance("WorkingDir %s", process.cwd());
  
  figlet.text('StArE.js-server', (err: Error | null, data?: string) => {
    if (err) {
      debugInstance('Error generating figlet:', err);
      return;
    }
    if (data) {
      debugInstance(data);
    }
  });
  
  debugInstance(`Using Request Limits %O`, {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 30000,
    max: Number(process.env.RATE_LIMIT_MAX_PER_WINDOW) || 1,
  });
  
  console.log(`App running on [http://localhost:${PORT}]!`);
});

export default app;