/**
 * Mock Search Engine
 * Simulates a delay and returns a standardized response.
 */
async function getResultPages(query, startIndex, numberOfResults) {
  console.log(
    `[Mock Engine NEW] Iniciando búsqueda para: "${query}", start: ${startIndex}, n: ${numberOfResults}`,
  );
  // Simulate network latency (500ms)
  await new Promise((resolve) => setTimeout(resolve, 500));
  console.log(`[Mock Engine NEW] Delay de 500ms terminado para: "${query}"`);

  const totalResults = 1000;
  const docs = [];

  for (let i = 0; i < numberOfResults; i++) {
    docs.push({
      title: `Mock Result ${startIndex + i}`,
      link: `http://example.com/${startIndex + i}`,
      body: `This is the body for mock result ${startIndex + i}.`,
      snippet: `Snippet for result ${startIndex + i}`,
      image: `http://example.com/image${startIndex + i}.jpg`,
    });
  }

  return {
    totalResults,
    searchTerms: query,
    numberOfItems: docs.length,
    startIndex,
    documents: docs,
  };
}

module.exports = getResultPages;
