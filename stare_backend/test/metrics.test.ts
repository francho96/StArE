import _ from 'lodash';

import getMetrics from '../lib/metrics/';
import { calculate as language } from '../lib/metrics/language';
import { calculate as length } from '../lib/metrics/length';
import { calculate as perspicuity } from '../lib/metrics/perspicuity';
import { calculate as ranking } from '../lib/metrics/ranking';
import { calculate as keywordsPosition } from '../lib/metrics/keywords-position';
import { calculate as multimedia } from '../lib/metrics/multimedia';
import { calculate as links } from '../lib/metrics/links';

interface StareDocument {
  title: string;
  link: string;
  body: string | null;
  htmlCode: string;
  snippet: string | null;
  image: string | null;
}

interface SearchInfo {
  totalResults: string;
  searchTerms: string;
  numberOfItems: number;
  startIndex: number;
}

interface CalculateOptions {
  searchInfo: SearchInfo;
  index: number;
}

interface MetricResult {
  name: string;
  index: number;
  value: any;
}

interface SerpResponse {
  totalResults: number;
  searchTerms: string;
  numberOfItems: number;
  startIndex: number;
  documents: StareDocument[];
}

/* Same SERP response for every test */
const stareValidDocument: StareDocument = {
  title: 'StArE.js — Search engine visuAlization packagE - Usach',
  link: 'https://starejs.informatica.usach.cl/',
  body: '',
  htmlCode: '',
  snippet: 'StArE.js: An extensible open source toolkit for visualizing search engine results. ... Supervised by González-Ibáñez, R. Departamento de Ingeniería Informática, ...',
  image: null
};

const stareInvalidDocument: StareDocument = {
  title: 'No good title',
  link: 'no-good-url-either',
  body: null,
  htmlCode: '',
  snippet: null,
  image: null
};

const opts: CalculateOptions = {
  searchInfo: {
    totalResults: '1',
    searchTerms: 'Testing query',
    numberOfItems: 1,
    startIndex: 1
  },
  index: 1
};

const serpResponse: SerpResponse = {
  totalResults: 1,
  searchTerms: 'Testing query',
  numberOfItems: 1,
  startIndex: 0,
  documents: [
    stareValidDocument
  ]
};

describe(`Feature 'language'`, () => {
  test(`Valid stareDocument object`, async () => {
    const data = await language(stareValidDocument, opts);
    expect(data).toMatchObject({
      'name': 'language',
      'index': 1,
      'value': expect.any(String)
    });
  });

  test(`Invalid stareDocument (snippet == '').`, async () => {
    const data = await language(stareInvalidDocument, opts);
    expect(data).toMatchObject({
      'name': 'language',
      'index': 1,
      'value': null
    });
  });
});

describe(`Feature 'length'`, () => {
  test(`Valid stareDocument object`, async () => {
    const data = await length(stareValidDocument, opts);
    expect(data).toMatchObject({
      'name': 'length',
      'index': 1,
      'value': expect.any(Number)
    });
    expect(data.value).toBeGreaterThan(-1);
  });

  test(`Feature 'length' with invalid stareDocument object`, async () => {
    const data = await length(stareInvalidDocument, opts);
    expect(data).toMatchObject({
      'name': 'length',
      'index': 1,
      'value': -1
    });
  });
});

describe(`Feature 'perspicuity'`, () => {
  test(`Valid stareDocument 'en-us' object`, async () => {
    const englishText: StareDocument = { ...stareInvalidDocument };
    englishText.body = 'Although the phrase is nonsense, it does have a long history. The phrase has been used for several centuries by typographers to show the most distinctive features of their fonts. It is used because the letters involved and the letter spacing in those combinations reveal, at their best, the weight, design, and other important features of the typeface.';

    const data = await perspicuity(englishText, opts);
    expect(data).toMatchObject({
      'name': 'perspicuity',
      'index': 1,
      'value': expect.any(Number)
    });

    expect(data.value).toBeGreaterThanOrEqual(0);
    expect(data.value).toBeLessThanOrEqual(207);
  });

  test(`Valid stareDocument 'fr' object`, async () => {
    const frenchText: StareDocument = { ...stareInvalidDocument };
    frenchText.body = `Bien que la phrase soit absurde, elle a une longue histoire. L'expression a été utilisée pendant plusieurs siècles par les typographes pour montrer les caractéristiques les plus distinctives de leurs polices. Il est utilisé parce que les lettres impliquées et l'espacement des lettres dans ces combinaisons révèlent, au mieux, le poids, le design et d'autres caractéristiques importantes de la police.`;

    const data = await perspicuity(frenchText, opts);
    expect(data).toMatchObject({
      'name': 'perspicuity',
      'index': 1,
      'value': expect.any(Number)
    });

    expect(data.value).toBeGreaterThanOrEqual(0);
    expect(data.value).toBeLessThanOrEqual(207);
  });

  test(`Valid stareDocument 'es' object`, async () => {
    const spanishText: StareDocument = { ...stareInvalidDocument };
    spanishText.body = `Aunque la frase es una tontería, tiene una larga historia. La frase ha sido utilizada durante varios siglos por tipógrafos para mostrar las características más distintivas de sus fuentes. Se utiliza porque las letras involucradas y el espaciado entre letras en esas combinaciones révélan, en el mejor de los casos, el peso, el diseño y otras características importantes del tipo de letra.`;

    const data = await perspicuity(spanishText, opts);
    expect(data).toMatchObject({
      'name': 'perspicuity',
      'index': 1,
      'value': expect.any(Number)
    });

    expect(data.value).toBeGreaterThanOrEqual(0);
    expect(data.value).toBeLessThanOrEqual(207);
  });

  test(`Invalid stareDocument object`, async () => {
    const latinText: StareDocument = { ...stareInvalidDocument };
    latinText.body = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

    const data = await perspicuity(latinText, opts);
    expect(data).toMatchObject({
      'name': 'perspicuity',
      'index': 1,
      'value': expect.any(Object)
    });
  });
});

