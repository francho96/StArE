/**
 * Unit tests for the Scrapper module (lib/scrapper/index.ts)
 */
import { extractBody, allDocsHtmlCode } from '../lib/scrapper';
import { StareDocument, SerpResponse } from '../lib/interfaces';

// ─── extractBody tests ─────────────────────────────────────────────────────────

describe('Scrapper Module', () => {
  describe('extractBody', () => {
    test('returns body when it is already set', () => {
      const doc: StareDocument = {
        title: 'Test',
        link: 'https://example.com',
        body: 'Existing body text',
        htmlCode: '<html><body><p>Should not use this</p></body></html>',
      };
      expect(extractBody(doc)).toBe('Existing body text');
    });

    test('extracts body from htmlCode when body is empty', () => {
      const doc: StareDocument = {
        title: 'Test',
        link: 'https://example.com',
        body: '',
        htmlCode: '<html><body><p>Extracted text</p></body></html>',
      };
      expect(extractBody(doc)).toBe('Extracted text');
    });

    test('returns empty string when both body and htmlCode are empty', () => {
      const doc: StareDocument = {
        title: 'Test',
        link: 'https://example.com',
        body: '',
        htmlCode: '',
      };
      expect(extractBody(doc)).toBe('');
    });

    test('handles null htmlCode safely', () => {
      const doc: StareDocument = {
        title: 'Test',
        link: 'https://example.com',
        body: '',
        htmlCode: null,
      };
      expect(extractBody(doc)).toBe('');
    });

    test('handles undefined body and htmlCode', () => {
      const doc: StareDocument = {
        title: 'Test',
        link: null,
      };
      expect(extractBody(doc)).toBe('');
    });

    test('extracts trimmed text from HTML body', () => {
      const doc: StareDocument = {
        title: 'Test',
        link: 'https://example.com',
        body: '',
        htmlCode: '<html><body>   \n  Content with whitespace  \n  </body></html>',
      };
      expect(extractBody(doc)).toBe('Content with whitespace');
    });

    test('handles complex HTML with nested elements', () => {
      const doc: StareDocument = {
        title: 'Test',
        link: 'https://example.com',
        body: '',
        htmlCode: '<html><body><div><h1>Title</h1><p>Paragraph one.</p><p>Paragraph two.</p></div></body></html>',
      };
      const result = extractBody(doc);
      expect(result).toContain('Title');
      expect(result).toContain('Paragraph one.');
      expect(result).toContain('Paragraph two.');
    });
  });

  // ─── allDocsHtmlCode tests ────────────────────────────────────────────────────

  describe('allDocsHtmlCode', () => {
    test('returns empty array for invalid documents', async () => {
      const serp: SerpResponse = {
        totalResults: 0,
        searchTerms: 'test',
        numberOfItems: 0,
        startIndex: 0,
      };
      const result = await allDocsHtmlCode(serp);
      expect(result).toEqual([]);
    });

    test('returns empty array for null documents', async () => {
      const serp = {
        totalResults: 0,
        searchTerms: 'test',
        numberOfItems: 0,
        startIndex: 0,
        documents: null,
      } as any;
      const result = await allDocsHtmlCode(serp);
      expect(result).toEqual([]);
    });

    test('handles documents with no link', async () => {
      const serp: SerpResponse = {
        totalResults: 1,
        searchTerms: 'test',
        numberOfItems: 1,
        startIndex: 0,
        documents: [
          { title: 'No Link', link: null, body: 'body text' },
        ],
      };
      const result = await allDocsHtmlCode(serp);
      expect(result).toHaveLength(1);
      expect(result[0]!.title).toBe('No Link');
    });

    test('handles documents with invalid URLs', async () => {
      const serp: SerpResponse = {
        totalResults: 1,
        searchTerms: 'test',
        numberOfItems: 1,
        startIndex: 0,
        documents: [
          { title: 'Invalid URL', link: 'not-a-valid-url', body: '' },
        ],
      };
      const result = await allDocsHtmlCode(serp);
      expect(result).toHaveLength(1);
    });

    test('handles empty documents array', async () => {
      const serp: SerpResponse = {
        totalResults: 0,
        searchTerms: 'test',
        numberOfItems: 0,
        startIndex: 0,
        documents: [],
      };
      const result = await allDocsHtmlCode(serp);
      expect(result).toEqual([]);
    });
  });
});