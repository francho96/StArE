import { promises as fs } from "fs";
import LanguageDetect from "languagedetect";
import hyphenopoly from "hyphenopoly";

const lngDetector = new LanguageDetect();
const silabas = hyphenopoly.config({
  sync: true,
  require: ["es", "en-us"],
  hyphen: "-"
});

// Fórmulas de legibilidad
const english = (words: number, syllables: number) =>
  207 - 0.623 * syllables - 1.05 * words;
const spanish = (words: number, syllables: number) =>
  207 - 0.623 * syllables - words;
const french = (words: number, syllables: number) =>
  207 - 0.724 * syllables - 0.962 * words;

// Utilidades
const limpiarString = (str = "") =>
  str.replace(/[.,()\[\]{}\-\@\'\"]/gi, "");
const separarPalabras = (str = "") => limpiarString(str).split(" ");
const s = (str = "", lang: "es" | "en-us" = "es") =>
  silabas.get(lang)(limpiarString(str)).replace(" ", "-").split("-").length;
const p = (str = "") => {
  const nPalabras = separarPalabras(str).length * 1.0;
  const nFrases = str.split(".").length * 1.0;
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
      value = english(p(data), s(data, "en-us"));
      break;
    case "spanish":
      value = spanish(p(data), s(data, "es"));
      break;
    case "french":
      value = french(p(data), s(data, "fr" as any)); // no siempre soporta frances
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
