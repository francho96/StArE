import 'dotenv/config';
import debug from 'debug';
import _ from 'lodash';
import os from 'os';

const debugInstance = debug('app');

const args = process.argv.slice(2);

const stare = require('../../lib').default({
  engines: ['solr'],
  enableMultiCore: (process.env.ENABLE_MULTI_CORE === 'true'),
  workerThreads: Number(process.env.WORKER_THREADS) || os.cpus().length,
  customScraper: "./my-custom-scraper",
  customScraperOpts: {
    core: "starejs-html"
  },
  solr: {
    baseUrl: process.env.SOLR_ENDPOINT || 'http://localhost:8983',
    core: "starejs",
    titleProperty: 'title',
    bodyProperty: 'body',
    snippetProperty: 'snippet',
    imageProperty: 'image',
    linkProperty: 'link'
  },
});

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

/**
 * Principal function of the application
 * @param metrics - Metrics aRray
 * @param engine - Search engine to use
 * @param query - Search param
 * @param numberOfResults - Numbers of the results
 */
const app = async (metrics: string[], engine: string, query: string, numberOfResults: string): Promise<void> => {
  try {
    const result: StareResponse = await stare(engine, query, Number(numberOfResults), metrics);
    debugInstance("%O", result);
  } catch (err) {
    debugInstance("Error en app: " + err);
  }
};

if (args.length < 4) {
  debugInstance('Uso: npm start <métricas> <motor> <query> <número_resultados>');
  debugInstance('Ejemplo: npm start "language,length" solr "typescript" 10');
  process.exit(1);
}


debugInstance('Argumentos recibidos:', args);

const metrics = args[0].split(",");
const engine = args[1];
const query = args[2];
const numberOfResults = args[3];

app(metrics, engine, query, numberOfResults)
  .catch(error => {
    debugInstance('Error ejecutando la aplicación:', error);
    process.exit(1);
  });