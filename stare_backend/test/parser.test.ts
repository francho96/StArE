/**
 * Unit tests for the Parser module (lib/parser/index.ts)
 */
import { parseDocuments } from '../lib/parser';
import { SerpResponse, StareDocument } from '../lib/interfaces';

// ─── Test fixtures ─────────────────────────────────────────────────────────────

const docWithHtml: StareDocument = {
    title: 'Test Document',
    link: 'https://example.com',
    htmlCode: '<html><body><p>Hello World</p></body></html>',
    body: '',
};

const docWithBody: StareDocument = {
    title: 'Body Document',
    link: 'https://example.com/body',
    body: 'Already parsed body text',
};

const docWithNullHtml: StareDocument = {
    title: 'Null HTML Document',
    link: 'https://example.com/null',
    htmlCode: null,
    body: '',
};

const docEmpty: StareDocument = {
    title: 'Empty Document',
    link: null,
    body: '',
};

function makeSerpResponse(docs: StareDocument[]): SerpResponse {
    return {
        totalResults: docs.length,
        searchTerms: 'test',
        numberOfItems: docs.length,
        startIndex: 0,
        documents: docs,
    };
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('Parser Module', () => {
    describe('parseDocuments', () => {
        test('parses HTML document and extracts body text', () => {
            const serp = makeSerpResponse([docWithHtml]);
            const result = parseDocuments(serp);

            expect(result.documents).toHaveLength(1);
            expect(result.documents[0]!.body).toBe('Hello World');
        });

        test('preserves existing body text when present', () => {
            const serp = makeSerpResponse([docWithBody]);
            const result = parseDocuments(serp);

            expect(result.documents).toHaveLength(1);
            expect(result.documents[0]!.body).toBe('Already parsed body text');
        });

        test('handles null htmlCode gracefully', () => {
            const serp = makeSerpResponse([docWithNullHtml]);
            const result = parseDocuments(serp);

            expect(result.documents).toHaveLength(1);
            expect(result.documents[0]!.body).toBeDefined();
        });

        test('handles empty documents', () => {
            const serp = makeSerpResponse([docEmpty]);
            const result = parseDocuments(serp);

            expect(result.documents).toHaveLength(1);
            expect(result.documents[0]!.body).toBe('');
        });

        test('handles multiple documents', () => {
            const serp = makeSerpResponse([docWithHtml, docWithBody, docEmpty]);
            const result = parseDocuments(serp);

            expect(result.documents).toHaveLength(3);
            expect(result.documents[0]!.body).toBe('Hello World');
            expect(result.documents[1]!.body).toBe('Already parsed body text');
            expect(result.documents[2]!.body).toBe('');
        });

        test('returns empty documents array when no documents present', () => {
            const serp: SerpResponse = {
                totalResults: 0,
                searchTerms: 'test',
                numberOfItems: 0,
                startIndex: 0,
            };
            const result = parseDocuments(serp);
            expect(result.documents).toEqual([]);
        });

        test('returns empty documents array when documents is null/undefined', () => {
            const serp = {
                totalResults: 0,
                searchTerms: 'test',
                numberOfItems: 0,
                startIndex: 0,
                documents: null,
            } as any;
            const result = parseDocuments(serp);
            expect(result.documents).toEqual([]);
        });

        test('preserves SerpResponse metadata', () => {
            const serp = makeSerpResponse([docWithHtml]);
            serp.totalResults = 42;
            serp.searchTerms = 'preserved query';
            serp.startIndex = 5;

            const result = parseDocuments(serp);

            expect(result.totalResults).toBe(42);
            expect(result.searchTerms).toBe('preserved query');
            expect(result.startIndex).toBe(5);
        });

        test('handles complex HTML with scripts and styles', () => {
            const complexDoc: StareDocument = {
                title: 'Complex',
                link: 'https://example.com',
                htmlCode: '<html><head><style>body{color:red}</style></head><body><script>alert("hi")</script><p>Real Content</p></body></html>',
                body: '',
            };
            const serp = makeSerpResponse([complexDoc]);
            const result = parseDocuments(serp);

            expect(result.documents[0]!.body).toContain('Real Content');
        });
    });
});
