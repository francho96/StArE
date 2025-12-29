import { GlobalStareOptions } from '../interfaces';
import os from 'os';


declare global {
  var stareOptions: GlobalStareOptions;
}

global.stareOptions = {
  /* required SERP, each must fulfill a condition to be properly used */
  engines: [],
  /* Metrics modules/function created by the user */
  personalMetrics: {},
  /* SERPs modules/function created by the user */
  personalSERPs: {},
  /* Default number of results to get from the SERP */
  numberOfResults: 10,
  /* Default timeout for downloading the HTML code of the documents */
  requestTimeout: 5000,
  /* Whether to use multi-core processing while requesting documents and calculating their metrics */
  enableMultiCore: true,
  /* Number of worker threads to spawn if 'enableMultiCore' is set to true */
  workerThreads: os.cpus().length,
  /* Custom web scraper module path */
  customScraper: null,
  customScraperOpts: null,
  /* Google API */
  google: {
    apiKey: 'AIzaSyCmGpofWrPxQT-KrJnoArXaas0zOADXikA',
    apiCx: '010212477578150644501:wtqrloafnss'
  },
  /* Bing API */
  bing: {
    serviceKey: ''
  },
  /* Ecosia */
  ecosia: {
    resultsPerPage: 10
  },
  /* ElasticSearch config */
  elasticsearch: {
    baseUrl: 'http://localhost:9200',
    _index: '_all',
    _source: '_source',
    titleProperty: 'title',
    bodyProperty: 'body',
    snippetProperty: 'snippet',
    imageProperty: 'image'
  },
  /* Solr config */
  solr: {
    baseUrl: 'http://localhost:8983',
    core: '',
    titleProperty: 'title',
    bodyProperty: 'body',
    snippetProperty: 'snippet',
    imageProperty: 'image'
  },
  searchcloud: {
    searchEndpoint: 'http://search-movies-y6gelr4lv3jeu4rvoelunxsl2e.us-east-1.cloudsearch.amazonaws.com/',
    apiVersion: '2013-01-01',
    titleProperty: 'fields.title',
    bodyProperty: 'fields.plot',
    snippetProperty: 'fields.plot',
    imageProperty: 'fields.image_url'
  }
};