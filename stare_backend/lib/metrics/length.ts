import { extractBody } from "../scrapper";
import { threadId } from 'worker_threads';
import debug from 'debug';

const debugInstance = debug(`stare.js:server/metrics/length [Thread #${threadId}]`);
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

interface MetricResult {
  name: string;
  index: number;
  value: number;
}

/**
 * Calculates the length (number of chars) of the document.
 *
 * @async
 * @param {StareDocument} stareDocument  The Document data with stare format
 * @param {CalculateOptions} opts  Optional parameters to calculate the metric
 * @returns {Promise<MetricResult>}
 */
async function calculate(stareDocument: StareDocument, opts: CalculateOptions): Promise<MetricResult> {
  try {
    const text = extractBody(stareDocument);
    return {
      name: 'length',
      index: opts.index,
      value: text.length + 1
    };
  } catch (err) {
    debugInstance(err);
    return {
      name: 'length',
      index: opts.index,
      value: -1
    };
  }
}

export { calculate, requiresScrapping };