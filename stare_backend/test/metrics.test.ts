/**
 * Unit tests for the Metrics module (lib/metrics/index.ts)
 */
import getMetrics from '../lib/metrics';
import { SerpResponse, StareDocument } from '../lib/interfaces';

// ─── Test fixtures ─────────────────────────────────────────────────────────────

const validDoc: StareDocument = {
  title: 'StArE.js — Search engine visuAlization packagE - Usach',
  link: 'https://starejs.informatica.usach.cl/',
  body: 'StArE.js is an extensible open source toolkit for visualizing search engine results.',
  htmlCode: '',
  snippet: 'StArE.js: An extensible open source toolkit for visualizing search engine results.',
};

const emptyDoc: StareDocument = {
  title: 'Empty',
  link: null,
  body: null,
  htmlCode: '',
  snippet: null,
};

function makeSerpResponse(docs: StareDocument[]): SerpResponse {
  return {
    totalResults: docs.length,
    searchTerms: 'test query',
    numberOfItems: docs.length,
    startIndex: 0,
    documents: docs,
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('Metrics Module', () => {
  describe('getMetrics', () => {
    test('returns empty array for empty metrics list', async () => {
      const serp = makeSerpResponse([validDoc]);
      const result = await getMetrics(serp, []);
      expect(result).toEqual([]);
    });

    test('returns empty array for empty serpResponse', async () => {
      const result = await getMetrics({} as SerpResponse, ['ranking']);
      expect(result).toEqual([]);
    });

    test('calculates ranking metric', async () => {
      const serp = makeSerpResponse([validDoc]);
      const result = await getMetrics(serp, ['ranking']);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'ranking',
        index: 0,
        value: expect.any(Number),
      });
    });

    test('calculates length metric', async () => {
      const serp = makeSerpResponse([validDoc]);
      const result = await getMetrics(serp, ['length']);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'length',
        index: 0,
        value: expect.any(Number),
      });
    });

    test('calculates language metric', async () => {
      const serp = makeSerpResponse([validDoc]);
      const result = await getMetrics(serp, ['language']);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'language',
        index: 0,
      });
    });

    test('handles multiple metrics', async () => {
      const serp = makeSerpResponse([validDoc]);
      const result = await getMetrics(serp, ['ranking', 'length', 'language', 'keywords-position', 'links', 'multimedia', 'perspicuity']);
      expect(result).toHaveLength(7);

      const metricNames = result.map((r: any) => r.name);
      expect(metricNames).toContain('ranking');
      expect(metricNames).toContain('length');
      expect(metricNames).toContain('language');
      expect(metricNames).toContain('keywords-position');
      expect(metricNames).toContain('links');
      expect(metricNames).toContain('multimedia');
      expect(metricNames).toContain('perspicuity');
    });

    test('calculates metrics for multiple documents', async () => {
      const serp = makeSerpResponse([validDoc, emptyDoc]);
      const result = await getMetrics(serp, ['ranking']);
      expect(result).toHaveLength(2);
    });

    test('skips non-existent metrics gracefully', async () => {
      const serp = makeSerpResponse([validDoc]);
      const result = await getMetrics(serp, ['nonExistentMetric']);
      expect(result).toEqual([]);
    });

    test('handles mixed valid and invalid metric names', async () => {
      const serp = makeSerpResponse([validDoc]);
      const result = await getMetrics(serp, ['ranking', 'fakeMetric', 'length']);
      expect(result).toHaveLength(2);
    });

    test('respects skipScraping flag', async () => {
      const serp = makeSerpResponse([validDoc]);
      // With skipScraping=true, should still calculate non-scraping metrics
      const result = await getMetrics(serp, ['ranking'], true);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('ranking');
    });

    test('calculates keywords-position metric', async () => {
      const docWithBody: StareDocument = {
        ...validDoc,
        body: 'The test query appears in this text. Test query is mentioned twice.',
      };
      const serp = makeSerpResponse([docWithBody]);
      serp.searchTerms = 'test';
      const result = await getMetrics(serp, ['keywords-position']);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('keywords-position');
    });

    test('handles length metric with empty document', async () => {
      const serp = makeSerpResponse([emptyDoc]);
      const result = await getMetrics(serp, ['length']);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'length',
        index: 0,
        value: -1,
      });
    });
  });
});