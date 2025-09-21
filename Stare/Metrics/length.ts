import { promises as fs } from "fs";

/**
 * Calcula la longitud de un archivo en bytes.
 * @param input - Ruta del archivo.
 * @param index - Índice del documento.
 * @returns Promesa con [longitud, 'length', índice].
 */
export async function get_value(
  input: string,
  index: number
): Promise<[number, string, number]> {
  const data = await fs.readFile(input);
  const length = data.length + 1;
  return [length, "length", index];
}

export const use_DOC = () => true;
export const use_HTML = () => false;
export const use_SERP = () => false;
