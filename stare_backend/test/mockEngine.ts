/**
 * A mock SERP engine for unit testing.
 * Returns a fake SerpResponse to avoid network requests.
 */
import { SerpResponse, StareDocument } from '../lib/interfaces';

export default function mockEngine(query: string, pageNumber: number): Promise<SerpResponse> {
    return Promise.resolve({
        totalResults: 2,
        searchTerms: query,
        numberOfItems: 2,
        startIndex: pageNumber,
        documents: [
            {
                title: `Mock Result 1 for ${query}`,
                link: 'https://example.com/1',
                snippet: 'Snippet 1',
                body: 'Body 1',
                htmlCode: '<html><body>Mock content 1</body></html>',
            } as StareDocument,
            {
                title: `Mock Result 2 for ${query}`,
                link: 'https://example.com/2',
                snippet: 'Snippet 2',
                body: 'Body 2',
                htmlCode: '<html><body>Mock content 2</body></html>',
            } as StareDocument,
        ],
    });
}
