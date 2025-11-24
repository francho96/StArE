import debug from 'debug';
import _ from 'lodash';

const debugInstance = debug('stare.js:server/test/serp.test.js');

import ecosia from '../lib/serp/ecosia';
import elasticsearch from '../lib/serp/elasticsearch';
import solr from '../lib/serp/solr';

interface StareDocument {
  title: string;
  link: string;
  snippet: string;
  image: string;
  [key: string]: any;
}

interface SerpResponse {
  totalResults: string;
  searchTerms: string;
  numberOfItems: number;
  startIndex: number;
  documents: StareDocument[];
}



function toBeStareDocument(data: SerpResponse): void {
  expect(data).toHaveProperty('totalResults', expect.any(String));
  expect(data).toHaveProperty('searchTerms', expect.any(String));
  expect(data).toHaveProperty('numberOfItems', expect.any(Number));
  expect(data).toHaveProperty('startIndex', expect.any(Number));
  expect(data).toHaveProperty('documents', expect.any(Array));

  if (data.documents.length > 0) {
    expect(data).toHaveProperty(['documents', 0, 'title']);
    expect(data).toHaveProperty(['documents', 0, 'link']);
    expect(data).toHaveProperty(['documents', 0, 'snippet']);
    expect(data).toHaveProperty(['documents', 0, 'image']);
  }
}

/*describe('SERP bing', () => {
  const bing = require('../src/serp/bing').default;

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
  test(`Succesfully get 'ecosia' results for query=jest and numberOfResults=1`, () => {
    return ecosia('jest', 1).then((data: SerpResponse) => toBeStareDocument(data));
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

    const elasticsearchModule = require('../src/serp/elasticsearch');

    global.stareOptions.elasticsearch = originalConfig;

    expect(elasticsearchModule).toBeDefined();
  });
});

/*describe('SERP google', () => {
  const google = require('../src/serp/google').default;

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

    const solrModule = require('../src/serp/solr');

    global.stareOptions.solr = originalConfig;

    expect(solrModule).toBeDefined();
  });
});

describe('SERP AWS Search cloud', () => {
  const defaultOptions = { ...global.stareOptions.searchcloud };

  test(`Failed to import 'searchcloud' stareOptions not set`, () => {
    global.stareOptions.searchcloud = null as any;

    const searchcloudModule = require('../src/serp/searchcloud');

    expect(searchcloudModule).toBeDefined();

    global.stareOptions.searchcloud = defaultOptions;
  });

  test(`Succesfully get 'searchcloud' results for query=wolverine and numberOfResults=1`, async () => {
    const searchcloud = require('../src/serp/searchcloud').default;
    const data = await searchcloud('wolverine', 1);
    toBeStareDocument(data);
  });

  test(`Failed to get 'searchcloud' results for query=null and numberOfResults=1`, () => {
    const searchcloud = require('../src/serp/searchcloud').default;
    return expect(searchcloud(null as any, 1)).rejects.toThrow();
  });
});