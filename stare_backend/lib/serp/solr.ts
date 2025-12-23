import { threadId } from 'worker_threads';
import debug from 'debug';
import _ from 'lodash';
import axios from 'axios';
import qs from 'qs';
import { SerpResponse, SolrResponse, SolrResponseDoc } from '../interfaces';

const debugInstance = debug(`stare.js:server/serp/solr [Thread #${threadId}]`);


interface SolrOptions {
  baseUrl: string;
  core: string;
  titleProperty: string;
  bodyProperty: string;
  linkProperty: string;
  snippetProperty: string;
  imageProperty: string;
}

try {
  const stareOptions = global.stareOptions;
  if (!_.has(stareOptions, 'solr') ||
      !_.has(stareOptions.solr, 'baseUrl') ||
      !_.has(stareOptions.solr, 'core') ||
      !_.has(stareOptions.solr, 'titleProperty') ||
      !_.has(stareOptions.solr, 'snippetProperty') ||
      !_.has(stareOptions.solr, 'imageProperty')) {
    throw new Error("NO_SOLR_OPTIONS");
  }
} catch (e) {
  debugInstance("Solr options not correctly configurated");
  process.exit((e as NodeJS.ErrnoException).code);
}

const BASE_URL = global.stareOptions.solr.baseUrl;
const CORE_OR_COLLECTION = global.stareOptions.solr.core;
const TITLE_PROPERTY = global.stareOptions.solr.titleProperty;
const BODY_PROPERTY = global.stareOptions.solr.bodyProperty;
const LINK_PROPERTY = global.stareOptions.solr.linkProperty;
const SNIPPET_PROPERTY = global.stareOptions.solr.snippetProperty;
const IMAGE_PROPERTY = global.stareOptions.solr.imageProperty;

interface QueryParams {
  q: string;
  start: number;
  rows: number;
  wt: string;
}

/**
 * Get the SERP from Solr and returns an object with the StArE.js standard format.
 *
 * @async
 * @param {string} query The search query.
 * @param {number} startIndex Number of leading documents to skip.
 * @param {number} numberOfResults Number of documents to get from the SERP.
 * @returns {Promise<SerpResponse>} Promise object with the standarized StArE.js formatted SERP response from Solr.
 */
async function getResultPages(query: string, startIndex: number, numberOfResults?: number): Promise<SerpResponse> {
  if (!query || query.length === 0) {
    throw new Error('Query cannot be null.');
  }

  const queryParams: QueryParams = {
    q: query,
    start: startIndex,
    rows: numberOfResults || global.stareOptions.numberOfResults,
    wt: 'json',
    // sort: 'field ASC',
    // fl:
  };

  const queryString = qs.stringify(queryParams);
  const searchUrl = `${BASE_URL}/solr/${CORE_OR_COLLECTION}/select?${queryString}`;

  debugInstance(`Solr Search url [${searchUrl}]`);

  try {
    const response: SolrResponse = await axios.get(searchUrl);

    const formattedResponse: SerpResponse = {
      totalResults: response.data.response.numFound,
      searchTerms: response.data.responseHeader.params.q,
      numberOfItems: response.data.response.docs.length,
      startIndex: response.data.response.start,
      documents: []
    };

    // Extract the documents relevant info for Stare.js
    formattedResponse.documents = response.data.response.docs.map((item: SolrResponseDoc) => ({
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