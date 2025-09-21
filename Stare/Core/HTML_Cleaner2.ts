const { convert } = require("cheerio-html-to-text");

/**
 * Limpia un string eliminando etiquetas HTML.
 * @param str - Texto con HTML.
 * @returns Promesa con el texto limpio.
 */
export async function promesaLimpiarArchivo(str: string): Promise<string> {
  return convert(str);
}