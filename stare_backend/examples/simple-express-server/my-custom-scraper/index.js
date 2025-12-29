const { threadId } = require('worker_threads');
const debug = require("debug")(`custom_scraper [Thread #${threadId}]`)
const axios = require("axios")
const _ = require("lodash")
const cheerio = require('cheerio'); // Necesitarás instalarlo: npm install cheerio

/**
 * Downloads the HTML code of a Google search result directly from the web.
 *
 * @async
 * @param {object} stareDocument SERP Document to download.
 * @param {object} opts
 * @returns {Promise<string>} Promise object with the html code
 */
async function customScrape(stareDocument, opts) {
  const docLink = _.get(stareDocument, 'link');
  
  if (!docLink) {
    debug("No link found in document");
    return "";
  }
  
  debug(`Scraping from web [${docLink}]`);
  
  try {
    // Configurar headers para evitar bloqueos
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0'
    };
    
    const response = await axios.get(docLink, {
      headers: headers,
      timeout: 10000, // 10 segundos timeout
      maxRedirects: 5
    });
    
    const html = response.data;
    
    // Si es un resultado de Google (búsqueda), extraer el contenido real
    if (docLink.includes('google.com/search') || docLink.includes('google.com/url')) {
      const $ = cheerio.load(html);
      
      // Intentar extraer el contenido principal
      let extractedContent = "";
      
      // Para resultados de búsqueda de Google
      const mainContent = $('div#main, div#center_col, div#search, div#rso').html();
      if (mainContent) {
        extractedContent = mainContent;
      } else {
        // Si no encontramos contenido específico, devolver todo
        extractedContent = html;
      }
      
      return extractedContent;
    } else {
      // Para enlaces normales, devolver el HTML completo
      return html;
    }
    
  } catch (error) {
    debug(`Error scraping ${docLink}: ${error.message}`);
    return "";
  }
}

module.exports = exports = customScrape;