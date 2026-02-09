import debug from 'debug';
import _ from 'lodash';
import qs from 'qs';
import { SearchCloudHit, SearchCloudResponse, SerpResponse } from '../interfaces';
import axios from 'axios';

const debugInstance = debug('stare.js:server/serp/searchcloud');

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
/**
 * Scrape the AWS Search Cloud results.
 * @param {string} query The search query.
 * @param {number} startIndex Start index (offset).
 * @param {number} numberOfResults Number of results to return.
 * @returns {Promise<SearchCloudResponse>} Raw SearchCloud response.
 */
export async function scrape(query: string, startIndex: number, numberOfResults?: number): Promise<SearchCloudResponse> {
  if (!query || query.length === 0) {
    throw new Error('Query cannot be null.');
  }

  const queryParams: QueryParams = {
    q: query,
    start: startIndex || 0,
    size: numberOfResults || global.stareOptions.numberOfResults
  };

  const queryString = qs.stringify(queryParams);
  const searchUrl = `${SEARCH_ENDPOINT}/${API_VERSION}/search?${queryString}`;

  debugInstance(`AWS Search Cloud url [${searchUrl}]`);

  try {
    const awsSearchCloudResult: SearchCloudResponse = await axios.get(searchUrl);
    return awsSearchCloudResult;
  } catch (err) {
    throw err;
  }
}

/**
 * Process the raw SearchCloud response and return a standard SerpResponse.
 * @param {SearchCloudResponse} awsSearchCloudResult Raw SearchCloud response.
 * @param {string} query The search query.
 * @returns {Promise<SerpResponse>} Standardized SerpResponse.
 */
export async function processResponse(awsSearchCloudResult: SearchCloudResponse, query: string): Promise<SerpResponse> {
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
    link: _.get(item, LINK_PROPERTY as any, null),
    body: _.get(item, BODY_PROPERTY, null),
    snippet: _.get(item, SNIPPET_PROPERTY, ''),
    image: _.get(item, IMAGE_PROPERTY)
  }));

  return formattedResponse;
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
  const awsSearchCloudResult = await scrape(query, 0, numberOfResults);
  return processResponse(awsSearchCloudResult, query);
}

export default getResultPages;