import debug from 'debug';
import path from 'path';
import { allDocsHtmlCode } from '../scrapper';
import _ from 'lodash';
import { SerpResponse } from '../interfaces';
import { MetricModule } from '../interfaces';
import { CalculateOptions } from '../interfaces';

const debugInstance = debug('stare.js:server/metrics/');



/* Sets all the available feature extractors/metrics, stare metrics + personal metrics  */
const availableMetrics: { [key: string]: string } = {
  'language': './language',
  'length': './length',
  'links': './links',
  'multimedia': './multimedia',
  'perspicuity': './perspicuity',
  'ranking': './ranking',
  'keywords-position': './keywords-position'
};

for (const metric in global.stareOptions.personalMetrics) {
  availableMetrics[metric] = path.resolve(process.cwd(), global.stareOptions.personalMetrics[metric]);
}

/**
 * Gets the metrics specified in the 'metrics' array for each document in the serpResponse.
 *
 * @param {SerpResponse} serpResponse JSON formatted response
 * @param {string[]} metrics An array of strings with the names of the desired metrics.
 * @returns {Promise<any[]>} A promise with all the resolved metrics.
 */
async function getMetrics(serpResponse: SerpResponse, metrics: string[]): Promise<any[]> {
  const promises: Promise<any>[] = [];

  if (metrics.length === 0 || _.isEmpty(serpResponse)) {
    return Promise.all(promises);
  }

  // Check if at least one metric requires scraping
  let scrappingRequired = false;

  for (const metric of metrics) {
    const metricPath = availableMetrics[metric];
    if (!metricPath) {
      debugInstance(`Metric '${metric}' not found in available metrics.`);
      continue;
    }

    try {
      const metricModule: MetricModule = await import(metricPath);
      if (metricModule.requiresScrapping) {
        scrappingRequired = true;
        break;
      }
    } catch (error) {
      debugInstance(`Error loading metric '${metric}': ${error}`);
    }
  }

  // Download the HTML code if scraping is required
  let processedSerpResponse = { ...serpResponse };
  if (scrappingRequired) {
    processedSerpResponse.documents = await allDocsHtmlCode(serpResponse);
  }

  // Calculate metrics for each document
  for (let index = 0; index < processedSerpResponse.numberOfItems; index++) {
    const opts: CalculateOptions = {
      searchInfo: {
        totalResults: processedSerpResponse.totalResults,
        searchTerms: processedSerpResponse.searchTerms,
        numberOfItems: processedSerpResponse.numberOfItems,
        startIndex: processedSerpResponse.startIndex
      },
      index: index
    };

    // Define which info each metric will require
    for (const metric of metrics) {
      const metricPath = availableMetrics[metric];
      if (!metricPath) {
        continue;
      }

      try {
        const metricModule: MetricModule = await import(metricPath);
        if (typeof metricModule.calculate === 'function') {
          promises.push(metricModule.calculate(processedSerpResponse.documents[index], opts));
        } else {
          debugInstance(`Metric '${metric}' calculate is not a function.`);
        }
      } catch (error) {
        debugInstance(`Error executing metric '${metric}': ${error}`);
      }
    }
  }

  const response = await Promise.all(promises);

  // Clean up htmlCode if scraping was required
  if (scrappingRequired) {
    for (let i = 0; i < processedSerpResponse.documents.length; i++) {
      delete processedSerpResponse.documents[i].htmlCode;
    }
  }

  return response;
}

export default getMetrics;