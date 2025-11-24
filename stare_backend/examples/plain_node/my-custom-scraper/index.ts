import { threadId } from 'worker_threads';
import debug from 'debug';
import axios from 'axios';
import _ from 'lodash';
import qs from 'qs';

const debugInstance = debug(`custom_scraper [Thread #${threadId}]`);

interface StareDocument {
  link: string;
  [key: string]: any;
}

interface SolrResponseDoc {
  htmlCode: string;
  [key: string]: any;
}

interface SolrResponse {
  data: {
    response: {
      numFound: number;
      docs: SolrResponseDoc[];
    };
  };
}

interface ScrapeOptions {
  core: string;
}


/**
 * Downloads the HTML code of a Stare Document from a SOLR collection.
 *
 * @async
 * @param {StareDocument} stareDocument SERP Document to download.
 * @param {ScrapeOptions} opts
 * @param {string} opts.core Solr core containing the HTML Code of the documents.
 * @returns {Promise<string>} Promise object with the html code
 */
async function customScrape(stareDocument: StareDocument, opts: ScrapeOptions): Promise<string> {
  const docLink = _.get(stareDocument, 'link');
  const query = `link:\"${docLink}\"`;
  const auxCore = opts.core;

  const queryParams = {
    q: query,
    wt: 'json',
    rows: 1
  };

  const queryString = qs.stringify(queryParams);
  const url = `${global.stareOptions.solr.baseUrl}/solr/${auxCore}/select?${queryString}`;
  
  debugInstance(`Scraping from SOLR [${url}]`);
  
  try {
    const response: SolrResponse = await axios.get(url);
    
    if (response.data.response.numFound >= 1) {
      return response.data.response.docs[0].htmlCode;
    } else {
      return '';
    }
  } catch (error) {
    debugInstance(`Error scraping from SOLR: ${error}`);
    return '';
  }
}

export default customScrape;