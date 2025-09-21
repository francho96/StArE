//*********************************************
//*********************************************
// Camila Márquez. Licence MIT.             ***
// Universidad de Santiago de Chile -USACH  ***
// Poyect Repository:                       ***
//*********************************************
//*********************************************

// imports
import express, { Request, Response } from 'express';
import cors from 'cors';
import * as stare from '../Stare/stare';
import * as ecosia from './ecosiaWebScraper';
import * as google from './google_API';
import fs from 'fs';

interface LastCall {
    q: string;
    p: number;
    call: (q: string, p: number) => Promise<any>;
    result: any;
    serpUsed: string;
}

const app = express();
let lastCall: Partial<LastCall> = {};

// Access Control
app.use(cors());
app.options('*', cors()); // con esta linea y la anterior se permite la conexion desde cualquier servidor hacia el backend

const metrics: string[] = ['length', 'ranking', 'language', 'perpiscuity'];

// FUNCTION THAT GETS THE METRICS
// RETURNS OBJECT WITH THE STANDARD JSON OBJECT
app.get('/json', function(req: Request, res: Response) {
    // Metrics Solicitud
    stare.get_Metrics(...metrics);
    // Document is an Object of Type "Documents", Defined.
    const Json: string = stare.get_Json();

    // Send the Doc to the url
    res.send(Json);
});

// GET THE ACTUAL STATE OF THE OBJECT
app.get('/update', function(req: Request, res: Response) {
    // get the actual state of the Object
    const Json: string = stare.get_Json();
    res.send(Json);
});

// GET THE ECOSIA SERP
// SET THE SERP TO THE PREPARATION IN STARE
app.get('/ecosia', function(req: Request, res: Response) {
    stare.reset();
    lastCall = {};
    const q: string = req.query.q as string;
    const p: number = parseInt(req.query.p as string) || 0;
    
    ecosiaCall(q, p).then(result => {
        // Document is an Object of Type "Documents", Defined.
        stare.prepareSerp('ecosia_serp', result)
            .then(function(result) {
                console.log("Result is: " + result);
                const Json: string = stare.get_Json();
                res.send(Json);
            })
            .catch(error => {
                console.error("Error preparing SERP:", error);
                res.status(500).send("Error processing request");
            });
    })
    .catch(error => {
        console.error("Error in ecosiaCall:", error);
        res.status(500).send("Error processing request");
    });
});

// GET THE GOOGLE SERP
// SEND THE SERP TO THE PREPARATION IN STARE
app.get('/google', function(req: Request, res: Response) {
    stare.reset();
    const q: string = req.query.q as string;
    const p: number = parseInt(req.query.p as string) || 0;
    lastCall = {};
    
    googleCall(q, p).then(result => {
        // Document is an Object of Type "Documents", Defined.
        stare.prepareSerp('google_serp', result)
            .then(function(result) {
                console.log("Result is: " + result);
                const Json: string = stare.get_Json();
                res.send(Json);
            })
            .catch(error => {
                console.error("Error preparing SERP:", error);
                res.status(500).send("Error processing request");
            });
    })
    .catch(error => {
        console.error("Error in googleCall:", error);
        res.status(500).send("Error processing request");
    });
});

// GET MORE DOCUMENTS
app.get('/moreDocuments', function(req: Request, res: Response) {
    if (!lastCall.q || !lastCall.call || !lastCall.result || !lastCall.serpUsed) {
        res.status(400).send("No previous call found");
        return;
    }

    const q: string = lastCall.q;
    const p: number = lastCall.p ?? 0 + 1;
    const call: (q: string, p: number) => Promise<any> = lastCall.call;
    const oldResults: any = lastCall.result;
    const serpUsed: string = lastCall.serpUsed;
    
    call(q, p).then(result => {
        stare.reset();
        const newResult = mergeObjects(result, oldResults);
        console.log('lastCall:' + JSON.stringify(lastCall));
        lastCall = { q, p, call, result: newResult, serpUsed };
        stare.prepareSerp(serpUsed, newResult)
            .then(function(result) {
                stare.get_Metrics(...metrics);
                res.send(result);
            })
            .catch(error => {
                console.error("Error preparing SERP:", error);
                res.status(500).send("Error processing request");
            });
    })
    .catch(error => {
        console.error("Error in call:", error);
        res.status(500).send("Error processing request");
    });
});

// SUPPORT FUNCTIONS
const ecosiaCall = (q: string = '', p: number = 0): Promise<any> => {
    return new Promise(function(resolve, reject) {
        ecosia.scrap(q, p).then(
            function(result) {
                lastCall = {
                    q, p, call: ecosiaCall, result, serpUsed: 'ecosia_serp'
                };
                if (result) {
                    resolve(result);
                } else {
                    reject(new Error("No result from ecosia"));
                }
            }
        ).catch(reject);
    });
};

const googleCall = (q: string = '', p: number = 0): Promise<any> => {
    return new Promise(function(resolve, reject) {
        const apiKey = 'AIzaSyCmGpofWrPxQT-KrJnoArXaas0zOADXikA';
        const cx = '010212477578150644501:wtqrloafnss';
        const options = { q, cx, apiKey };
        
        google.runSample(options, p).then(
            function(result) {
                if (result) {
                    lastCall = {
                        q, p, call: googleCall, result, serpUsed: 'google_serp'
                    };
                    resolve(result);
                } else {
                    reject(new Error("No result from google"));
                }
            }
        ).catch(reject);
    });
};

const mergeObjects = (target: any, source: any): any => {
    if (!target || typeof target !== 'object') return source;
    if (!source || typeof source !== 'object') return target;

    Object.keys(source).forEach((key) => {
        const sourceValue = source[key];
        const targetValue = target[key];
        console.log(key);
        
        if (key == 'currentResults') {
            target[key] = targetValue + sourceValue;
        } else if (key == 'resultsFrom') {
            target[key] = sourceValue;
        } else if (key == 'resultsTo') {
            target[key] = targetValue;
        } else if (key == 'currentPage') {
            target[key] = targetValue;
        } else if (key == 'request') {
            target[key] = mergeObjects(targetValue, sourceValue);
        } else {
            target[key] = mergeValues(targetValue, sourceValue);
        }
    });
    return target;
};

const mergeArrays = (target: any[], source: any[]): any[] => {
    return [...target, ...source];
};

const mergeValues = (target: any, source: any): any => {
    if (Array.isArray(target) && Array.isArray(source)) {
        return mergeArrays(target, source);
    }
    if (target !== null && typeof target === 'object' && source !== null && typeof source === 'object') {
        return mergeObjects(target, source);
    }
    if (source === undefined) {
        return target;
    }
    return source;
};

const PORT = 3000;
app.listen(PORT, function() {
    console.log('I\'m the backend!');
    console.log(`Example app listening on port ${PORT}!`);
});

export default app;