import LanguageDetect from 'languagedetect';
import _ from 'lodash';
import { threadId } from 'worker_threads';
import debug from 'debug';
import { CalculateOptions, MetricResult, StareDocument } from '../interfaces';

const lngDetector = new LanguageDetect();
const debugInstance = debug(`stare.js:server/metrics/language [Thread #${threadId}]`);
const requiresScrapping = false;


/**
 * Defines the language of the stare-format document based
 * on the snippet or body.
 *
 * @async
 * @param {StareDocument} stareDocument  The Document data with stare format
 * @param {CalculateOptions} opts  Optional parameters to calculate the metric
 * @returns {Promise<MetricResult>}
 */
async function calculate(stareDocument: StareDocument, opts: CalculateOptions): Promise<MetricResult> {
  try {
    let language: string | null = null;
    let probabilities: [string, number][] = [];

    // Check body first, then snippet as fallback
    if (_.has(stareDocument, 'body') && stareDocument.body !== null && stareDocument.body.length > 0) {
      probabilities = lngDetector.detect(stareDocument.body, 1);
      language = probabilities.length > 0 ? probabilities[0][0] : null;
    } else if (_.has(stareDocument, 'snippet') && stareDocument.snippet !== null && stareDocument.snippet.length > 0) {
      probabilities = lngDetector.detect(stareDocument.snippet, 1);
      language = probabilities.length > 0 ? probabilities[0][0] : null;
    }

    return {
      name: 'language',
      index: opts.index,
      value: language
    };
  } catch (error) {
    debugInstance(error);
    return {
      name: 'language',
      index: opts.index,
      value: "Error"
    };
  }
}

export { calculate, requiresScrapping };