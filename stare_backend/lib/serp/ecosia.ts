import cheerio from 'cheerio';
import rp from 'request-promise';
import _ from 'lodash';

const SEARCH_URL = `https://ecosia.org/search`;

interface EcosiaDocument {
  title: string;
  link: string;
  snippet: string;
  image: string;
}

interface SerpResponse {
  totalResults: number;
  searchTerms: string;
  numberOfItems: number;
  startIndex: number;
  documents: EcosiaDocument[];
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
  if (!query || query.length === 0) {
    throw new Error('Query cannot be null.');
  }

  const pageNumber = Math.ceil(numberOfResults / global.stareOptions.ecosia.resultsPerPage);
  const searchUrl = `${SEARCH_URL}?q=${encodeURIComponent(query)}&p=${pageNumber}`;

  try {
    const html = await rp(searchUrl);
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

    const startIndex = (pageNumber - 1) * global.stareOptions.ecosia.resultsPerPage + 1;

    return {
      totalResults,
      searchTerms: query,
      numberOfItems: documents.length,
      startIndex,
      documents
    };
  } catch (err) {
    throw err;
  }
}

export default getResultPages;