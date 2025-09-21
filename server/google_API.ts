// Copyright 2012-2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

import axios from 'axios';

interface GoogleSearchOptions {
    q: string;
    apiKey: string;
    cx: string;
}

interface GoogleSearchItem {
    title: string;
    snippet: string;
    link: string;
    formattedUrl: string;
    htmlFormattedUrl?: string;
    htmlSnippet?: string;
    htmlTitle?: string;
    cacheId?: string;
    displayLink?: string;
    kind?: string;
    [key: string]: any;
}

interface GoogleSearchResponse {
    kind: string;
    url: {
        type: string;
        template: string;
    };
    queries: {
        request: Array<{
            title: string;
            totalResults: string;
            searchTerms: string;
            count: number;
            startIndex: number;
            startPage: number;
            language: string;
            inputEncoding: string;
            outputEncoding: string;
            safe: string;
            cx: string;
            [key: string]: any;
        }>;
        nextPage?: Array<{
            title: string;
            totalResults: string;
            searchTerms: string;
            count: number;
            startIndex: number;
            startPage: number;
            language: string;
            inputEncoding: string;
            outputEncoding: string;
            safe: string;
            cx: string;
            [key: string]: any;
        }>;
    };
    context: {
        title: string;
    };
    searchInformation: {
        searchTime: number;
        formattedSearchTime: string;
        totalResults: string;
        formattedTotalResults: string;
    };
    items?: GoogleSearchItem[];
}

/**
 * Realiza una búsqueda usando la API de Custom Search de Google
 * @param options Opciones de búsqueda
 * @param p Número de página (0-based)
 * @returns Promise con los resultados de la búsqueda
 */
async function runSample(options: GoogleSearchOptions, p: number = 0): Promise<any> {
    try {
        const startIndex = p * 10 + 1;
        const url = 'https://www.googleapis.com/customsearch/v1';
        
        const params = {
            key: options.apiKey,
            cx: options.cx,
            q: options.q,
            start: startIndex,
            num: 10
        };

        const response = await axios.get<GoogleSearchResponse>(url, { params });
        
        // Transformar los resultados al formato esperado por tu aplicación
        const transformedData = transformGoogleResults(response.data, options.q, p);
        
        return transformedData;
    } catch (error) {
        console.error('Error en la búsqueda de Google:', error);
        throw error;
    }
}

/**
 * Transforma los resultados de Google al formato estándar de la aplicación
 */
function transformGoogleResults(data: GoogleSearchResponse, query: string, page: number): any {
    const items = data.items || [];
    
    const transformed = {
        q: query,
        websites: items.map((item: GoogleSearchItem, index: number) => ({
            title: item.title || '',
            snippet: item.snippet || '',
            url: item.link || '',
            description: item.snippet || '',
            position: (page * 10) + index + 1
        })),
        totalResults: parseInt(data.searchInformation?.totalResults || '0'),
        currentPage: page,
        currentResults: items.length,
        resultsFrom: page * 10 + 1,
        resultsTo: page * 10 + items.length,
        searchInformation: {
            searchTime: data.searchInformation?.searchTime || 0,
            totalResults: data.searchInformation?.totalResults || '0'
        }
    };

    return transformed;
}

// Ejecución directa si es el módulo principal
if (require.main === module) {
    // You can get a custom search engine id at
    // https://www.google.com/cse/create/new
    const options: GoogleSearchOptions = {
        q: process.argv[2],
        apiKey: process.argv[3],
        cx: process.argv[4],
    };
    runSample(options).catch(console.error);
}

export {
    runSample,
    GoogleSearchOptions,
    GoogleSearchItem,
    GoogleSearchResponse
};