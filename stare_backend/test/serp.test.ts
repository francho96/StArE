import debug from 'debug';
import _ from 'lodash';

const debugInstance = debug('stare.js:server/test/serp.test.js');

import axios from 'axios';
import ecosia from '../lib/serp/ecosia';
import elasticsearch from '../lib/serp/elasticsearch';
import solr from '../lib/serp/solr';
import { SerpResponse, StareDocument } from '../lib/interfaces';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

function toBeStareDocument(data: SerpResponse): void {
  expect(data).toHaveProperty('totalResults');
  expect(['string', 'number']).toContain(typeof data.totalResults);
  expect(data).toHaveProperty('searchTerms', expect.any(String));
  expect(data).toHaveProperty('numberOfItems', expect.any(Number));
  expect(data).toHaveProperty('startIndex', expect.any(Number));
  expect(data).toHaveProperty('documents', expect.any(Array));

  if (data.documents!.length > 0) {
    expect(data).toHaveProperty(['documents', 0, 'title']);
    expect(data).toHaveProperty(['documents', 0, 'link']);
    expect(data).toHaveProperty(['documents', 0, 'snippet']);
    expect(data).toHaveProperty(['documents', 0, 'image']);
  }
}

/*describe('SERP bing', () => {
  const bing = require('../lib/serp/bing').default;

  test(`Succesfully get 'bing' results for query=jest and numberOfResults=1`, () => {
    return bing('jest', 1).then((data: SerpResponse) => toBeStareDocument(data));
  });

  test(`Failed to get 'bing' results for query=null and numberOfResults=1`, () => {
    return expect(bing(null as any, 1)).rejects.toThrow();
  });

  // test(`No bing.serviceKey set`, () => {
  //   global.stareOptions.bing.serviceKey = null;
  //   return expect(bing('jest', 1)).rejects.toThrow();
  // });
});*/

describe('SERP ecosia', () => {

  beforeEach(() => {
    mockedAxios.get.mockClear();
  });

  test(`Succesfully get 'ecosia' results for query=jest and numberOfResults=1`, () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: `
        <div class="result-count">1 results</div>
        <div class="card-web">
          <div class="result">
             <a class="result-title" href="https://jestjs.io">Jest</a>
             <p class="result-snippet">Delightful JavaScript Testing</p>
          </div>
        </div>
      `
    });
    return ecosia('jest', 1).then((data) => toBeStareDocument(data));
  });

  test(`Failed to get 'ecosia' results for query=null and numberOfResults=1`, () => {
    return expect(ecosia(null as any, 1)).rejects.toThrow();
  });
});

describe('SERP elasticsearch', () => {
  test(`Failed to get 'elasticsearch' results for query=null and numberOfResults=1`, () => {
    return expect(elasticsearch(null as any, 1)).rejects.toThrow();
  });

  test(`No stareOptions.elasticsearch set`, () => {
    const originalConfig = global.stareOptions.elasticsearch;
    global.stareOptions.elasticsearch = null as any;

    const elasticsearchModule = require('../lib/serp/elasticsearch');

    global.stareOptions.elasticsearch = originalConfig;

    expect(elasticsearchModule).toBeDefined();
  });
});

/*describe('SERP google', () => {
  const google = require('../lib/serp/google').default;

  test(`Succesfully get 'google' results for query=jest and numberOfResults=1`, () => {
    return google('jest', 1).then((data: SerpResponse) => toBeStareDocument(data));
  });

  test(`Failed to get 'google' results for query=null and numberOfResults=1`, () => {
    return expect(google(null as any, 1)).rejects.toThrow();
  });

  test(`No google.apiKey set`, () => {
    const originalApiKey = global.stareOptions.google?.apiKey;
    global.stareOptions.google!.apiKey = null;
    
    return expect(google('jest', 1)).rejects.toThrow();
    
    // Restaurar después del test
    global.stareOptions.google!.apiKey = originalApiKey;
  });

  test(`No google.apiCx set`, () => {
    const originalApiCx = global.stareOptions.google?.apiCx;
    global.stareOptions.google!.apiCx = null;
    
    return expect(google('jest', 1)).rejects.toThrow();
    
    // Restaurar después del test
    global.stareOptions.google!.apiCx = originalApiCx;
  });
});*/

describe('SERP solr', () => {
  test(`Failed to get 'solr' results for query=null and numberOfResults=1`, () => {
    return expect(solr(null as any, 1)).rejects.toThrow();
  });

  test(`No stareOptions.solr set`, () => {
    const originalConfig = global.stareOptions.solr;
    global.stareOptions.solr = null as any;

    const solrModule = require('../lib/serp/solr');

    global.stareOptions.solr = originalConfig;

    expect(solrModule).toBeDefined();
  });
});

describe('SERP AWS Search cloud', () => {
  const defaultOptions = { ...global.stareOptions.searchcloud };

  beforeEach(() => {
    jest.resetModules();
  });

  test(`Failed to import 'searchcloud' stareOptions not set`, () => {
    global.stareOptions.searchcloud = null as any;
    expect(() => require('../lib/serp/searchcloud')).toThrow(/options not correctly configurated/);
    global.stareOptions.searchcloud = defaultOptions;
  });

  test(`Succesfully get 'searchcloud' results for query=wolverine and numberOfResults=1`, async () => {
    jest.mock('axios');
    const mockedAxios = require('axios') as jest.Mocked<typeof import('axios').default>;
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        hits: {
          found: 1,
          start: 0,
          hit: [{ id: '1' }]
        }
      }
    });
    global.stareOptions.searchcloud = defaultOptions;
    const searchcloud = require('../lib/serp/searchcloud').default;
    const data = await searchcloud('wolverine', 1);
    toBeStareDocument(data);
  });

  test(`Failed to get 'searchcloud' results for query=null and numberOfResults=1`, () => {
    global.stareOptions.searchcloud = defaultOptions;
    const searchcloud = require('../lib/serp/searchcloud').default;
    return expect(searchcloud(null as any, 1)).rejects.toThrow(/Query cannot be null/);
  });
});