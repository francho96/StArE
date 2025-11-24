import { threadId } from 'worker_threads';
import debug from 'debug';
import cheerio from 'cheerio';
import url from 'url';
import psl from 'psl';
import _ from 'lodash';

const debugInstance = debug(`stare.js:server/metrics/links [Thread #${threadId}]`);
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
  value: string[] | number;
}

interface PslResult {
  domain?: string;
  [key: string]: any;
}

interface TagMapping {
  [key: string]: string;
}

const TAG_MAPPING: TagMapping = {
  'a': 'href',
  'img': 'src', // TODO: support for srcset
  'video': 'src',
  'audio': 'src',
  'iframe': 'src',
  'source': 'src'
};

/**
 * Extracts hostname from URL source
 */
function getHostname(source: string | null | undefined): string | null {
  try {
    if (_.isEmpty(source) || source === '#') {
      return null;
    }

    const urlParsed = url.parse(source || '');
    const hostname = _.get(urlParsed, 'hostname');
    const pslParsed: PslResult = psl.parse(hostname || '');
    return _.get(pslParsed, 'domain', null);
  } catch (err) {
    return null;
  }
}

/**
 * Extracts links and hostnames from multimedia elements in the document.
 *
 * @async
 * @param {StareDocument} stareDocument  The Document data with stare format
 * @param {CalculateOptions} opts  Optional parameters to calculate the metric
 * @returns {Promise<MetricResult>}
 */
async function calculate(stareDocument: StareDocument, opts: CalculateOptions): Promise<MetricResult> {
  try {
    const $ = cheerio.load(stareDocument.htmlCode);
    const anchors: string[] = [];
    let hostname: string | null = '';
    let tag: string;
    let source: string | undefined;
    let attrs: any;

    // Add the main document hostname
    const documentHostname = getHostname(_.get(stareDocument, 'link', ''));
    if (documentHostname) {
      anchors.push(documentHostname);
    }

    $('a, img, video, audio, iframe, source').each((i, el) => {
      tag = _.get(el, 'name', '');
      source = _.get(el, ['attribs', TAG_MAPPING[tag]]);
      hostname = getHostname(source);

      if (!_.isEmpty(hostname) && anchors.indexOf(hostname) === -1) {
        anchors.push(hostname);
      }
    });

    return {
      name: 'links',
      index: opts.index,
      value: anchors
    };
  } catch (err) {
    debugInstance(err);
    return {
      name: 'links',
      index: opts.index,
      value: -1
    };
  }
}

export { calculate, requiresScrapping };