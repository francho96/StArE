/**
 * Test have been written for jest.
 * Docs here: https://jestjs.io/docs/en/getting-started
 */

import 'dotenv/config';
import '../src/config/defaultOptions';

declare global {
  var stareOptions: {
    google: {
      apiKey: string;
      apiCx: string;
    };
    bing: {
      serviceKey: string;
    };
    [key: string]: any;
  };
}

global.stareOptions.google.apiKey = '';
global.stareOptions.google.apiCx = '';
global.stareOptions.bing.serviceKey = '';

import './metrics.test';
import './scrapper.test';
// import './serp.test';