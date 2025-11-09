import { promises as fs } from "fs";
import LanguageDetect from "languagedetect";

const lngDetector = new LanguageDetect();

const english = (words: number, syllables: number) =>
  207 - 0.623 * syllables - 1.05 * words;
const spanish = (words: number, syllables: number) =>
  207 - 0.623 * syllables - words;
const french = (words: number, syllables: number) =>
  207 - 0.724 * syllables - 0.962 * words;

const limpiarString = (str = "") =>
  str.replace(/[.,()\[\]{}\-\@\'\"]/gi, "");

const separarPalabras = (str = "") =>
  limpiarString(str).split(/\s+/).filter(Boolean);

/**
 * Estima sílabas por palabra según el idioma, esto para remplazar el hyphenoly
 * No es perfecto, pero suficiente para índices de legibilidad.
 */
const contarSilabasPalabra = (palabra: string, lang: string): number => {
  palabra = palabra.toLowerCase().replace(/[^a-záéíóúüñ]/gi, "");

  let vocales =
    lang === "en-us"
      ? palabra.match(/[aeiouyáéíóúü]/gi)
      : palabra.match(/[aeiouáéíóúü]/gi);

  let count = vocales ? vocales.length : 1;

  if (palabra.endsWith("e") && lang === "en-us" && count > 1) count--;
  return Math.max(1, count);
};

/**
 * Cuenta sílabas totales de un texto...........
 */
const contarSilabas = (texto: string, lang: "es" | "en-us" = "es"): number => {
  const palabras = separarPalabras(texto);
  return palabras.reduce(
    (acc, palabra) => acc + contarSilabasPalabra(palabra, lang),
    0
  );
};

/**
 * Estima promedio de palabras......
 */
const p = (str = "") => {
  const nPalabras = separarPalabras(str).length * 1.0;
  const nFrases = Math.max(1, str.split(/[.!?]/).length * 1.0);
  return nPalabras / nFrases;
};

/**
 * Calcula el índice de perspicuidad de un documento.
 * @param input - Ruta del archivo.
 * @param index - Índice del documento.
 * @returns Promesa con [valor, 'perpiscuity', índice].
 */
export async function get_value(
  input: string,
  index: number
): Promise<[number, string, number]> {
  const data = await fs.readFile(input, "utf-8");
  const idiom = lngDetector.detect(data, 1)?.[0]?.[0] ?? "unknown";

  let value: number;
  switch (idiom) {
    case "english":
      value = english(p(data), contarSilabas(data, "en-us"));
      break;
    case "spanish":
      value = spanish(p(data), contarSilabas(data, "es"));
      break;
    case "french":
      value = french(p(data), contarSilabas(data, "es"));
      break;
    default:
      value = 207;
  }

  value = Math.max(0, Math.min(207, Math.round(value)));
  console.log("Perpiscuidad es:", value);

  return [value, "perpiscuity", index];
}

export const use_DOC = () => true;
export const use_HTML = () => false;
export const use_SERP = () => false;
