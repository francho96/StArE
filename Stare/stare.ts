//*********************************************
//*********************************************
// Camila Márquez. Licence MIT.             ***
// Universidad de Santiago de Chile -USACH  ***
// Poyect Repository:                       ***
//*********************************************
//*********************************************

import * as path from 'path';
import * as web_scraper from './Core/web_Scraper';

interface Document {
    link: string;
    [key: string]: any;
}

interface SerpObject {
    documents: Document[];
    items: number;
    [key: string]: any;
}

interface Metric {
    use_SERP: () => boolean;
    use_DOC: () => boolean;
    use_HTML: () => boolean;
    get_value: (input: any, index?: number) => Promise<any[]>;
}

const output: string = __dirname;
let serp_manager: any;
let json_object: SerpObject | null = null;

// STEP 1: VALIDATE IF INPUT IS A VALID PATH/URL
function ValidURL(str: string): boolean {
    if (str !== "") {
        const regex = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;
        return regex.test(str);
    }
    return false;
}

// THIS FUNCTION PREPARES THE JSON AND TRANSFORM IT TO STANDARD FORM
const prepareSerp = function (serp_type: string, input: string | object): Promise<SerpObject> {
    return new Promise(function (resolve, reject) {
        if (typeof input === "string") {
            if (ValidURL(input)) {
                serp_manager = require('./Serp_Process/' + serp_type);
                serp_manager.pre_procesar(input)
                    .then(function (json: SerpObject) {
                        json_object = json;
                        resolve(json_object);
                    })
                    .catch(function (error: any) {
                        reject(error);
                    });
            } else {
                reject(new Error("Invalid URL"));
            }
        } else {
            serp_manager = require('./Serp_Process/' + serp_type);
            serp_manager.pre_procesar(input)
                .then(function (json: SerpObject) {
                    json_object = json;
                    resolve(json_object);
                })
                .catch(function (error: any) {
                    reject(error);
                });
        }
    });
};

// STEP 2: DOWNLOAD DOCUMENTS
const get_Document = function (num: number): Promise<number> {
    return new Promise(function (resolve, reject) {
        if (!json_object || !json_object.documents || !json_object.documents[num]) {
            reject(new Error("Invalid document index or JSON object not initialized"));
            return;
        }

        web_scraper.get_HTML(json_object.documents[num].link, num, output)
            .then(function (docNum: number) {
                return web_scraper.get_Doc(docNum, output);
            })
            .then(function (docNum: number) {
                resolve(docNum);
            })
            .catch(function (error: any) {
                reject(error);
            });
    });
};

// ONLY DOWNLOAD HTML's
const get_HTML = function (num: number): Promise<number> {
    return new Promise(function (resolve, reject) {
        if (!json_object || !json_object.documents || !json_object.documents[num]) {
            reject(new Error("Invalid document index or JSON object not initialized"));
            return;
        }

        web_scraper.get_HTML(json_object.documents[num].link, num, output)
            .then(function (docNum: number) {
                console.log("Document " + docNum + " is downloaded!");
                resolve(docNum);
            })
            .catch(function (error: any) {
                reject(error);
            });
    });
};

// STEP 3: GET THE METRICS!
let html: boolean = false;
let documentNeeded: boolean = false;
let serp: boolean = false;
let metric: Metric[] = [];

// FUNCTION THAT GET THE METRICS
const get_Metrics = async function (...metricsNames: string[]): Promise<boolean> {
    console.log('tengo ' + metricsNames.length + ' métricas que calcular');

    if (!json_object || !json_object.documents) {
        console.log("JSON object not initialized");
        return false;
    }

    metricsNames.forEach((metricName, i) => {
        try {
            metric[i] = require('./Metrics/' + metricName + '.ts') as Metric;

            if (metric[i].use_SERP()) serp = true;
            if (metric[i].use_DOC()) documentNeeded = true;
            if (metric[i].use_HTML()) html = true;

            json_object!.documents.forEach(doc => {
                doc[metricName] = 1;
            });
        } catch (error) {
            console.error(`Error loading metric ${metricName}:`, error);
        }
    });

    // CASE 1: ONLY SERP
    if (!documentNeeded && !html) {
        console.log("No Download Needed");

        const promises: Promise<any>[] = [];

        metricsNames.forEach((metricName, j) => {
            if (metric[j]) {
                json_object!.documents.forEach((doc, index) => {
                    const p = metric[j].get_value(json_object, index)
                        .then(values => {
                            const nombre = values[1];
                            json_object!.documents[values[2]][nombre] = values[0];
                        })
                        .catch(err => console.error("Error getting metric:", err));

                    promises.push(p);
                });
            }
        });

        await Promise.all(promises);
        return true;
    }

    // CASE 2: ONLY HTML INFO
    if (html && !documentNeeded) {
        console.log("no cleaning needed");

        const promises = json_object.documents.map(async (_, index) => {
            try {
                const result = await get_HTML(index);
                if (!result) throw new Error("HTML fetch failed");

                await Promise.all(metricsNames.map(async (metricName, j) => {
                    if (!metric[j]) return;

                    if (metric[j].use_HTML()) {
                        const values = await metric[j].get_value(output + `/docs/HTML/HTML${result}.txt`, result);
                        json_object!.documents[values[2]][values[1]] = values[0];
                    } else {
                        const values = await metric[j].get_value(json_object, result);
                        json_object!.documents[values[2]][values[1]] = values[0];
                    }
                }));
            } catch (err) {
                console.error("Error processing HTML metric:", err);
            }
        });

        await Promise.all(promises);
        return true;
    }

    // ASE 3: DOCUMENTS ARE NEEDED
    console.log("all is needed");

    const docPromises = json_object.documents.map(async (_, index) => {
        try {
            const result = await get_Document(index);
            if (!result) throw new Error("Document fetch failed");

            console.log("html ready");

            await Promise.all(metricsNames.map(async (metricName, x) => {
                if (!metric[x]) return;

                try {
                    let values;
                    if (metric[x].use_DOC()) {
                        values = await metric[x].get_value(output + `/docs/doc/doc${result}.txt`, result);
                    } else if (metric[x].use_HTML()) {
                        values = await metric[x].get_value(output + `/docs/HTML/HTML${result}.txt`, result);
                    } else {
                        values = await metric[x].get_value(json_object, result);
                    }

                    json_object!.documents[values[2]][values[1]] = values[0];
                } catch (err) {
                    console.error(`Error processing metric ${metricName} for document ${result}:`, err);
                    json_object!.documents[result][metricName] = null;
                }
            }));

        } catch (err) {
            console.error("Error processing DOC metric:", err);
        }
    });

    await Promise.all(docPromises);
    return true;
};


// GET NUMBER OF ITEMS
const get_Items = function (): number {
    return json_object ? json_object.items : 0;
};

// GET JSON
const get_Json = function (): string {
    return json_object ? JSON.stringify(json_object) : "{}";
};

const reset = function (): void {
    json_object = null;
};

export {
    get_Items,
    get_Json,
    prepareSerp,
    get_Metrics,
    reset,
    SerpObject,
    Document
};