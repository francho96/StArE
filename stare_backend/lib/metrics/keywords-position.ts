import { threadId } from 'worker_threads';
import debug from 'debug';
import { extractBody } from "../scrapper";

const debugInstance = debug(`stare.js:server/metrics/keywords-position [Thread #${threadId}]`);
const requiresScrapping = true;

interface StareDocument {
  title: string;
  link: string;
  body: string | null;
  htmlCode: string;
  snippet: string | null;
  image: string | null;
}

interface SearchInfo {
  totalResults: string;
  searchTerms: string;
  numberOfItems: number;
  startIndex: number;
}

interface CalculateOptions {
  searchInfo: SearchInfo;
  index: number;
}

interface KeywordPositions {
  documentLength: number;
  keywords: {
    [key: string]: number[];
  };
}

interface MetricResult {
  name: string;
  index: number;
  value: KeywordPositions | number;
}

/**
 * Calculates positions of keywords in the document text.
 *
 * @async
 * @param {StareDocument} stareDocument  The Document data with stare format
 * @param {CalculateOptions} opts  Optional parameters to calculate the metric
 * @returns {Promise<MetricResult>}
 */
async function calculate(stareDocument: StareDocument, opts: CalculateOptions): Promise<MetricResult> {
  try {
    let text = extractBody(stareDocument);
    // Remove original line breaks
    text = text.replace(/[^\S ]+/g, '').toLowerCase();
    const keywords = opts.searchInfo.searchTerms.split(' ');

    const positions: KeywordPositions = {
      documentLength: text.length,
      keywords: {}
    };

    keywords.forEach(keyword => {
      positions.keywords[keyword] = [];
      let indexPosition = 0;

      while (indexPosition !== -1 && indexPosition < text.length) {
        indexPosition = text.indexOf(keyword.toLowerCase(), indexPosition);
        if (indexPosition === -1) {
          break;
        }
        positions.keywords[keyword].push(indexPosition);
        indexPosition++;
      }
    });

    return {
      name: 'keywords-position',
      index: opts.index,
      value: positions
    };
  } catch (err) {
    debugInstance(err);
    return {
      name: 'keywords-position',
      index: opts.index,
      value: -1
    };
  }
}

export { calculate, requiresScrapping };