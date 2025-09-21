import * as fs from "fs";
// archivo por comentar
export interface DocumentInfo {
  title: string;
  link: string;
  displaylink: string;
  snippet: string;
  image?: string | object;
}

export class Document {
  title: string;
  link: string;
  displaylink: string;
  snippet: string;
  image: string | object;

  constructor(info: DocumentInfo) {
    this.title = info.title;
    this.link = info.link;
    this.displaylink = info.displaylink;
    this.snippet = info.snippet;
    this.image = info.image || "";
  }
}

export class CleanSerp {
  resultados: string;
  terminos: string;
  items: number;
  start: number;
  documents: Document[];

  constructor(query: [string, string, number, number]) {
    this.resultados = query[0];
    this.terminos = query[1];
    this.items = query[2];
    this.start = query[3]; // pendiente
    this.documents = [];
  }

  set docPos(doc: Document) {
    const pos = this.documents.length;
    this.documents[pos] = doc;
  }
}

// FUNCIONES

const loadJson = (ruta: string): any => {
  return require(ruta);
};

const writeJson = (ruta: string, file: unknown): void => {
  const data = JSON.stringify(file);
  fs.writeFile(ruta, data, (err) => {
    if (err) throw err;
    console.log("escritura completa");
  });
};

// READ AND FORMAT THE SERP
export const pre_procesar = (input: string | object): Promise<CleanSerp> => {
  return new Promise((resolve) => {
    if (typeof input === "string") {
      console.log("String Received");
      let file = loadJson(input);
      file = clearJson(file);
      resolve(file);
    } else {
      console.log("Object Received");
      const file = clearJson(input);
      resolve(file);
    }
  });
};

// FUNCTION TO CLEAN JSON SERP FILE FROM GOOGLE
const clearJson = (json: any): CleanSerp => {
    // Verifica si es el nuevo formato (con propiedad 'websites')
    if (json.websites && Array.isArray(json.websites)) {
      return clearNewFormat(json);
    }
    
    // Formato antiguo (con propiedad 'items')
    return clearOldFormat(json);
  };
  
  const clearNewFormat = (json: any): CleanSerp => {
    const query: [string, string, number, number] = [
      json.totalResults?.toString() || '0',
      json.q || '',
      json.websites?.length || 0,
      json.resultsFrom || 1
    ];
  
    const objeto = new CleanSerp(query);
  
    if (json.websites && Array.isArray(json.websites)) {
      for (let i = 0; i < json.websites.length; i++) {
        const website = json.websites[i];
        
        const doc = new Document({
          title: website.title || '',
          link: website.url || website.link || '',
          displaylink: '', // Puedes extraerlo de la URL si es necesario
          snippet: website.snippet || website.description || '',
          image: website.image || ""
        });
  
        objeto.docPos = doc;
      }
    }
  
    return objeto;
  };
  
  const clearOldFormat = (json: any): CleanSerp => {
    // Tu código original para el formato antiguo
    const request = json.queries.request[0];
    const query: [string, string, number, number] = [
      json.searchInformation.formattedTotalResults,
      request.searchTerms || '',
      json.items.length,
      request.startIndex || 1,
    ];
  
    const objeto = new CleanSerp(query);
  
    for (let i = 0; i < json.items.length; i++) {
      let image: string | object = "";
      if (json.items[i].pagemap?.hasOwnProperty("cse_thumbnail")) {
        image = json.items[i].pagemap.cse_thumbnail;
      }
  
      const doc = new Document({
        title: json.items[i].title || '',
        link: json.items[i].link || '',
        displaylink: json.items[i].displaylink || '',
        snippet: json.items[i].snippet || '',
        image,
      });
  
      objeto.docPos = doc;
    }
  
    return objeto;
  };

// WRITE THE SERP IN A GIVEN PATH
export const write = (ruta: string, objeto: unknown): void => {
  fs.writeFileSync(ruta, JSON.stringify(objeto));
};
