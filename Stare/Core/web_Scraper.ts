import fs from "fs/promises";
import axios from "axios";

import { promesaLimpiarArchivo } from "./HTML_Cleaner2";

/**
 * Descarga un documento HTML desde una URL y lo guarda en la carpeta docs/HTML.
 * @param url - Dirección de la página.
 * @param num - Número de documento.
 * @param output - Carpeta base donde se guardarán los archivos.
 * @returns Número del documento descargado.
 */
export async function get_HTML(
  url: string,
  num: number,
  output: string
): Promise<number> {
  const filePath = `${output}/docs/HTML/HTML${num}.txt`;

  try {
    const { data } = await axios.get<string>(url);
    await fs.writeFile(filePath, data.toString());
  } catch (err) {
    await fs.writeFile(filePath, "FAIL");
  }

  return num;
}

/**
 * Lee un documento HTML, limpia las etiquetas y guarda el resultado en docs/doc.
 * @param num - Número de documento.
 * @param output - Carpeta base donde se guardarán los archivos.
 * @returns Número del documento procesado.
 */
export async function get_Doc(num: number, output: string): Promise<number> {
  const inputPath = `${output}/docs/HTML/HTML${num}.txt`;
  const outputPath = `${output}/docs/doc/doc${num}.txt`;

  const data = await fs.readFile(inputPath, "utf-8");
  const doc = await promesaLimpiarArchivo(data);
  await fs.writeFile(outputPath, doc);

  return num;
}
