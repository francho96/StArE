const requiresScrapping = false;

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
 * Calculates the ranking stare-format document based
 *
 * @async
 * @param {StareDocument} stareDocument  The Document data with stare format
 * @param {CalculateOptions} opts  Optional parameters to calculate the metric
 * @returns {Promise<MetricResult>}
 */
async function calculate(stareDocument: StareDocument, opts: CalculateOptions): Promise<MetricResult> {
  return {
    name: 'ranking',
    index: opts.index,
    value: opts.searchInfo.startIndex + opts.index
  };
}

export { calculate, requiresScrapping };