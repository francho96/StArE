/**
 * Jest setup file. Initializes global.stareOptions before tests run.
 */
import '../lib/config/defaultOptions';

// Override API keys for testing (use type assertion to avoid re-declaring global)
(global as any).stareOptions.google.apiKey = 'test-api-key';
(global as any).stareOptions.google.apiCx = 'test-api-cx';
(global as any).stareOptions.bing.serviceKey = 'test-service-key';