describe(`Feature 'ranking'`, () => {
  test(`Feature 'ranking' with valid stareDocument object`, async () => {
    const data = await ranking(stareValidDocument, opts);
    expect(data).toMatchObject({
      'name': 'ranking',
      'index': 1,
      'value': 2
    });
  });
});

describe(`Feature 'keywords-position'`, () => {
  test(`Valid stareDocument object`, async () => {
    const englishText: StareDocument = { ...stareInvalidDocument };
    englishText.body = 'Although the phrase is nonsense, it does have a long history. The phrase has been used for several centuries by typographers to show the most distinctive features of their fonts. It is used because the letters involved and the letter spacing in those combinations reveal, at their best, the weight, design, and other important features of the typeface.';

    const options: CalculateOptions = { ...opts };
    options.searchInfo.searchTerms = 'phrase';

    const data = await keywordsPosition(englishText, options);
    expect(data).toMatchObject({
      'name': 'keywords-position',
      'index': 1,
      'value': expect.any(Object)
    });
  });

  test(`Invalid stareDocument.`, async () => {
    const data = await keywordsPosition(stareInvalidDocument, opts);
    expect(data).toMatchObject({
      'name': 'keywords-position',
      'index': 1,
      'value': -1
    });
  });
});

describe(`Feature 'multimedia'`, () => {
  test(`Valid stareDocument object`, async () => {
    const data = await multimedia(stareValidDocument, opts);
    expect(data).toMatchObject({
      'name': 'multimedia',
      'index': 1,
      'value': expect.any(Object)
    });

    expect((data.value as any).video).toBeGreaterThanOrEqual(0);
    expect((data.value as any).img).toBeGreaterThanOrEqual(0);
    expect((data.value as any).audio).toBeGreaterThanOrEqual(0);
  });

  test(`Invalid stareDocument.`, async () => {
    const data = await multimedia(stareInvalidDocument, opts);
    expect(data).toMatchObject({
      'name': 'multimedia',
      'index': 1,
      'value': -1
    });
  });
});

describe(`Feature 'links'`, () => {
  test(`Valid stareDocument object`, async () => {
    const data = await links(stareValidDocument, opts);
    expect(data).toMatchObject({
      'name': 'links',
      'index': 1,
      'value': expect.any(Array)
    });
  });

  test(`Invalid stareDocument.`, async () => {
    const data = await links(stareInvalidDocument, opts);
    expect(data).toMatchObject({
      'name': 'links',
      'index': 1,
      'value': -1
    });
  });
});

describe(`Function 'getMetrics'`, () => {
  test('Without stareDocument and empty metrics array', async () => {
    const data = await getMetrics({} as SerpResponse, []);
    expect(data).toEqual([]);
  });

  test('Without stareDocument.', async () => {
    const data = await getMetrics({} as SerpResponse, ['language', 'length', 'perspicuity', 'ranking']);
    expect(data.length).toEqual(0);
  });

  test('Personal metric.', async () => {
    (global as any).stareOptions.personalMetrics = {
      voidFunction: (stareDocument: StareDocument, opts: CalculateOptions) => ({}),
      notAFunction: null
    };
    const data = await getMetrics(serpResponse, ['voidFunction', 'notAFunction']);
    expect(data.length).toEqual(0);
  });

  test('Get ranking metric from document.', async () => {
    const data = await getMetrics(serpResponse, ['ranking']);
    expect(data.length).toEqual(1);
    expect(data[0].value).toEqual(0);
  });
});