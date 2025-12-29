import { threadId } from 'worker_threads';
import debug from 'debug';
import * as cheerio from 'cheerio';
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
    if (!stareDocument.htmlCode && !stareDocument.body) {
      debugInstance('No HTML or body available, returning -1');
      return {
        name: 'multimedia',
        index: opts.index,
        value: -1
      };
    }
    
    const htmlContent = stareDocument.htmlCode || stareDocument.body || '';
    
    if (!htmlContent.trim()) {
      debugInstance('Empty HTML/body content');
      return {
        name: 'multimedia',
        index: opts.index,
        value: { video: 0, img: 0, audio: 0 }
      };
    }
    
    const $ = cheerio.load(htmlContent);
    const multimedia: MultimediaCount = {
      video: $('video').length,
      img: $('picture, :not(picture)>img').length,
      audio: $('audio').length
    };
    
    debugInstance('Multimedia counts:', multimedia);
    
    return {
      name: 'multimedia',
      index: opts.index,
      value: multimedia
    };
  } catch (err) {
    debugInstance('Error in multimedia calculation:', err);
    return {
      name: 'multimedia',
      index: opts.index,
      value: -1
    };
  }
}

export { calculate, requiresScrapping };