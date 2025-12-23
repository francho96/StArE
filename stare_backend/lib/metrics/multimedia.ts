import { threadId } from 'worker_threads';
import debug from 'debug';
import cheerio from 'cheerio';
import { CalculateOptions, MultimediaCount, StareDocument } from '../interfaces';

const debugInstance = debug(`stare.js:server/metrics/multimedia [Thread #${threadId}]`);
const requiresScrapping = true;

interface MetricResult {
  name: string;
  index: number;
  value: MultimediaCount | number;
}

/**
 * Calculates number of multimedia elements of the document.
 *
 * @async
 * @param {StareDocument} stareDocument  The Document data with stare format
 * @param {CalculateOptions} opts  Optional parameters to calculate the metric
 * @returns {Promise<MetricResult>}
 */
async function calculate(stareDocument: StareDocument, opts: CalculateOptions): Promise<MetricResult> {
  try {
    const $ = cheerio.load(stareDocument.htmlCode);
    const multimedia: MultimediaCount = {
      video: $('video').length,
      img: $('picture, :not(picture)>img').length,
      audio: $('audio').length
    };

    return {
      name: 'multimedia',
      index: opts.index,
      value: multimedia
    };
  } catch (err) {
    debugInstance(err);
    return {
      name: 'multimedia',
      index: opts.index,
      value: -1
    };
  }
}

export { calculate, requiresScrapping };