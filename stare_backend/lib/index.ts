import _ from 'lodash';
import path from 'path';
import './config/defaultOptions';
import { isMainThread, parentPort, threadId } from 'worker_threads';
import debug from 'debug';
import WorkerPool from './worker_pool';
import { MetricResult, Partition, PartitionResult, StareOptions, WorkerData } from './interfaces';

const debugInstance = debug(`stare.js:server [Thread #${threadId}]`);



interface SerpResponse {
  totalResults: string | number;
  searchTerms: string;
  numberOfItems: number;
  startIndex: number;
  documents: Array<{
    metrics?: { [key: string]: any };
    [key: string]: any;
  }>;
}



type WebSearchFunction = (
  engine: string, 
  query: string, 
  numberOfResults: number, 
  metrics: string[], 
  startIndex?: number
) => Promise<SerpResponse>;

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
let getMetrics: (serpResponse: SerpResponse, metrics: string[]) => Promise<MetricResult[]>;



/**
 * Module exports a constructor with the optional StArE.js parameters
 * as an argument.
 * @param {Partial<StareOptions>} opts - Optional configurations for StArE.js
 */
const stare = (opts: Partial<StareOptions> = {}): WebSearchFunction | WebSearchWorkerFunction | null => {
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
     * Spawn a pool of worker threads to query for documents and calculate the specified metrics.
     *
     * @async
     * @function webSearch
     * @param {string} engine SERP to use [google|bing|ecosia|elasticsearch]
     * @param {string} query Search query
     * @param {number} numberOfResults Number of documents to get from the SERP.
     * @param {string[]} metrics Array with the name of the metrics to calculate
     * @param {number} startIndex Number of leading documents to skip.
     * @return {Promise<SerpResponse>} An object with the standardized result page (SERP)
     */
    const webSearch: WebSearchFunction = async (
      engine: string, 
      query: string, 
      numberOfResults: number, 
      metrics: string[], 
      startIndex: number = 0
    ): Promise<SerpResponse> => {
      const threads = global.stareOptions.enableMultiCore ? Number(global.stareOptions.workerThreads) : 1;
      debugInstance(`using [${threads}] threads`);
      
      const partitions = generatePartitions(threads, numberOfResults, startIndex);
      debugInstance("Initializing worker thread pool...");
      
      const workerPool = new WorkerPool(partitions.threads, __filename);
      const promises: Promise<SerpResponse>[] = [];

      for (const partition of partitions.partitions) {
        const data: WorkerData = {
          engine,
          query,
          startIndex: partition.startIndex,
          numberOfResults: partition.numResults,
          metrics,
          opts
        };
        
        debugInstance("Sending partition data %O", { 
          startIndex: data.startIndex, 
          numberOfResults: data.numberOfResults 
        });

        promises.push(new Promise<SerpResponse>((resolve, reject) => {
          workerPool.runTask(data, (err, result) => {
            if (err === null) {
              resolve(result as SerpResponse);
            } else {
              reject(`Error while obtaining metrics for range [${startIndex}, ${startIndex + data.numberOfResults}]`);
            }
          });
        }));
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
        listOfListOfDocuments.push(value.documents);
        serpResponse.numberOfItems += value.numberOfItems;
      });

      serpResponse.documents = _.flatten(listOfListOfDocuments);
      workerPool.close();
      
      return serpResponse;
    };

    return webSearch;
  } else {
    /**
     * Makes a request to the specified search engine which returns (callback),
     * the SERP with the calculated metrics.
     *
     * @async
     * @function webSearch
     * @param {string} engine SERP to use [google|bing|ecosia|elasticsearch]
     * @param {string} query Search query
     * @param {number} startIndex Number of leading documents to skip.
     * @param {number} numberOfResults Number of documents to get from the SERP.
     * @param {string[]} metrics Array with the name of the metrics to calculate
     * @return {Promise<SerpResponse>} An object with the standardized result page (SERP)
     */
    const webSearch_: WebSearchWorkerFunction = async (
      engine: string, 
      query: string, 
      startIndex: number, 
      numberOfResults: number, 
      metrics: string[]
    ): Promise<SerpResponse> => {
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
            getMetrics(formattedResponse, metricsArray)
              .then((values: MetricResult[]) => {
                for (const response of values) {
                  if (typeof formattedResponse.documents[response.index]!.metrics === 'undefined') {
                    formattedResponse.documents[response.index]!.metrics = {};
                  }
                  formattedResponse.documents[response.index]!.metrics![response.name] = response.value;
                }
                resolve(formattedResponse);
              })
              .catch(err => reject(err));
          })
          .catch((err: any) => reject(err));
      });
    };

    return webSearch_;
  }
};

if (!isMainThread) {
  debugInstance("initializing worker thread...");
  parentPort!.on("message", async (data: WorkerData) => {
    const webSearch = stare(data.opts) as WebSearchWorkerFunction;
    try {
      const result = await webSearch(
        data.engine,
        data.query,
        data.startIndex,
        data.numberOfResults,
        data.metrics
      );
      parentPort!.postMessage(result);
    } catch (e) {
      parentPort!.postMessage("error");
    }
  });
}

export default stare;