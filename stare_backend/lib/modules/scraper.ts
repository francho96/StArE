import path from 'path';
import _ from 'lodash';
import debug from 'debug';

const debugInstance = debug('stare.js:server/modules/scraper');

const SUPPORTED_ENGINES = [
    'bing',
    'ecosia',
    'elasticsearch',
    'google',
    'solr',
    'searchcloud'
];

interface EngineModule {
    scrape: (query: string, startIndex: number, numberOfResults: number) => Promise<any>;
}

const engines: { [key: string]: EngineModule } = {};

/**
 * Loads the scraping engines based on configuration.
 */
function loadEngines() {
    // Clear existing engines to reload if options changed
    for (const key in engines) delete engines[key];

    if (global.stareOptions?.engines) {
        for (const engine of global.stareOptions.engines) {
            if (SUPPORTED_ENGINES.includes(engine)) {
                try {
                    // Resolve path relative to lib/serp
                    const enginePath = path.resolve(__dirname, `../serp/${engine}`);
                    engines[engine] = require(enginePath);
                } catch (e) {
                    debugInstance(`Failed to load engine ${engine}: ${e}`);
                }
            }
        }
    }

    if (global.stareOptions?.personalSERPs) {
        for (const engine in global.stareOptions.personalSERPs) {
            try {
                const enginePath = path.resolve(process.cwd(), global.stareOptions.personalSERPs[engine]!);
                engines[engine] = require(enginePath);
            } catch (e) {
                debugInstance(`Failed to load personal engine ${engine}: ${e}`);
            }
        }
    }
}

/**
 * Scrape results from the specified engine.
 * @param engine Engine name
 * @param query Search query
 * @param startIndex Start index
 * @param numberOfResults Number of results
 */
export async function scrape(engine: string, query: string, startIndex: number, numberOfResults: number): Promise<any> {
    if (_.isEmpty(engines)) {
        loadEngines();
    }

    const engineModule = engines[engine];
    if (!engineModule) {
        throw new Error(`Engine '${engine}' is not supported or not configured.`);
    }

    if (typeof engineModule.scrape !== 'function') {
        throw new Error(`Engine '${engine}' does not implement a 'scrape' function.`);
    }

    return engineModule.scrape(query, startIndex, numberOfResults);
}
