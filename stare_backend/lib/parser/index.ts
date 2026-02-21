import { extractBody } from '../scrapper';
import { SerpResponse, ParsedSerpResponse, StareDocument } from '../interfaces';
import debug from 'debug';
import { threadId } from 'worker_threads';

const debugInstance = debug(`stare.js:server/parser [Thread #${threadId}]`);

/**
 * Parsea todos los documentos de un SerpResponse, extrayendo el body desde htmlCode.
 * Si el documento ya tiene body, lo preserva. Si tiene htmlCode, extrae el texto del body.
 *
 * @param {SerpResponse} serpResponse - Respuesta SERP con documentos (idealmente ya scrapeados).
 * @returns {ParsedSerpResponse} - Respuesta con documentos que tienen body extraído.
 */
function parseDocuments(serpResponse: SerpResponse): ParsedSerpResponse {
    if (!serpResponse?.documents || !Array.isArray(serpResponse.documents)) {
        debugInstance('No documents to parse');
        return { ...serpResponse, documents: [] } as ParsedSerpResponse;
    }

    const documents = serpResponse.documents.map((doc) => {
        try {
            const body = extractBody(doc as StareDocument);
            return {
                ...doc,
                body: body || (doc as StareDocument).body || '',
            } as StareDocument;
        } catch (e) {
            debugInstance(`Error parsing document ${(doc as any)?.title || 'unknown'}: ${e}`);
            return {
                ...doc,
                body: (doc as StareDocument).body || '',
            } as StareDocument;
        }
    });

    debugInstance(`Parsed ${documents.length} documents`);

    return {
        ...serpResponse,
        documents,
    } as ParsedSerpResponse;
}

export { parseDocuments, extractBody };
export default parseDocuments;
