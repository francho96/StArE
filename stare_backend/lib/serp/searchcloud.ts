import debug from 'debug';
import _ from 'lodash';
import rp from 'request-promise';
import qs from 'qs';

const debugInstance = debug('stare.js:server/serp/searchcloud');

// Interfaces para el tipado
interface SearchCloudDocument {
  title: string;
  link: string | null;
  body: string | null;
  snippet: string;
  image?: any;
}

interface SearchCloudHit {
  [key: string]: any;
}

interface SearchCloudResponse {
  hits: {
    found: number;
    start: number;
    hit: SearchCloudHit[];
  };
}

interface SerpResponse {
  totalResults: number;
  searchTerms: string;
  numberOfItems: number;
  startIndex: number;
  documents: SearchCloudDocument[];
}



try {
  const stareOptions = global.stareOptions;

  if (!_.has(stareOptions, 'searchcloud') ||
      !_.has(stareOptions.searchcloud, 'searchEndpoint') ||
      !_.has(stareOptions.searchcloud, 'apiVersion') ||
      !_.has(stareOptions.searchcloud, 'titleProperty') ||
      !_.has(stareOptions.searchcloud, 'snippetProperty') ||
      !_.has(stareOptions.searchcloud, 'imageProperty')) {
    throw new Error("NO_SEACHCLOUD_OPTIONS");
  }
} catch (e) {
  debugInstance("AWS Search Cloud options not correctly configurated");
  process.exit((e as NodeJS.ErrnoException).code);
}

// Constantes de configuración
const SEARCH_ENDPOINT = global.stareOptions.searchcloud.searchEndpoint;
const API_VERSION = global.stareOptions.searchcloud.apiVersion;
const TITLE_PROPERTY = global.stareOptions.searchcloud.titleProperty;
const BODY_PROPERTY = global.stareOptions.searchcloud.bodyProperty;
const LINK_PROPERTY = global.stareOptions.searchcloud.linkProperty;
const SNIPPET_PROPERTY = global.stareOptions.searchcloud.snippetProperty;
const IMAGE_PROPERTY = global.stareOptions.searchcloud.imageProperty;

interface QueryParams {
  q: string;
  start: number;
  size: number;
}

/**
 * Get the SERP from AWS Search Cloud and returns an object with the StArE.js standard format.
 *
 * The documentation for the search options can be found here:
 * https://docs.aws.amazon.com/cloudsearch/latest/developerguide/search-api.html
 *
 * @async
 * @param {string} query The search query.
 * @param {number} numberOfResults Number of documents to get from the SERP.
 * @returns {Promise<SerpResponse>} Promise object with the standarized StArE.js formatted SERP response from AWS Search Cloud.
 */
async function getResultPages(query: string, numberOfResults?: number): Promise<SerpResponse> {
  if (!query || query.length === 0) {
    throw new Error('Query cannot be null.');
  }

  const queryParams: QueryParams = {
    q: query,
    start: 0,
    size: numberOfResults || global.stareOptions.numberOfResults
  };

  const queryString = qs.stringify(queryParams);
  const searchUrl = `${SEARCH_ENDPOINT}/${API_VERSION}/search?${queryString}`;
  
  debugInstance(`AWS Search Cloud url [${searchUrl}]`);

  try {
    const awsSearchCloudResult: SearchCloudResponse = await rp({
      uri: searchUrl,
      json: true
    });

    const formattedResponse: SerpResponse = {
      totalResults: awsSearchCloudResult.hits.found,
      searchTerms: query,
      numberOfItems: awsSearchCloudResult.hits.hit.length,
      startIndex: awsSearchCloudResult.hits.start + 1,
      documents: []
    };

    // Extract the documents relevant info for Stare.js
    formattedResponse.documents = awsSearchCloudResult.hits.hit.map((item: SearchCloudHit) => ({
      title: _.get(item, TITLE_PROPERTY, ''),
      link: _.get(item, LINK_PROPERTY, null),
      body: _.get(item, BODY_PROPERTY, null),
      snippet: _.get(item, SNIPPET_PROPERTY, ''),
      image: _.get(item, IMAGE_PROPERTY)
    }));

    return formattedResponse;
  } catch (err) {
    throw err;
  }
}

export default getResultPages;