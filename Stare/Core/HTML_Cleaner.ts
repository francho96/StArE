// No se usa realmente fs así que se eliminara.
// si se llegaran a necesitar, se traen de manera tipada.

// AUX FUNCTIONS

/**
 * Elimina comentarios <!-- ... --> de un HTML.
 * @param html - string con HTML.
 * @returns HTML con sin comentarios.
 */
async function removeComments(html: string): Promise<string> {
    let archivo = html.toLowerCase();
    let start = 0;
    let end = 0;

    while (start !== -1) {
        if (start !== 0) start = start + 1;
        start = archivo.indexOf("<!--", start);
        if (start !== -1) {
            end = archivo.indexOf("-->", start);
            archivo = archivo.substring(0, start) + archivo.substring(end + 3);
        }
    }

    return archivo;
}

/**
* Extrae el texto entre etiquetas de bloque (p, h1, h2, title, etc.).
* @param html - string con HTML.
* @returns HTML con sin etiquetas de bloque.
*/
async function extractTextTags(html: string): Promise<string> {
    let archivo = html.toLowerCase();

    const openTags = [
        "<p>",
        "<h1>",
        "<h2>",
        "<h3>",
        "<h4>",
        "<h5>",
        "<h6>",
        "<h7>",
        "<title>",
        "<p ",
        "<h1 ",
        "<h2 ",
        "<h3 ",
        "<h4 ",
        "<h5 ",
        "<h6 ",
        "<h7 ",
        "<title ",
    ];

    const closeTags = [
        "</p",
        "</h1",
        "</h2",
        "</h3",
        "</h4",
        "</h5",
        "</h6",
        "</h7",
        "</title",
    ];

    let cleanText = "";
    let start = 0;
    let end = 0;
    let cierre = 0;

    while (start !== -1) {
        if (start !== 0) start = start + 1;

        let next = Number.MAX_SAFE_INTEGER;
        let tag = -1;

        for (let k = 0; k < openTags.length; k++) {
            const aux = archivo.indexOf(openTags[k], start);
            if (aux >= 0 && aux < next) {
                tag = k;
                next = aux;
            }
        }

        if (tag !== -1) {
            if (tag > 8) tag = tag - 9;
            start = next;
            cierre = archivo.indexOf(">", start) + 1;
            end = archivo.indexOf(closeTags[tag], start);

            if (end - 500 > cierre) {
                end = cierre + 500;
            }

            cleanText += archivo.substring(cierre, end) + "\n";
        } else {
            start = -1;
        }
    }

    return cleanText;
}

/**
* Elimina etiquetas inline como <a>, <b>, <span>, etc.
* @param html - string con HTML.
* @returns HTML con sin etiquetas inline.
*/
async function removeInlineTags(html: string): Promise<string> {
    let archivo = html.toLowerCase();

    const tags = [
        "<a>",
        "<bloquote>",
        "<q>",
        "<sup>",
        "<sub>",
        "<pre>",
        "<del>",
        "<cite>",
        "<dfn>",
        "<acronym>",
        "<abbr>",
        "<samp>",
        "<kbd>",
        "<var>",
        "<ins>",
        "<li> ",
        "<ul>",
        "<img>",
        "<strong>",
        "<label>",
        "<a ",
        "<bloquote ",
        "<q ",
        "<sup ",
        "<sub ",
        "<pre ",
        "<del ",
        "<cite ",
        "<dfn ",
        "<acronym ",
        "<abbr ",
        "<samp ",
        "<kbd ",
        "<var ",
        "<ins ",
        "<li ",
        "<ul ",
        "<img ",
        "<strong ",
        "<label ",
        "</a",
        "</bloquote",
        "</q",
        "</sup",
        "</sub",
        "</pre",
        "</del",
        "</cite",
        "</dfn",
        "</acronym",
        "</abbr",
        "</samp",
        "</kbd",
        "</var",
        "</ins",
        "</li ",
        "</ul",
        "</img",
        "</strong",
        "</label",
        "<span>",
        "<span ",
        "</span",
        "<br",
        "<br>",
        "</br",
        "<small ",
        "</small",
        "<small>",
        "<input ",
        "<ifame ",
        "</iframe",
        "<iframe ",
        "<textarea ",
        "</textarea",
        "<textarea>",
        "<b>",
        "</b",
        "<b ",
        "<code ",
        "<code>",
        "</code>",
        "<em ",
        "<em>",
        "</em",
        "<button ",
        "</button",
        "<button>",
        "<i ",
        "</i",
        "<i>",
    ];

    let texto = archivo;
    let largo = archivo.length;

    for (const tag of tags) {
        let start = 0;
        while (start !== -1 && start <= largo) {
            start = start + 1;
            start = texto.indexOf(tag, start);

            if (start !== -1) {
                const cierre = texto.indexOf(">", start);
                texto = texto.substring(0, start) + texto.substring(cierre + 1);

                if (texto.length < largo) {
                    largo = texto.length;
                    archivo = texto;
                }
            }
        }
    }

    return archivo;
}

/**
 * Encadena las funciones para limpiar HTML.
* @param input - string con HTML.
* @returns HTML limpio.
 */
async function getTextFromHtml(input: string): Promise<string> {
    const noComments = await removeComments(input);
    const extracted = await extractTextTags(noComments);
    const clean = await removeInlineTags(extracted);
    return clean;
}

/**
 * Limpia un archivo HTML eliminando tags y dejando solo el texto.
 * * @param archivo - string con HTML.
* @returns HTML limpio.
 */
export async function promesaLimpiarArchivo(archivo: string): Promise<string> {
    const cleaned = await getTextFromHtml(archivo);
    return cleaned.replace(/(<([^>]+)>)/g, "");
}
