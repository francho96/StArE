import fs from "fs";
import { promisify } from "util";

// Archivo por comentar

const writeFile = promisify(fs.writeFile);

export class Document {
  title: string;
  link: string;
  displaylink: string;
  snippet: string;
  image: string;

  constructor(info: [string, string, string, string, string?]) {
    this.title = info[0];
    this.link = info[1];
    this.displaylink = info[2];
    this.snippet = info[3];
    this.image = info[4] || "";
  }
}


export class CleanSerp {
  resultados: number;
  terminos: string;
  items: number;
  start: number;
  documents: Document[] = [];

  constructor(query: [number, string, number, number]) {
    this.resultados = query[0];
    this.terminos = query[1];
    this.items = query[2];
    this.start = query[3];
  }

  set docPos(doc: Document) {
    this.documents.push(doc);
  }
}

function loadJson<T = any>(ruta: string): T {
  return require(ruta) as T;
}

async function writeJson(ruta: string, file: unknown): Promise<void> {
  const content = JSON.stringify(file, null, 2);
  await writeFile(ruta, content, "utf-8");
  console.log("Escritura completa");
}

function clearJson(json: any): CleanSerp {
  const query: [number, string, number, number] = [
    json.totalResults,
    json.q,
    json.currentResults,
    json.currentPage * json.currentResults,
  ];

  const objeto = new CleanSerp(query);

  for (let i = 0; i < query[2]; i++) {
    const doc = new Document([
      json.websites[i].title,
      json.websites[i].url,
      json.websites[i].url,
      json.websites[i].description,
      "",
    ]);
    objeto.docPos = doc;
  }

  return objeto;
}

export async function pre_procesar(
  input: string | object
): Promise<CleanSerp> {
  if (typeof input === "string") {
    console.log("📂 Leyendo Path");
    const file = loadJson(input);
    return clearJson(file);
  } else {
    console.log("✅ Tenemos un Json en memoria");
    return clearJson(input);
  }
}

export function write(ruta: string, objeto: CleanSerp): void {
  fs.writeFileSync(ruta, JSON.stringify(objeto, null, 2), "utf-8");
}

export { writeJson };
