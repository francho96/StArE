import path from 'path';
import _ from 'lodash';
import debug from 'debug';
import { SerpResponse } from '../interfaces';

const debugInstance = debug('stare.js:server/modules/processor');

const SUPPORTED_ENGINES = [
    'bing',
    'ecosia',
    'elasticsearch',
    'google',
    'solr',
    'searchcloud'
];

interface EngineModule {
    processResponse: (rawResponse: any, query?: string, numberOfResults?: number) => Promise<SerpResponse>;
}

const engines: { [key: string]: EngineModule } = {};

/**
 * Loads the engines based on configuration.
 * (Duplicated logic from scraper, but necessary if we want isolation or we can move this to a shared util)
 */
function loadEngines() {
    // Clear existing engines to reload if options changed
    for (const key in engines) delete engines[key];

    if (global.stareOptions?.engines) {
        for (const engine of global.stareOptions.engines) {
            if (SUPPORTED_ENGINES.includes(engine)) {
                try {
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
 * Process the raw results from the specified engine.
 * @param engine Engine name
 * @param rawResponse Raw response from the engine
 * @param query Original query (needed by some processors like Ecosia/Searchcloud)
 * @param numberOfResults Number of results (needed by some processors)
 */
export async function process(engine: string, rawResponse: any, query: string, numberOfResults: number): Promise<SerpResponse> {
    if (_.isEmpty(engines)) {
        loadEngines();
    }

    const engineModule = engines[engine];
    if (!engineModule) {
        throw new Error(`Engine '${engine}' is not supported or not configured.`);
    }

    if (typeof engineModule.processResponse !== 'function') {
        // Fallback: Check if it has default export and try to behave? 
        // No, we refactored everything to have processResponse.
        throw new Error(`Engine '${engine}' does not implement a 'processResponse' function.`);
    }

    return engineModule.processResponse(rawResponse, query, numberOfResults);
}
