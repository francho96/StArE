import LanguageDetect from 'languagedetect';
import hyphenopoly from 'hyphenopoly';
import _ from 'lodash';
import { extractBody } from "../scrapper";
import { threadId } from 'worker_threads';
import debug from 'debug';
import { CalculateOptions, ErrorResult, StareDocument, SupportedLanguages } from '../interfaces';

const lngDetector = new LanguageDetect();
const hyphenator = hyphenopoly.config({
  require: ['es', 'en-us', 'fr'],
  hyphen: '-',
  sync: true
});

const debugInstance = debug(`stare.js:server/metrics/perspicuity [Thread #${threadId}]`);
const requiresScrapping = true;

interface MetricResult {
  name: string;
  index: number;
  value: number | ErrorResult;
}

/*
* Supported languages, consists of a key for the language name (in english)
* and the value is string for the hyphenopoly code and a function to calculate the perspicuity.
*/
const SUPPORTED_LANGUAGES: SupportedLanguages = {
  'english': {
    hyphenatorCode: 'en-us',
    // Flesh 1984
    val: (words: number, syllables: number) => 207 - 0.623 * syllables - 1.05 * words
  },
  'spanish': {
    hyphenatorCode: 'es',
    // Szigriszt 1992
    val: (words: number, syllables: number) => 207 - 0.623 * syllables - words
  },
  'french': {
    hyphenatorCode: 'fr',
    // Szigriszt 1992
    val: (words: number, syllables: number) => 207 - 0.724 * syllables - 0.962 * words
  }
};

/**
 * Clean a string removing symbol characters
 *
 * @param {string} text The string to clean
 * @returns {string} The same text without the symbols.
 */
function cleanString(text: string): string {
  return text.replace(/[.,()\[\]{}\-\@\'\"]/gi, "");
}

/**
 * Separates a long text string removing 'empty' words/spaces
 *
 * @param {string} text The string to split.
 * @returns {string[]} Array of strings with the words of the text
 */
function splitWords(text: string): string[] {
  return cleanString(text)
    .split(" ")
    .filter(word => word !== "");
}

/**
 * Gets the number of syllables in the text variable.
 *
 * @param {string} text String text
 * @param {string} lang Language code for hyphenopoly
 * @returns {number} Number of syllables
 */
function syllables(text: string, lang: string): number {
  const hyphenateText = hyphenator.get(lang);
  return hyphenateText(cleanString(text))
    .replace(' ', '-')
    .split('-')
    .length;
}

/**
 * Get ratio between words and phrases in the text.
 *
 * @param {string} text String text
 * @returns {number} Ratio between words and phrases
 */
function words(text: string): number {
  const numberOfWords = splitWords(text).length * 1.0;
  const numberOfPhrases = text.split(".").length * 1.0;
  return numberOfWords / numberOfPhrases;
}

/**
 * Calculates the document's perspicuity (ease to read/understand).
 *
 * @async
 * @param {StareDocument} stareDocument  The Document data with stare format
 * @param {CalculateOptions} opts  Optional parameters to calculate the metric
 * @returns {Promise<MetricResult>}
 */
async function calculate(stareDocument: StareDocument, opts: CalculateOptions): Promise<MetricResult> {
  try {
    const text = extractBody(stareDocument);
    const detectedLanguage = lngDetector.detect(text, 1)[0][0];
    const language = _.get(SUPPORTED_LANGUAGES, detectedLanguage, null);

    if (!language) {
      return {
        name: 'perspicuity',
        index: opts.index,
        value: {
          code: -1,
          message: 'Language not supported'
        }
      };
    }

    let value = language.val(words(text), syllables(text, language.hyphenatorCode));
    value = Math.round(value);

    if (value < 0) {
      value = 0;
    }

    return {
      name: 'perspicuity',
      index: opts.index,
      value: value
    };
  } catch (err) {
    debugInstance(err);
    return {
      name: 'perspicuity',
      index: opts.index,
      value: {
        code: _.get(err, 'statusCode', -1),
        message: 'Error getting text.'
      }
    };
  }
}

export { calculate, requiresScrapping };