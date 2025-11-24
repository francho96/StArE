import axios from 'axios';
import axiosRetry from 'axios-retry';
import _ from 'lodash';
import debug from 'debug';

const debugInstance = debug('app');

const args = process.argv.slice(2);
const numBackendInstances = Number(args[0]);
const engine = args[1];
const query = args[2];
const numberOfResults = Number(args[3]);
const metrics = args[4];

interface Partition {
  startIndex: number;
  numResults: number;
}

interface PartitionResult {
  threads: number;
  partitions: Partition[];
  numPartitions: number;
}

interface StareDocument {
  title: string;
  link: string;
  snippet: string;
  image: string;
  metrics?: { [key: string]: any };
  [key: string]: any;
}

interface SerpResponse {
  totalResults: string | number;
  searchTerms: string;
  numberOfItems: number;
  startIndex: number;
  documents: StareDocument[];
}

axiosRetry(axios, {
  retries: Number(process.env.MAX_QUERY_RETRIES) || 30,
  retryCondition: (error: any) => {
    return error.response?.status === 429;
  },
  onRetry: (retryCount: number, error: any, requestConfig: any) => {
    debugInstance(`Hit an already busy backend instance in request [${requestConfig.url}]. Retry attempt [${retryCount}]`);
  }
});


const generatePartitions = (numBackendInstances: number, numResults: number): PartitionResult => {
  debugInstance(`generating partitions with [${numBackendInstances}] numBackendInstances and [${numResults}] numResults`);
  
  if (numResults < numBackendInstances) {
    return {
      threads: 1,
      partitions: [{ startIndex: 0, numResults: numResults }],
      numPartitions: 1
    };
  }

  const partitions: Partition[] = [];
  const partitionSize = Math.floor(numResults / numBackendInstances);
  debugInstance(`using partition size [${partitionSize}]`);
  
  let i = 0;
  while (partitions.length < numBackendInstances) {
    if ((partitions.length === numBackendInstances - 1) && (numResults % numBackendInstances !== 0)) {
      const lastPartition = partitions[partitions.length - 1];
      partitions.push({
        startIndex: i,
        numResults: numResults - lastPartition.startIndex - lastPartition.numResults
      });
      return {
        threads: numBackendInstances,
        partitions: partitions,
        numPartitions: partitions.length
      };
    }
    partitions.push({ startIndex: i, numResults: partitionSize });
    i += partitionSize;
  }
  
  return {
    threads: numBackendInstances,
    partitions: partitions,
    numPartitions: partitions.length
  };
};

const getResults = async (
  engine: string, 
  query: string, 
  numberOfResults: number, 
  numBackendInstances: number, 
  metrics: string
): Promise<SerpResponse> => {
  const partitions = generatePartitions(numBackendInstances, numberOfResults);
  debugInstance("Partitions: %O", partitions);
  
  const requests: Promise<SerpResponse>[] = [];

  for (const partition of partitions.partitions) {
    const STARE_API_URL = process.env.STARE_API_URL;
    const requestUrl = `${STARE_API_URL}/stare/${engine}?query=${encodeURIComponent(query)}` +
      `&startIndex=${partition.startIndex}` +
      `&numberOfResults=${partition.numResults}` +
      `&metrics=${encodeURIComponent(metrics)}`;
    
    debugInstance(requestUrl);
    
    requests.push(
      axios.get<SerpResponse>(requestUrl)
        .then(response => response.data)
    );
  }

  const responses = await Promise.all(requests);
  
  const serpResponse: SerpResponse = {
    totalResults: responses[0].totalResults,
    searchTerms: responses[0].searchTerms,
    numberOfItems: 0,
    startIndex: responses[0].startIndex,
    documents: []
  };

  const listOfListOfDocuments: StareDocument[][] = [];
  responses.forEach((value) => {
    listOfListOfDocuments.push(value.documents);
    serpResponse.numberOfItems += value.numberOfItems;
  });

  serpResponse.documents = _.flatten(listOfListOfDocuments);
  return serpResponse;
};


const app = async (
  engine: string, 
  query: string, 
  numberOfResults: number, 
  numBackendInstances: number, 
  metrics: string
): Promise<void> => {
  try {
    const result = await getResults(engine, query, numberOfResults, numBackendInstances, metrics);
    
    let docsWithMetrics = 0;
    for (const doc of result.documents) {
      debugInstance("title: " + doc.title);
      if (!_.isEmpty(doc.metrics)) {
        docsWithMetrics += 1;
      }
    }
    
    debugInstance("Num resultados " + result.documents.length);
    debugInstance("Docs con metrics " + docsWithMetrics);
  } catch (err) {
    debugInstance("Error en app: " + err);
  }
};

// Validar argumentos
if (args.length < 5) {
  debugInstance('Uso: npm start <numBackendInstances> <engine> <query> <numberOfResults> <metrics>');
  debugInstance('Ejemplo: npm start 3 solr "typescript" 100 "keywords-position,language,length"');
  process.exit(1);
}

// args:
//  numBackendInstances
//  engine
//  query
//  numberOfResults
//  metrics as a single string, separated by commas
//    example: "keywords-position,language,length,links,multimedia,perspicuity,ranking"

debugInstance('Argumentos recibidos:', args);

app(engine, query, numberOfResults, numBackendInstances, metrics)
  .catch(error => {
    debugInstance('Error ejecutando la aplicación:', error);
    process.exit(1);
  });