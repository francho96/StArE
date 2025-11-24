/**
 * Responses must have the following format
 *
 * {
 *   resultados: string,
 *   terminos: string,
 *   items: integer,
 *   start: integer,
 *   documents: array,
 *     [{
 *       title: string,
 *       link: string,
 *       snippet: string,
 *       image: string
 *     }]
 * }
 */

interface SerpResponse {
  resultados: string;
  terminos: string;
  items: number;
  start: number;
  documents: Array<{
    title: string;
    link: string;
    snippet: string;
    image: string;
  }>;
}

import bing from './bing';
import ecosia from './ecosia';
import google from './google';
import elasticsearch from './elasticsearch';
import searchcloud from './searchcloud';

export {
  bing,
  ecosia,
  google,
  elasticsearch,
  searchcloud
};

export default {
  bing,
  ecosia,
  google,
  elasticsearch,
  searchcloud
};

export type { SerpResponse };