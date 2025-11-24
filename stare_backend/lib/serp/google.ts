import debug from 'debug';
import _ from 'lodash';

const debugInstance = debug('stare.js:server/serp/google');

interface GoogleDocument {
  title: string;
  link: string;
  snippet: string;
  image?: string;
}

interface GoogleSearchResponse {
  data: {
    searchInformation: {
      formattedTotalResults: string;
    };
    queries: {
      request: Array<{
        searchTerms: string;
        startIndex: number;
      }>;
    };
    items?: Array<{
      title: string;
      link: string;
      snippet: string;
      pagemap?: {
        cse_image?: Array<{
          src: string;
        }>;
      };
    }>;
  };
  config: {
    params: {
      start: number;
      num: number;
    };
  };
}

interface SerpResponse {
  totalResults: string;
  searchTerms: string;
  numberOfItems: number;
  startIndex: number;
  documents: GoogleDocument[];
}

try {
  require.resolve(`${process.cwd()}/node_modules/googleapis`);
} catch (e) {
  debugInstance("Package 'googleapis' is not installed");
  process.exit((e as NodeJS.ErrnoException).code);
}

const { google } = require(`${process.cwd()}/node_modules/googleapis`);
const customsearch = google.customsearch('v1');

if (_.isEmpty(global.stareOptions.google.apiKey)) {
  throw new Error(`You must define your Google API KEY as 'google.apiKey' in the StArE.js options to continue.`);
}

if (_.isEmpty(global.stareOptions.google.apiCx)) {
  throw new Error(`You must define your Google API CX as 'google.apiCx' in the StArE.js options to continue.`);
}

/**
 * Make the request to the Google API.
 * 
 * @param {string} query 
 * @param {number} start 
 * @param {number} num Must be between 1 and 10 as per Google API rules.
 */
async function searchWithGoogleApi(query: string, start: number, num: number): Promise<GoogleSearchResponse> {
  /**
   * Documentation for the function customsearch.cse.list() in:
   * https://developers.google.com/custom-search/v1/cse/list
   */
  const opts = {
    cx: global.stareOptions.google.apiCx,
    q: query,
    auth: global.stareOptions.google.apiKey,
    start: start,
    num: num
  };

  return customsearch.cse.list(opts);
}

/**
 * Sort the responses from the Google API,
 * these are pushed to an array based on the 
 * arriving order.
 * @param {GoogleSearchResponse[]} responses 
 */
function sortApiResults(responses: GoogleSearchResponse[]): GoogleDocument[] {
  const finalItems: GoogleDocument[] = [];
  
  const totalItems = responses.reduce((acc, response) => 
    acc + _.get(response, 'config.params.num', 0), 0);
  
  finalItems.length = totalItems;

  responses.forEach(response => {
    const start = _.get(response, 'config.params.start', 1);
    const num = _.get(response, 'config.params.num', 0);
    
    const responseItems = _.get(response, 'data.items', []);
    
    for (let index = 0; index < num; index++) {
      const item = responseItems[index];
      if (!item) continue;

      const image = (((_.get(item, 'pagemap') || {}).cse_image || {})[0] || {}).src;

      finalItems[start + index - 1] = {
        title: _.get(item, 'title', ''),
        link: _.get(item, 'link', ''),
        snippet: _.get(item, 'snippet', ''),
        image: image || undefined
      };
    }
  });

  return finalItems.filter(item => item !== undefined);
}

/**
 * Get the SERP from Google and returns an object with the StArE.js standard format.
 *
 * @async
 * @param {string} query The search query.
 * @param {number} numberOfResults Number of documents to get from the SERP.
 * @returns {Promise<SerpResponse>} Promise object with the standarized StArE.js formatted SERP response from Google.
 */
async function getResultPages(query: string, numberOfResults?: number): Promise<SerpResponse> {
  if (!query || query.length === 0) {
    throw new Error('Query cannot be null.');
  }
  
  const MAX_GOOGLE_API_DOCUMENTS = 100;
  const MAX_PER_REQUEST = 10;
  
  const resultsCount = numberOfResults || global.stareOptions.numberOfResults;
  const finalNumberOfResults = resultsCount > MAX_GOOGLE_API_DOCUMENTS ? MAX_GOOGLE_API_DOCUMENTS : resultsCount;

  const searchRequests: Promise<GoogleSearchResponse>[] = [];
  let start = 1;
  let remainingResults = finalNumberOfResults;
  let page = 1;

  while (remainingResults > 0) {
    const num = remainingResults > MAX_PER_REQUEST ? MAX_PER_REQUEST : remainingResults;
    searchRequests.push(searchWithGoogleApi(query, start, num));
    remainingResults -= num;
    start = (MAX_PER_REQUEST * page) + 1;
    page++;
  }

  try {
    const responses = await Promise.all(searchRequests);
    const items = sortApiResults(responses);

    // All the request will resolve the same headers, so it doesn't
    // matter which one we use.
    const googleResult = _.get(responses[0], 'data');

    const formattedResponse: SerpResponse = {
      totalResults: googleResult.searchInformation.formattedTotalResults,
      searchTerms: googleResult.queries.request[0].searchTerms,
      numberOfItems: items.length,
      startIndex: googleResult.queries.request[0].startIndex,
      documents: items
    };

    return formattedResponse;
  } catch (err) {
    throw err;
  }
}

export default getResultPages;