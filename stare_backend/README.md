# StArE.js (StArE Core)

![npm](https://img.shields.io/npm/v/@francho96/stare)
![license](https://img.shields.io/npm/l/@francho96/stare)
![typescript](https://img.shields.io/badge/Language-TypeScript-blue)
[![Build Status](https://travis-ci.com/francho96/StArE.svg?branch=master)](https://github.com/francho96/StArE)
[![Coverage Status](https://coveralls.io/repos/github/francho96/StArE/badge.svg?branch=master)](https://coveralls.io/github/francho96/StArE?branch=master)

**StArE.js** (Search Engine Results Evaluator) is an open-source research-oriented library designed to facilitate the creation of alternative visualizations and evaluations of Search Engine Results Pages (SERP). 

It provides a modular and extensible processing pipeline capable of:
1.  **Transforming SERP** from multiple search engines into a common format.
2.  **Extracting features** and downloading HTML content from individual search results.
3.  **Calculating metrics** (reading ease, multimedia count, keyword positions, etc.) on-the-fly.

---

## 🚀 Installation

```bash
npm install @francho96/stare
```

## 🛠️ Quick Start

### TypeScript
```typescript
import stare from '@francho96/stare';

const stareInstance = stare({
  engines: ['google', 'ecosia'],
  google: {
    apiKey: 'YOUR_GOOGLE_API_KEY',
    apiCx: 'YOUR_GOOGLE_CX'
  }
});

stareInstance.search('google', 'open source', 10, ['ranking', 'language'])
  .then(result => console.log(result))
  .catch(err => console.error(err));
```

### JavaScript (ESM or CommonJS)
```javascript
// CommonJS
const stare = require('@francho96/stare').default;

const stareInstance = stare({ /* options */ });
// ... use stareInstance.search
```

---

## 🏗️ Core Architecture

StArE.js follows a 3-step pipeline which can be executed as a whole or in individual stages:

1.  **Scraper**: Queries a SERP engine and (optionally) downloads the full HTML content of each result.
2.  **Parser**: Extracts clean body text and metadata from the scraped HTML.
3.  **Metrics**: Calculates quantitative and qualitative metrics on the results.

### Multi-Core Support
StArE can leverage Node.js Worker Threads to parallelize the scraping and metric calculation process, significantly improving performance for large result sets.

```javascript
const stareInstance = stare({
  enableMultiCore: true,
  workerThreads: 4 // Number of worker threads
});
```

---

## 📖 API Reference

### `stare(options: StareOptions)`
Initializes the StArE instance.

| Option | Type | Description |
| :--- | :--- | :--- |
| `engines` | `string[]` | List of enabled search engines. |
| `enableMultiCore` | `boolean` | Enable parallel processing via worker threads. |
| `workerThreads` | `number` | Number of threads to use (default: CPU cores). |
| `requestTimeout` | `number` | Timeout for HTTP requests in ms. |
| `personalSERPs` | `object` | Map of custom SERP handler paths. |
| `personalMetrics` | `object` | Map of custom metric module paths. |

### `instance.search(engine, query, nResults, metrics, startIndex)`
Executes the full pipeline (SERP query + Scraping + Parsing + Metrics).

### `instance.scraper(engine, query, nResults, startIndex)`
Only performs the SERP query and fetches the HTML of the results.

### `instance.parser(serpResponse)`
Extracts body text from a previously scraped `serpResponse`.

### `instance.metrics(serpResponse, metricsList)`
Calculates metrics on a `serpResponse`.

---

## 🔌 Extensions

### Supported SERPs
| Engine | Key | Requires |
| :--- | :--- | :--- |
| **Google** | `google` | API Key & CX |
| **Bing** | `bing` | Service Key |
| **Ecosia** | `ecosia` | - (Scraper) |
| **ElasticSearch** | `elasticsearch` | Base URL & Index |
| **Solr** | `solr` | Base URL & Core |
| **AWS Search** | `searchcloud` | Endpoint |

### Supported Metrics
| Metric | Key | Description |
| :--- | :--- | :--- |
| **Ranking** | `ranking` | Original position in the search engine. |
| **Language** | `language` | Detects document language. |
| **Length** | `length` | Character and word count. |
| **Perspicuity** | `perspicuity` | Reading ease (English & Spanish). |
| **Multimedia** | `multimedia` | Count of images, audio, and video. |
| **Links** | `links` | Internal and external link analysis. |
| **Keyword Position** | `keywords-position` | Map of query terms within the document. |

---

## 🧪 Development & Debugging

Enable debug logs by setting the `DEBUG` environment variable:

```bash
DEBUG=stare.js:* npm start
```

For more detailed information, please refer to the [official documentation](/docs/INDEX.md).

## 🤝 Contributing
Feel free to open issues or submit pull requests. Check the [examples](/examples/) folder for inspiration on how to build custom metrics or SERP handlers.

## 📄 License
[MIT](LICENSE)

