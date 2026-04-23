import _ from 'lodash';
import path from 'path';
import './config/defaultOptions';
import { isMainThread, parentPort, threadId } from 'worker_threads';
import debug from 'debug';
import WorkerPool from './worker_pool';
import { allDocsHtmlCode } from './scrapper';
import { parseDocuments } from './parser';
import {
  MetricResult,
  Partition,
  PartitionResult,
  SerpResponse,
  ScrapedSerpResponse,
  ParsedSerpResponse,
  StareInstance,
  StareOptions,
  WorkerData
} from './interfaces';

const debugInstance = debug(`stare.js:server [Thread #${threadId}]`);


type WebSearchWorkerFunction = (
  engine: string,
  query: string,
  startIndex: number,
  numberOfResults: number,
  metrics: string[]
) => Promise<SerpResponse>;

/**
 * List supported engines.
 * Don't insta-import because some require configuration/API Keys
 * that are not necessary to run if the SERP is not required
 */
const SUPPORTED_ENGINES = [
  'bing',
  'ecosia',
  'elasticsearch',
  'google',
  'solr',
  'searchcloud'
];

/* Engines to be imported */
const engines: { [key: string]: any } = {};

/* Will be used to load the metrics (default + user metrics). */
let getMetrics: (serpResponse: SerpResponse, metrics: string[], skipScraping?: boolean) => Promise<MetricResult[]>;

/**
 * Executes a web search query on a specific search engine.
 */
async function webSearch_(
  engine: string,
  query: string,
  startIndex: number,
  numberOfResults: number,
  metrics: string[],
  opts?: any
): Promise<SerpResponse> {
  return new Promise<SerpResponse>((resolve, reject) => {
    if (!_.has(engines, engine)) {
      reject(`Search Engine '${engine}' not supported.`);
      return;
    }

    const numResults = Number(numberOfResults);
    const metricsArray = metrics || [];

    const searchEngine = engines[engine];

    searchEngine(query, startIndex, numResults)
      .then((formattedResponse: SerpResponse) => {
        if (metricsArray.length > 0) {
          getMetrics(formattedResponse, metricsArray)
            .then((values: MetricResult[]) => {
              for (const response of values) {
                if (typeof (formattedResponse.documents as any)?.[response.index]?.metrics === 'undefined') {
                  (formattedResponse.documents as any)[response.index].metrics = {};
                }
                (formattedResponse.documents as any)[response.index].metrics[response.name] = response.value;
              }
              resolve(formattedResponse);
            })
            .catch(err => reject(err));
        } else {
          resolve(formattedResponse);
        }
      })
      .catch((err: any) => reject(err));
  });
}

/**
 * Module exports a constructor with the optional StArE.js parameters
 * as an argument.
 * @param {Partial<StareOptions>} opts - Optional configurations for StArE.js
 * @returns {StareInstance | null} An object with scraper, parser, metrics, and search methods
 */
