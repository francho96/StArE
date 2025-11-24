import debug from 'debug';
import _ from 'lodash';

const debugInstance = debug('stare.js:server/serp/bing');

interface BingDocument {
  title: string;
  link: string;
  snippet: string;
  image?: any;
}

interface BingWebPage {
  value: Array<{
    url: string;
    name: string;
    snippet: string;
    image?: any;
  }>;
  totalEstimatedMatches: number;
}

interface BingSearchResponse {
  webPages: BingWebPage;
  queryContext: {
    originalQuery: string;
  };
}

interface SerpResponse {
  totalResults: string;
  searchTerms: string;
  numberOfItems: number;
  startIndex: number;
  documents: BingDocument[];
}

try {
  require.resolve(`${process.cwd()}/node_modules/ms-rest-azure`);
  require.resolve(`${process.cwd()}/node_modules/azure-cognitiveservices-websearch`);
} catch (e) {
  debugInstance("Package 'ms-rest-azure' or 'azure-cognitiveservices-websearch' is not installed");
  process.exit((e as NodeJS.ErrnoException).code);
}

const CognitiveServicesCredentials = require(`${process.cwd()}/node_modules/ms-rest-azure`).CognitiveServicesCredentials;
const WebSearchAPIClient = require(`${process.cwd()}/node_modules/azure-cognitiveservices-websearch`);

if (_.isEmpty(global.stareOptions.bing.serviceKey)) {
  throw new Error(`You must define your Azure Cognitive Services for WebSearch key (BING_SERVICE_KEY) in the property 'bing.serviceKey' in the StArE.js options.`);
}

const credentials = new CognitiveServicesCredentials(global.stareOptions.bing.serviceKey);
const webSearchApiClient = new WebSearchAPIClient(credentials);

/**
 * Make the request to the Bing API.
 * 
 * @param {string} query 
 * @param {number} offset 
 * @param {number} count Must be between 1 and 50 as per Bing API rules.
 */
async function searchWithBingApi(query: string, offset: number, count: number): Promise<BingSearchResponse> {
  /**
   * Documentation opts available on:
   * https://docs.microsoft.com/en-us/javascript/api/@azure/cognitiveservices-websearch/websearchoptionalparams?view=azure-node-latest
   */
  const opts = {
    count: count,
    offset: offset
  };

  return webSearchApiClient.web.search(query, opts);
}

/**
 * Sort the responses from the Bing API,
 * these are pushed to an array based on the 
 * arriving order.
 * @param {BingSearchResponse[]} responses 
 */
function sortApiResults(responses: BingSearchResponse[]): BingDocument[] {
  const finalItems: BingDocument[] = [];
  
  responses.forEach(response => {
    const responseItems = _.get(response, 'webPages.value', []);

    responseItems.forEach(item => {
      finalItems.push({
        link: _.get(item, 'url', ''),
        title: _.get(item, 'name', ''),
        snippet: _.get(item, 'snippet', ''),
        image: _.get(item, 'image')
      });
    });
  });

  return finalItems;
}

/**
 * Get the SERP from Bing and returns an object with the StArE.js standard format.
 *
 * @async
 * @param {string} query The search query.
 * @param {number} numberOfResults Number of documents to get from the SERP.
 * @returns {Promise<SerpResponse>} Promise object with the standarized StArE.js formatted SERP response from Bing.
 */
async function getResultPages(query: string, numberOfResults?: number): Promise<SerpResponse> {
  if (!query || query.length === 0) {
    throw new Error('Query cannot be null.');
  }

  const MAX_BING_API_DOCUMENTS = 100;
  const MAX_PER_REQUEST = 50;

  const resultsCount = numberOfResults || global.stareOptions.numberOfResults;
  const finalNumberOfResults = resultsCount > MAX_BING_API_DOCUMENTS ? MAX_BING_API_DOCUMENTS : resultsCount;

  const searchRequests: Promise<BingSearchResponse>[] = [];
  let offset = 0;
  let remainingResults = finalNumberOfResults;
  let page = 1;

  while (remainingResults > 0) {
    const count = remainingResults > MAX_PER_REQUEST ? MAX_PER_REQUEST : remainingResults;
    searchRequests.push(searchWithBingApi(query, offset, count));
    remainingResults -= count;
    offset = MAX_PER_REQUEST * page;
    page++;
  }

  try {
    const responses = await Promise.all(searchRequests);
    const items = sortApiResults(responses);

    const formattedResponse: SerpResponse = {
      totalResults: Number(responses[0].webPages.totalEstimatedMatches).toLocaleString().replace(/,/g, '.'),
      searchTerms: responses[0].queryContext.originalQuery,
      numberOfItems: items.length,
      startIndex: 1,
      documents: items
    };

    return formattedResponse;
  } catch (err) {
    throw err;
  }
}

export default getResultPages;