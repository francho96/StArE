import debug from 'debug';
import _ from 'lodash';
import rp from 'request-promise';
import qs from 'qs';
import { ElasticsearchHit, ElasticsearchResponse, SerpResponse } from '../interfaces';

const debugInstance = debug('stare.js:server/serp/elasticsearch');



interface ElasticsearchOptions {
  baseUrl: string;
  _index: string;
  _source: string;
  titleProperty: string;
  bodyProperty: string;
  linkProperty: string;
  snippetProperty: string;
  imageProperty: string;
}

try {
  const stareOptions = global.stareOptions;
  if (!_.has(stareOptions, 'elasticsearch') ||
      !_.has(stareOptions.elasticsearch, 'baseUrl') ||
      !_.has(stareOptions.elasticsearch, '_index') ||
      !_.has(stareOptions.elasticsearch, '_source') ||
      !_.has(stareOptions.elasticsearch, 'titleProperty') ||
      !_.has(stareOptions.elasticsearch, 'snippetProperty') ||
      !_.has(stareOptions.elasticsearch, 'imageProperty')) {
    throw new Error("NO_ELASTICSEARCH_OPTIONS");
  }
} catch (e) {
  debugInstance("ElasticSearch options not correctly configurated");
  process.exit((e as NodeJS.ErrnoException).code);
}

const BASE_URL = global.stareOptions.elasticsearch.baseUrl;
const _INDEX = global.stareOptions.elasticsearch._index;
const _SOURCE = global.stareOptions.elasticsearch._source;
const TITLE_PROPERTY = global.stareOptions.elasticsearch.titleProperty;
const BODY_PROPERTY = global.stareOptions.elasticsearch.bodyProperty;
const LINK_PROPERTY = global.stareOptions.elasticsearch.linkProperty;
const SNIPPET_PROPERTY = global.stareOptions.elasticsearch.snippetProperty;
const IMAGE_PROPERTY = global.stareOptions.elasticsearch.imageProperty;

interface QueryParams {
  q: string;
  from: number;
  rest_total_hits_as_int: boolean;
  size: number;
  track_scores: boolean;
  track_total_hits: boolean;
}

/**
 * Get the SERP from ElasticSearch and returns an object with the StArE.js standard format.
 *
 * @async
 * @param {string} query The search query.
 * @param {number} numberOfResults Number of documents to get from the SERP.
 * @returns {Promise<SerpResponse>} Promise object with the standarized StArE.js formatted SERP response from ElasticSearch.
 */
async function getResultPages(query: string, numberOfResults?: number): Promise<SerpResponse> {
  if (!query || query.length === 0) {
    throw new Error('Query cannot be null.');
  }

  const queryParams: QueryParams = {
    q: query,
    from: 0,
    rest_total_hits_as_int: true,
    size: numberOfResults || global.stareOptions.numberOfResults,
    track_scores: true,
    track_total_hits: true
  };

  const queryString = qs.stringify(queryParams);
  const searchUrl = `${BASE_URL}/${_INDEX}/_search?${queryString}`;

  debugInstance(`Elastic Search url [${searchUrl}]`);

  try {
    const elasticResult: ElasticsearchResponse = await rp({
      uri: searchUrl,
      json: true
    });

    const formattedResponse: SerpResponse = {
      totalResults: elasticResult.hits.total,
      searchTerms: query,
      numberOfItems: elasticResult.hits.hits.length,
      startIndex: queryParams.from + 1,
      documents: []
    };

    // Extract the documents relevant info for Stare.js
    formattedResponse.documents = elasticResult.hits.hits.map((item: ElasticsearchHit) => ({
      title: _.get(item[_SOURCE], TITLE_PROPERTY, ''),
      link: _.get(item[_SOURCE], LINK_PROPERTY, null),
      body: _.get(item[_SOURCE], BODY_PROPERTY, null),
      snippet: _.get(item[_SOURCE], SNIPPET_PROPERTY, ''),
      image: _.get(item[_SOURCE], IMAGE_PROPERTY)
    }));

    return formattedResponse;
  } catch (err) {
    throw err;
  }
}

export default getResultPages;