import axios from 'axios';
import cheerio from 'cheerio';
import validUrl from 'valid-url';
import _ from 'lodash';
import { threadId } from 'worker_threads';
import debug from 'debug';
import path from 'path';

const debugInstance = debug(`stare.js:server/scrapper [Thread #${threadId}]`);

interface StareDocument {
  link: string | null;
  body: string | null;
  title?: string;
  snippet?: string;
  image?: string;
  htmlCode?: string;
}

interface SerpResponse {
  totalResults: string;
  searchTerms: string;
  numberOfItems: number;
  documents: StareDocument[];
}

interface ScrapeOptions {
  [key: string]: any;
}

/**
 * Downloads the HTML code of a Stare Document.
 *
 * @async
 * @param {StareDocument} stareDocument Document to scrape.
 * @param {ScrapeOptions} opts Optional configurations. Defined just to extend this functionality
 *                      with a custom scraper.
 * @returns {Promise<string>} Promise object with the HTML code.
 */
async function defaultScrape(stareDocument: StareDocument, opts: ScrapeOptions = {}): Promise<string> {
  if (_.has(stareDocument, 'link') && validUrl.isUri(stareDocument.link)) {
    const url = _.get(stareDocument, 'link');
    debugInstance("Scraping from the web [%s]", url);

    try {
      const response = await axios.get(url, { timeout: global.stareOptions.requestTimeout });
      const htmlCode = response.data.toString();
      return htmlCode;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : String(err));
    }
  }

  return _.get(stareDocument, 'body', '');
}

/**
 * Gets the body of a Stare Document.
 *
 * @async
 * @param {StareDocument} stareDocument Document to get its body.
 * @returns {string} The body text of the document.
 */
function extractBody(stareDocument: StareDocument): string {
  const body = _.get(stareDocument, "body", "");
  if (body !== "") {
    return stareDocument.body as string;
  }

  const htmlCode = _.get(stareDocument, "htmlCode", "");
  if (htmlCode !== "") {
    const $ = cheerio.load(stareDocument.htmlCode as string);
    // TODO: Remove <script> & <style> tags in between?
    return $('body').text().trim();
  }

  return "";
}

/**
 * Scrapes htmlCode of all the documents of a SERP Response.
 *
 * @param {SerpResponse} serpResponse SERP Response with documents.
 * @returns {Promise<StareDocument[]>} Promise with documents including htmlCode.
 */
async function allDocsHtmlCode(serpResponse: SerpResponse): Promise<StareDocument[]> {
  const dlPromises: Promise<StareDocument>[] = [];

  let getHtml: (doc: StareDocument, opts: ScrapeOptions) => Promise<string> = defaultScrape;
  let opts: ScrapeOptions = {};

  if (global.stareOptions.customScraper !== null) {
    const customScraperPath = path.resolve(process.cwd(), global.stareOptions.customScraper);

    const customScraperModule = await import(customScraperPath);
    getHtml = customScraperModule.default || customScraperModule;

    opts = global.stareOptions.customScraperOpts;
    debugInstance("Using custom scrapper: %s with Opts %O", customScraperPath, opts);
  }

  const downloadDoc = async (doc: StareDocument): Promise<StareDocument> => {
    try {
      const htmlCode = await getHtml(doc, opts);
      return { ...doc, htmlCode };
    } catch (e) {
      debugInstance(`Error while scrapping doc ${doc.title}: ${e}`);
      return doc;
    }
  };

  for (const doc of serpResponse.documents) {
    dlPromises.push(downloadDoc(doc));
  }

  return await Promise.all(dlPromises);
}

export { extractBody, allDocsHtmlCode };
export type { StareDocument, SerpResponse, ScrapeOptions };