const stare = (opts: Partial<StareOptions> = {}): StareInstance | null => {
  if (isMainThread) {
    debugInstance(`Optionals: %O`, opts);
  }

  /* Override default settings */
  for (const key in global.stareOptions) {
    if (opts.hasOwnProperty(key)) {
      (global.stareOptions as any)[key] = opts[key];
    }
  }

  /* Import only the SERP engines required */
  for (const engine of global.stareOptions.engines) {
    if (SUPPORTED_ENGINES.includes(engine)) {
      engines[engine] = require(`./serp/${engine}`).default || require(`./serp/${engine}`);
    }
  }

  /* Import personal SERP, this will override the integrated ones if the key name is the name */
  for (const engine in global.stareOptions.personalSERPs) {
    const enginePath = path.resolve(process.cwd(), global.stareOptions.personalSERPs[engine]!);
    engines[engine] = require(enginePath).default || require(enginePath);
  }

  /* StArE can't work without SERP engines configured */
  if (Object.keys(engines).length === 0) {
    debugInstance("No valid SERP engines had been required.");
    return null;
  }

  /* Has to be imported after set the optional "personalMetrics" so all can be indexed */
  getMetrics = require('./metrics').default || require('./metrics');

  if (isMainThread) {
    /**
     * Generate partitions for parallel processing
     */
    const generatePartitions = (threads: number, numResults: number, startIndex: number): PartitionResult => {
      debugInstance(`Generating partitions with args threads [${threads}], numResults [${numResults}], startIndex [${startIndex}]`);

      if (numResults < threads) {
        return {
          threads: 1,
          partitions: [{ startIndex, numResults }],
          numPartitions: 1
        };
      }

      const partitions: Partition[] = [];
      const partitionSize = Math.floor(numResults / threads);
      debugInstance(`using partition size [${partitionSize}]`);

      let i = startIndex;
      while (partitions.length < threads) {
        if ((partitions.length === threads - 1) && (numResults % threads !== 0)) {
          partitions.push({
            startIndex: i,
            numResults: numResults - (partitionSize * (threads - 1))
          });
          return {
            threads,
            partitions,
            numPartitions: partitions.length
          };
        }
        partitions.push({ startIndex: i, numResults: partitionSize });
        i += partitionSize;
      }

      return {
        threads,
        partitions,
        numPartitions: partitions.length
      };
    };

    /**
     * Internal helper: query the SERP engine for raw results (no scraping, no metrics).
     * Uses worker threads if multi-core is enabled.
     */
    const querySerp = async (
      engine: string,
      query: string,
      numberOfResults: number,
      startIndex: number = 0,
      metrics: string[] = []
    ): Promise<SerpResponse> => {
      const threads = global.stareOptions.enableMultiCore ? Number(global.stareOptions.workerThreads) : 1;
      debugInstance(`using [${threads}] threads`);

      const partitions = generatePartitions(threads, numberOfResults, startIndex);
      const promises: Promise<SerpResponse>[] = [];

      let workerPool: WorkerPool | null = null;
      /* istanbul ignore next */
      if (process.env.NODE_ENV !== 'test') {
        if (!(global as any).globalWorkerPool) {
          debugInstance("Initializing global worker thread pool...");
          (global as any).globalWorkerPool = new WorkerPool(threads, __filename);
        }
        workerPool = (global as any).globalWorkerPool;
      }

      for (const partition of partitions.partitions) {
        if (process.env.NODE_ENV === 'test') {
          // In test environment, run directly to get coverage and avoid Jest worker import issues
          promises.push(
            webSearch_(engine, query, partition.startIndex, partition.numResults, metrics, opts)
          );
        } else {
          /* istanbul ignore next */
          {
            const data: WorkerData = {
              engine,
              query,
              startIndex: partition.startIndex,
              numberOfResults: partition.numResults,
              metrics: metrics,
              opts
            };

            debugInstance("Sending partition data %O", {
              startIndex: data.startIndex,
              numberOfResults: data.numberOfResults
            });

            promises.push(new Promise<SerpResponse>((resolve, reject) => {
              workerPool!.runTask(data, (err, result) => {
                if (err === null && result && result.err === null) {
                  resolve(result.result as SerpResponse);
                } else {
                  const errorMessage = result?.err || err || `Error while querying SERP for range [${data.startIndex}, ${data.startIndex + data.numberOfResults}]`;
                  reject(errorMessage);
                }
              });
            }));
          }
        }
      }

      // Join the partition responses together
      const responses = await Promise.all(promises);
      const serpResponse: SerpResponse = {
        totalResults: responses[0]!.totalResults,
        searchTerms: responses[0]!.searchTerms,
        numberOfItems: 0,
        startIndex: responses[0]!.startIndex,
        documents: []
      };

      const listOfListOfDocuments: any[][] = [];
      responses.forEach((value) => {
        listOfListOfDocuments.push(value.documents || []);
        serpResponse.numberOfItems += (Number(value.numberOfItems) || 0);
      });

      serpResponse.documents = _.flatten(listOfListOfDocuments);


      return serpResponse;
    };

    // =========================================================================
    // Public API: 3 independent steps + full pipeline
    // =========================================================================

    /**
     * Step 1: Scraper
     * Queries the SERP engine and downloads the HTML of each document.
     *
     * @param {string} engine - SERP engine to use
     * @param {string} query - Search query
     * @param {number} numberOfResults - Number of results
     * @param {number} startIndex - Start index (offset)
     * @returns {Promise<ScrapedSerpResponse>} SERP response with htmlCode in each document
     */
    const scraper = async (
      engine: string,
      query: string,
      numberOfResults: number,
      startIndex: number = 0
    ): Promise<ScrapedSerpResponse> => {
      debugInstance(`[scraper] engine=${engine}, query=${query}, n=${numberOfResults}, start=${startIndex}`);
      const serpResponse = await querySerp(engine, query, numberOfResults, startIndex);

      // Download HTML for all documents
      const scrapedDocs = await allDocsHtmlCode(serpResponse as any);
      return {
        ...serpResponse,
        documents: scrapedDocs,
      } as ScrapedSerpResponse;
    };

    /**
     * Step 2: Parser
     * Extracts body text from documents that already have htmlCode.
     *
     * @param {SerpResponse} serpResponse - SERP response with scraped documents
     * @returns {ParsedSerpResponse} SERP response with body text extracted
     */
    const parser = (serpResponse: SerpResponse): ParsedSerpResponse => {
      debugInstance(`[parser] parsing ${serpResponse.documents?.length || 0} documents`);
      return parseDocuments(serpResponse);
    };

    /**
     * Step 3: Metrics
     * Calculates the specified metrics on the documents.
     * If documents don't have htmlCode/body yet, metrics that require scraping
     * will trigger it internally as a fallback.
     *
     * @param {SerpResponse} serpResponse - SERP response with documents
     * @param {string[]} metricsArray - Array of metric names to calculate
     * @returns {Promise<SerpResponse>} SERP response with metrics calculated on each document
     */
    const metrics = async (
      serpResponse: SerpResponse,
      metricsArray: string[]
    ): Promise<SerpResponse> => {
      debugInstance(`[metrics] calculating ${metricsArray.length} metrics on ${serpResponse.documents?.length || 0} documents`);

      // Determine if scraping was already done (documents have htmlCode)
      const alreadyScraped = serpResponse.documents?.some(
        (doc: any) => doc.htmlCode !== undefined && doc.htmlCode !== null
      ) ?? false;

      const values: MetricResult[] = await getMetrics(serpResponse, metricsArray, alreadyScraped);

      // Assign metric values to documents
      const result = { ...serpResponse };
      if (result.documents) {
        for (const response of values) {
          const doc = result.documents[response.index] as any;
          if (doc) {
            if (typeof doc.metrics === 'undefined') {
              doc.metrics = {};
            }
            doc.metrics[response.name] = response.value;
          }
        }
      }

      return result;
    };

    /**
     * Full Pipeline: search
     * Executes all 3 steps in sequence: scraper → parser → metrics.
     *
     * @param {string} engine - SERP engine to use
     * @param {string} query - Search query
     * @param {number} numberOfResults - Number of results
     * @param {string[]} metricsArray - Array of metric names
     * @param {number} startIndex - Start index (offset)
     * @returns {Promise<SerpResponse>} Complete SERP response with metrics
     */
    const search = async (
      engine: string,
      query: string,
      numberOfResults: number,
      metricsArray: string[],
      startIndex: number = 0
    ): Promise<SerpResponse> => {
      debugInstance(`[search] Full pipeline: engine=${engine}, query=${query}, n=${numberOfResults}, metrics=${metricsArray.join(',')}`);

      // Dispatch the full pipeline (SERP + scraping + metrics) to worker threads
      // Each worker executes webSearch_ which handles the complete flow
      const result = await querySerp(engine, query, numberOfResults, startIndex, metricsArray);

      return result;
    };

    const instance: StareInstance = {
      search,
      scraper,
      parser,
      metrics
    };

    return instance;
  } else {
    // Worker threads don't return anything from stare()
    return null;
  }
};

/* istanbul ignore next */
if (!isMainThread) {
  debugInstance("initializing worker thread...");
  parentPort?.on('message', (taskData: WorkerData) => {
    // Initialize stare options for the worker thread
    stare(taskData.opts);
    webSearch_(
      taskData.engine,
      taskData.query,
      taskData.startIndex,
      taskData.numberOfResults,
      taskData.metrics,
      taskData.opts
    )
      .then((result) => {
        parentPort?.postMessage({ err: null, result });
      })
      .catch((err) => {
        parentPort?.postMessage({ err, result: null });
      });
  });
}

export default stare;