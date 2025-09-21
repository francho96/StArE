import * as cheerio from 'cheerio';
import axios from 'axios';

interface SearchResult {
    title: string;
    snippet: string;
    url: string;
    description: string;
}

interface QueryJson {
    q: string;
    websites: SearchResult[];
    totalResults: number;
    currentPage: number;
    currentResults: number;
    resultsFrom: number;
    resultsTo: number;
}

const scrap = async (q: string = "", p: number = 0, ruta: string = ""): Promise<QueryJson> => {
    try {
        const searchUrl = `https://ecosia.org/search?q=${q}&p=${p}`;
        console.log(searchUrl);
        
        // Hacer la petición con axios
        const response = await axios.get(searchUrl);
        const html = response.data;
        
        const $ = cheerio.load(html);
        
        const queryJson: QueryJson = {
            q,
            websites: [],
            totalResults: 0,
            currentPage: p,
            currentResults: 0,
            resultsFrom: p * 10,
            resultsTo: 0,
        };

        $('div.result:not(.results-ads)').each((index, element) => {
            const result: SearchResult = {
                title: '',
                snippet: '',
                url: '',
                description: ''
            };
            
            result.url = $(element).find('a.result-title').attr('href') || '';
            result.title = $(element).find('a.result-title').text().replace("\n", "").trim();
            result.description = $(element).find('p.result-snippet').text().replace("\n", "").trim();
            result.snippet = result.description;

            if (result.url && !result.url.startsWith('/search')) {
                queryJson.websites[index] = result;
                queryJson.currentResults++;
            }
        });

        const resultCountText = $('div.card-title-result-count').text().replace(/\n|results|,/g, "").trim();
        queryJson.totalResults = parseInt(resultCountText) || 0;
        
        return queryJson;
        
    } catch (error) {
        console.error('Error scraping Ecosia:', error);
        throw error;
    }
};

export { scrap, SearchResult, QueryJson };