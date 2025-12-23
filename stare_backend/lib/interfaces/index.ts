export interface GoogleOptions {
    apiKey: string;
    apiCx: string;
}

export interface BingOptions {
    serviceKey: string;
}

export interface EcosiaOptions {
    resultsPerPage: number;
}

export interface ElasticsearchOptions {
    baseUrl: string;
    _index: string;
    _source: string;
    titleProperty: string;
    bodyProperty: string;
    snippetProperty: string;
    imageProperty: string;
}

export interface SolrOptions {
    baseUrl: string;
    core: string;
    titleProperty: string;
    bodyProperty: string;
    linkProperty?: string;
    snippetProperty: string;
    imageProperty: string;
}

export interface SearchCloudOptions {
    searchEndpoint: string;
    apiVersion: string;
    titleProperty: string;
    bodyProperty: string;
    linkProperty?: string;
    snippetProperty: string;
    imageProperty: string;
}

export interface GlobalStareOptions {
    engines: string[];
    personalMetrics: { [key: string]: string };
    personalSERPs: { [key: string]: string };
    numberOfResults: number;
    requestTimeout: number;
    enableMultiCore: boolean;
    workerThreads: number;
    customScraper: string | null;
    customScraperOpts: any | null;
    google: GoogleOptions;
    bing: BingOptions;
    ecosia: EcosiaOptions;
    elasticsearch: ElasticsearchOptions;
    solr: SolrOptions;
    searchcloud: SearchCloudOptions;
}

export interface SearchInfo {
    totalResults: string;
    searchTerms: string;
    numberOfItems: number;
    startIndex: number;
}

export interface CalculateOptions {
    searchInfo: SearchInfo;
    index: number;
}

export interface MetricModule {
    calculate: (stareDocument: StareDocument, opts: CalculateOptions) => Promise<any>;
    requiresScrapping: boolean;
}
export interface StareDocument {
    title: string;
    link: string;
    body?: string | null;
    htmlCode: string;
    snippet?: string | null;
    image?: string | null;
}

export interface KeywordPositions {
    documentLength: number;
    keywords: {
        [key: string]: number[];
    };
}

export interface MetricResult {
    name: string;
    index: number;
    value: KeywordPositions | number | string;
}

export interface ScrapeOptions {
    [key: string]: any;
}

export interface LanguageProbability {
    [key: string]: number;
}


export interface PslResult {
    domain?: string | null;
    [key: string]: any;
}

export interface TagMapping {
    [key: string]: string;
}

export interface MultimediaCount {
    video: number;
    img: number;
    audio: number;
}

interface LanguageConfig {
    hyphenatorCode: string;
    val: (words: number, syllables: number) => number;
}

export interface SupportedLanguages {
    [key: string]: LanguageConfig;
}

export interface ErrorResult {
    code: number;
    message: string;
}

export interface BingDocument {
    title: string;
    link: string;
    snippet: string;
    image?: any;
}

export interface BingWebPage {
    value: Array<{
        url: string;
        name: string;
        snippet: string;
        image?: any;
    }>;
    totalEstimatedMatches: number;
}

export interface BingSearchResponse {
    webPages: BingWebPage;
    queryContext: {
        originalQuery: string;
    };
}

export interface EcosiaDocument {
    title: string;
    link: string;
    snippet: string;
    image: string;
}

export interface ElasticsearchDocument {
    title: string;
    link: string | null;
    body: string | null;
    snippet: string;
    image?: any;
}

export interface ElasticsearchHit {
    _source: {
        [key: string]: any;
    };
}

export interface ElasticsearchResponse {
    hits: {
        total: number;
        hits: ElasticsearchHit[];
    };
}

export interface GoogleDocument {
    title: string;
    link: string;
    snippet: string;
    image?: string;
}

export interface GoogleSearchResponse {
    data: {
        searchInformation: {
            formattedTotalResults: string;
        };
        queries: {
            request: Array<{
                searchTerms: string;
                startIndex: number;
            }>;
        };
        items?: Array<{
            title: string;
            link: string;
            snippet: string;
            pagemap?: {
                cse_image?: Array<{
                    src: string;
                }>;
            };
        }>;
    };
    config: {
        params: {
            start: number;
            num: number;
        };
    };
}

export interface SearchCloudDocument {
  title: string;
  link: string | null;
  body: string | null;
  snippet: string;
  image?: any;
}

export interface SearchCloudHit {
  [key: string]: any;
}

export interface SearchCloudResponse {
  hits: {
    found: number;
    start: number;
    hit: SearchCloudHit[];
  };
}

interface SolrDocument {
  title: string;
  link: string | null;
  body: string | null;
  snippet: string;
  image?: any;
}

export interface SolrResponseDoc {
  [key: string]: any;
}

export interface SolrResponse {
  data: {
    responseHeader: {
      params: {
        q: string;
      };
    };
    response: {
      numFound: number;
      start: number;
      docs: SolrResponseDoc[];
    };
  };
}



export interface SerpResponse {
    totalResults: string | number;
    searchTerms: string;
    numberOfItems: number;
    startIndex: number;
    documents: SolrDocument[] | SearchCloudDocument[] | GoogleDocument[] | BingDocument[] | StareDocument[] | EcosiaDocument[] | ElasticsearchDocument[];
}

export interface StareOptions {
  engines: string[];
  personalSERPs: { [key: string]: string };
  personalMetrics: { [key: string]: string };
  enableMultiCore: boolean;
  workerThreads: number;
  [key: string]: any;
}

export interface Partition {
  startIndex: number;
  numResults: number;
}

export interface PartitionResult {
  threads: number;
  partitions: Partition[];
  numPartitions: number;
}

export interface WorkerData {
  engine: string;
  query: string;
  startIndex: number;
  numberOfResults: number;
  metrics: string[];
  opts: Partial<StareOptions>;
}