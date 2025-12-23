import { CalculateOptions, MetricResult, StareDocument } from "../interfaces";

const requiresScrapping = false;

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