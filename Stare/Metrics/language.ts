import LanguageDetect from "languagedetect";

const lngDetector = new LanguageDetect();

/**
 * Detecta el idioma de un snippet de un documento.
 * @param input - Objeto que contiene documentos.
 * @param index - Índice del documento a analizar.
 * @returns Promesa con [idioma, 'language', índice].
 */
export async function get_value(
  input: { documents: { snippet: string }[] },
  index: number
): Promise<[string, string, number]> {
  console.log('language')
  const snippet = input.documents[index].snippet;
  const value = lngDetector.detect(snippet, 1)[0][0];
  return [value, "language", index];
}

export const use_DOC = () => false;
export const use_HTML = () => false;
export const use_SERP = () => true;
