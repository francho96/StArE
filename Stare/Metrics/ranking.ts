/**
 * Calcula el ranking de un documento en un SERP.
 * @param input - Objeto con propiedades `start` y `items`.
 * @param index - Índice del documento.
 * @returns Promesa con [ranking, 'ranking', índice].
 */
export async function get_value(
    input: { start: number; items: number },
    index: number
  ): Promise<[number, string, number]> {
    const ranking = input.start * input.items + 1;
    return [ranking, "ranking", index];
  }
  
  export const use_DOC = () => false;
  export const use_HTML = () => false;
  export const use_SERP = () => true;
  