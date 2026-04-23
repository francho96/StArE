/**
 * Unit tests for the core StArE module (lib/index.ts)
 */
import stare from '../lib/index';
import { StareInstance, SerpResponse, StareDocument } from '../lib/interfaces';

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('StArE Core Module', () => {
    describe('stare() initialization', () => {
        test('returns null when no engines are configured', () => {
            const result = stare({ engines: [] });
            expect(result).toBeNull();
        });

        test('returns null with default options (no engines)', () => {
            const originalEngines = global.stareOptions.engines;
            global.stareOptions.engines = [];
            const result = stare();
            expect(result).toBeNull();
            global.stareOptions.engines = originalEngines;
        });

        test('returns a StareInstance when valid engine is configured', () => {
            const instance = stare({
                engines: ['ecosia'],
                enableMultiCore: false,
            });
            expect(instance).not.toBeNull();
            expect(instance).toHaveProperty('search');
            expect(instance).toHaveProperty('scraper');
            expect(instance).toHaveProperty('parser');
            expect(instance).toHaveProperty('metrics');
        });

        test('search method is a function', () => {
            const instance = stare({
                engines: ['ecosia'],
                enableMultiCore: false,
            }) as StareInstance;
            expect(typeof instance.search).toBe('function');
        });

        test('scraper method is a function', () => {
            const instance = stare({
                engines: ['ecosia'],
                enableMultiCore: false,
            }) as StareInstance;
            expect(typeof instance.scraper).toBe('function');
        });

        test('parser method is a function', () => {
            const instance = stare({
                engines: ['ecosia'],
                enableMultiCore: false,
            }) as StareInstance;
            expect(typeof instance.parser).toBe('function');
        });

        test('metrics method is a function', () => {
            const instance = stare({
                engines: ['ecosia'],
                enableMultiCore: false,
            }) as StareInstance;
            expect(typeof instance.metrics).toBe('function');
        });

        test('supports multiple engines', () => {
            const instance = stare({
                engines: ['ecosia', 'solr'],
                enableMultiCore: false,
            });
            expect(instance).not.toBeNull();
        });

        test('ignores unsupported engine names', () => {
            const instance = stare({
                engines: ['google', 'unsupportedEngine'],
                enableMultiCore: false,
            });
            expect(instance).not.toBeNull();
        });

        test('returns null if only unsupported engines are configured', () => {
            let result;
            jest.isolateModules(() => {
                const freshStare = require('../lib/index').default;
                result = freshStare({
                    engines: ['fakeEngine1', 'fakeEngine2'],
                });
            });
            expect(result).toBeNull();
        });
    });

    describe('parser() standalone method', () => {
        let instance: StareInstance;

        beforeAll(() => {
            instance = stare({
                engines: ['ecosia'],
                enableMultiCore: false,
            }) as StareInstance;
        });

        test('parses documents with htmlCode', () => {
            const serpResponse: SerpResponse = {
                totalResults: 1,
                searchTerms: 'test',
                numberOfItems: 1,
                startIndex: 0,
                documents: [
                    {
                        title: 'Test',
                        link: 'https://example.com',
                        body: '',
                        htmlCode: '<html><body><p>Parsed Content</p></body></html>',
                    } as StareDocument,
                ],
            };

            const result = instance.parser(serpResponse);

            expect(result.documents).toHaveLength(1);
            expect(result.documents[0]!.body).toBe('Parsed Content');
        });

        test('handles empty serpResponse', () => {
            const serpResponse: SerpResponse = {
                totalResults: 0,
                searchTerms: '',
                numberOfItems: 0,
                startIndex: 0,
            };

            const result = instance.parser(serpResponse);
            expect(result.documents).toEqual([]);
        });

        test('preserves existing body and metadata', () => {
            const serpResponse: SerpResponse = {
                totalResults: 100,
                searchTerms: 'preserve me',
                numberOfItems: 1,
                startIndex: 5,
                documents: [
                    {
                        title: 'Test',
                        link: 'https://example.com',
                        body: 'Existing body',
                    } as StareDocument,
                ],
            };

            const result = instance.parser(serpResponse);

            expect(result.totalResults).toBe(100);
            expect(result.searchTerms).toBe('preserve me');
            expect(result.startIndex).toBe(5);
            expect(result.documents[0]!.body).toBe('Existing body');
        });
    });

    describe('metrics() standalone method', () => {
        let instance: StareInstance;

        beforeAll(() => {
            instance = stare({
                engines: ['ecosia'],
                enableMultiCore: false,
            }) as StareInstance;
        });

        test('calculates ranking metric on provided documents', async () => {
            const serpResponse: SerpResponse = {
                totalResults: 1,
                searchTerms: 'test',
                numberOfItems: 1,
                startIndex: 0,
                documents: [
                    {
                        title: 'Test',
                        link: 'https://example.com',
                        body: 'Some body text for testing purposes.',
                        snippet: 'Some snippet',
                    } as StareDocument,
                ],
            };

            const result = await instance.metrics(serpResponse, ['ranking']);

            expect(result.documents).toHaveLength(1);
            const doc = result.documents![0] as any;
            expect(doc.metrics).toBeDefined();
            expect(doc.metrics.ranking).toBeDefined();
        });

        test('returns unmodified serpResponse for empty metrics array', async () => {
            const serpResponse: SerpResponse = {
                totalResults: 1,
                searchTerms: 'test',
                numberOfItems: 1,
                startIndex: 0,
                documents: [
                    {
                        title: 'Test',
                        link: 'https://example.com',
                        body: 'Some text',
                    } as StareDocument,
                ],
            };

            const result = await instance.metrics(serpResponse, []);
            expect(result.documents).toHaveLength(1);
        });

        test('handles multiple metrics', async () => {
            const serpResponse: SerpResponse = {
                totalResults: 1,
                searchTerms: 'test',
                numberOfItems: 1,
                startIndex: 0,
                documents: [
                    {
                        title: 'Test',
                        link: 'https://example.com',
                        body: 'Some test body text.',
                        snippet: 'Some snippet',
                    } as StareDocument,
                ],
            };

            const result = await instance.metrics(serpResponse, ['ranking', 'length']);

            const doc = result.documents![0] as any;
            expect(doc.metrics).toBeDefined();
            expect(doc.metrics.ranking).toBeDefined();
            expect(doc.metrics.length).toBeDefined();
        });

        test('detects already-scraped documents and skips re-scraping', async () => {
            const serpResponse: SerpResponse = {
                totalResults: 1,
                searchTerms: 'test',
                numberOfItems: 1,
                startIndex: 0,
                documents: [
                    {
                        title: 'Test',
                        link: 'https://example.com',
                        body: 'Body text',
                        htmlCode: '<html><body>Already scraped</body></html>',
                    } as StareDocument,
                ],
            };

            const result = await instance.metrics(serpResponse, ['ranking']);
            expect(result.documents).toHaveLength(1);
        });
    });

    describe('overriding global options', () => {
        test('overrides engine options', () => {
            const originalTimeout = global.stareOptions.requestTimeout;

            stare({
                engines: ['ecosia'],
                requestTimeout: 9999,
            } as any);

            expect(global.stareOptions.requestTimeout).toBe(9999);

            global.stareOptions.requestTimeout = originalTimeout;
        });

        test('overrides enableMultiCore option', () => {
            const original = global.stareOptions.enableMultiCore;

            stare({
                engines: ['ecosia'],
                enableMultiCore: false,
            });

            expect(global.stareOptions.enableMultiCore).toBe(false);

            global.stareOptions.enableMultiCore = original;
        });
        describe('search(), scraper(), and multicore', () => {
            let instance: StareInstance;

            beforeAll(() => {
                // Register mock engine
                global.stareOptions.personalSERPs = {
                    mockEngine: 'test/mockEngine'
                };

                instance = stare({
                    engines: ['mockEngine'],
                    enableMultiCore: false,
                }) as StareInstance;
            });

            test('scraper() hits the mock engine and returns documents', async () => {
                const result = await instance.scraper('mockEngine', 'cats', 2, 1);
                expect(result.totalResults).toBe(2);
                expect(result.documents).toHaveLength(2);
                expect(result.documents[0]!.title).toBe('Mock Result 1 for cats');
            });

            test('search() runs the full pipeline (scraper + metrics)', async () => {
                const result = await instance.search('mockEngine', 'dogs', 2, ['length', 'ranking']);
                expect(result.totalResults).toBe(2);
                expect(result.documents).toHaveLength(2);
                // Check metrics are added
                expect((result.documents![0] as any).metrics).toBeDefined();
                expect((result.documents![0] as any).metrics.length).toBeDefined();
            });

            test('search() handles unexpected engine missing', async () => {
                // The module requires us to provide a valid engine, if not supported it throws or is ignored.
                // Ecosia is supported but we won't actually hit it here:
                await expect(instance.search('nonExistentEngine', 'test', 2, [])).rejects.toMatch(/Search Engine 'nonExistentEngine' not supported/);
            });

            // Multi-core tests
            describe('with enableMultiCore', () => {
                let multiCoreInstance: StareInstance;

                beforeAll(() => {
                    multiCoreInstance = stare({
                        engines: ['mockEngine'],
                        enableMultiCore: true,
                        threads: 2, // Use 2 threads
                    }) as StareInstance;
                });

                test('search() with enableMultiCore successfully processes queries in background', async () => {
                    // Mocking the multi-core process for tests is complex because jest / worker_threads interact oddly sometimes
                    // But since we provided mockEngine, the worker pool will try to `require('../lib/serp/mockEngine')` or personalSERPs.
                    // Wait! The worker threads in index.ts call webSearch_ -> queries SERP. We need to make sure personalSERPs is passed to worker.
                    // Let's rely on standard search
                    const result = await multiCoreInstance.search('mockEngine', 'birds', 2, ['length']);
                    expect(result.documents).toHaveLength(2);
                    expect((result.documents![0] as any).metrics).toBeDefined();
                });

                test('scraper() hits mock engine via multicore', async () => {
                    const result = await multiCoreInstance.scraper('mockEngine', 'fish', 2, 1);
                    expect(result.documents).toHaveLength(2);
                });
            });
        });
    });
});
