
import 'dotenv/config';
import '../lib/config/defaultOptions'; // Ensure options are loaded

// Mock global options to include a supported engine
global.stareOptions.engines = ['google'];
global.stareOptions.google = { apiKey: 'mock', apiCx: 'mock' };

import stare from '../lib/index';
import * as scraper from '../lib/modules/scraper';
import * as processor from '../lib/modules/processor';
import * as metricsModule from '../lib/modules/metrics';

// Mock the modules
jest.mock('../lib/modules/scraper', () => ({
    scrape: jest.fn()
}));
jest.mock('../lib/modules/processor', () => ({
    process: jest.fn()
}));
jest.mock('../lib/modules/metrics', () => ({
    calculate: jest.fn()
}));

describe('StArE Refactor Verification', () => {
    it('should orchestrate scraping, processing, and metrics', async () => {
        // Setup mocks
        const mockRawResult = { kind: 'customsearch#search' };
        (scraper.scrape as jest.Mock).mockResolvedValue(mockRawResult);

        const mockProcessedResult = {
            totalResults: '100',
            searchTerms: 'test',
            numberOfItems: 1,
            startIndex: 1,
            documents: [{ title: 'Test Doc', link: 'http://test.com', snippet: 'Test snippet' }]
        };
        (processor.process as jest.Mock).mockResolvedValue(mockProcessedResult);

        const mockFinalResult = {
            ...mockProcessedResult,
            documents: [{
                ...mockProcessedResult.documents[0],
                metrics: { ranking: 1 }
            }]
        };
        (metricsModule.calculate as jest.Mock).mockResolvedValue(mockFinalResult);

        // Call stare
        const result = await stare()('google', 'test', 1, 10, ['ranking']);

        // Verify calls
        expect(scraper.scrape).toHaveBeenCalledWith('google', 'test', 1, 10);
        expect(processor.process).toHaveBeenCalledWith('google', mockRawResult, 'test', 10);
        expect(metricsModule.calculate).toHaveBeenCalledWith(mockProcessedResult, ['ranking']);

        // Verify result
        expect(result).toEqual(mockFinalResult);
    });
});
