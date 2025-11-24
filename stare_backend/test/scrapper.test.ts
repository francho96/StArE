import {
  extractBody,
  allDocsHtmlCode
} from '../lib/scrapper/';

interface StareDocument {
  link: string | null;
  body: string | null;
  title?: string;
  snippet?: string;
  image?: string;
  htmlCode?: string;
}

const stareValidDocument: StareDocument = {
  link: 'https://starejs.informatica.usach.cl/',
  body: '',
};

const stareInvalidLinkDocument: StareDocument = {
  link: 'https://stare.example.org',
  body: '',
};

const stareEmptyLinkDocument: StareDocument = {
  link: '',
  body: null,
};

const stareNullLinkDocument: StareDocument = {
  link: null,
  body: null,
};

describe('Scrapper', () => {
  /*test(`Succesfully get html`, () => {
    return expect(html(stareValidDocument).then(html => (typeof html).toLowerCase())).resolves.toBe("string");
  }, 10000);

  test(`Empty link property to get html`, () => {
    return expect(html(stareEmptyLinkDocument)).resolves.toBe(stareEmptyLinkDocument.body);
  });

  test(`Failed to get html, invalid link`, () => {
    return expect(html(stareInvalidLinkDocument)).rejects.toThrow();
  });*/

  test(`Succesfully get text`, () => {
    const result = extractBody(stareValidDocument);
    expect(typeof result.toLowerCase()).toBe("string");
  }, 10000);

  test(`Empty link property to get text`, () => {
    const result = extractBody(stareEmptyLinkDocument);
    expect(result).toBe(stareEmptyLinkDocument.body);
  });
});