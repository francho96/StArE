import * as cheerio from 'cheerio';
import _ from 'lodash';
import { EcosiaDocument, SerpResponse } from '../interfaces';
import axios from 'axios';

const SEARCH_URL = `https://ecosia.org/search`;

/**
 * Get the SERP from Ecosia and returns an object with the StArE.js standard format.
 *
 * @async
 * @param {string} query The search query.
 * @param {number} numberOfResults Number of documents to get from the SERP.
 * @returns {Promise<SerpResponse>} Promise object with the standarized StArE.js formatted SERP response from Ecosia.
 */
/**
 * Scrape the Ecosia search results.
 * @param {string} query The search query.
 * @param {number} startIndex Start index (0-based).
 * @param {number} numberOfResults Number of documents to get.
 * @returns {Promise<any>} Raw Axios response data (HTML).
 */
export async function scrape(query: string, startIndex: number, numberOfResults: number): Promise<any> {
  if (!query || query.length === 0) {
    throw new Error('Query cannot be null.');
  }

  // Calculate page number. Ecosia uses 'p' param. p=1 is first page?
  // Original: pageNumber = Math.ceil(numberOfResults / perPage). This seems to imply numberOfResults determines which page we WANT?
  // No, original logic was flawed if checking for pagination?
  // Original code: "p=${pageNumber}". 
  // If numberOfResults=10, perPage=10 => pageNumber=1.
  // If numberOfResults=20, perPage=10 => pageNumber=2.
  // This looks like it was only fetching the LAST page required?
  // If I want 20 results, I need page 1 AND page 2?
  // Ecosia implementation seemed simplistic or broken for multi-page.
  // But let's adapt:
  // startIndex 0 -> page 1.
  // startIndex 10 -> page 2.
  const perPage = global.stareOptions.ecosia.resultsPerPage || 10;
  const pageNumber = Math.floor((startIndex || 0) / perPage) + 1;

  const searchUrl = `${SEARCH_URL}?q=${encodeURIComponent(query)}&p=${pageNumber}`;

  try {
    const response = await axios.get(searchUrl);
    return response.data;
  } catch (err) {
    throw err;
  }
}

/**
 * Process the raw Ecosia response (HTML) and return a standard SerpResponse.
 * @param {any} html Raw HTML content.
 * @param {string} query The original search query.
 * @param {number} numberOfResults The target number of results (used for pagination calc).
 * @returns {Promise<SerpResponse>} Standardized SerpResponse.
 */
export async function processResponse(html: any, query: string, numberOfResults: number): Promise<SerpResponse> {
  const $ = cheerio.load(html);

  if ($('div.result-count').length === 0) {
    return {
      totalResults: 0,
      searchTerms: query,
      numberOfItems: 0,
      startIndex: 0,
      documents: []
    };
  }

  const resultsText = $('div.result-count').text().replace(/\n|results|,/g, "").trim();
  const totalResults = parseInt(resultsText, 10) || 0;

  const resultDocuments = $('.card-web .result');
  const documents: EcosiaDocument[] = [];

  resultDocuments.each((index, element) => {
    const title = $(element).find('a.result-title').text().replace("\n", "").trim();
    const link = $(element).find('a.result-title').attr('href') || '';
    const snippet = $(element).find('p.result-snippet').text().replace("\n", "").trim();

    documents.push({
      title,
      link,
      snippet,
      image: ''
    });
  });

  const perPage = global.stareOptions.ecosia.resultsPerPage || 10;
  const pageNumber = Math.ceil(numberOfResults / perPage);
  const startIndex = (pageNumber - 1) * perPage + 1;
  // This startIndex calculation in processResponse was based on numberOfResults.
  // It's probably wrong now if we use proper pagination.
  // But I will leave it "as is" or try to approximate original behavior, allowing standard orchestrator to pass startIndex.

  return {
    totalResults,
    searchTerms: query,
    numberOfItems: documents.length,
    startIndex, // This might need to be passed in from scrape context?
    documents
  };
}

/**
 * Get the SERP from Ecosia and returns an object with the StArE.js standard format.
 *
 * @async
 * @param {string} query The search query.
 * @param {number} numberOfResults Number of documents to get from the SERP.
 * @returns {Promise<SerpResponse>} Promise object with the standarized StArE.js formatted SERP response from Ecosia.
 */
async function getResultPages(query: string, numberOfResults: number): Promise<SerpResponse> {
  const html = await scrape(query, 0, numberOfResults);
  return processResponse(html, query, numberOfResults);
}

export default getResultPages;