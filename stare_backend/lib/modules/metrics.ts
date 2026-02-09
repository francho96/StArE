import getMetrics from '../metrics';
import { SerpResponse, MetricResult } from '../interfaces';

/**
 * Calculates metrics and attaches them to the SERP response.
 * @param {SerpResponse} serpResponse The processed SERP response.
 * @param {string[]} metrics The list of metrics to calculate.
 * @returns {Promise<SerpResponse>} The SERP response with metrics attached.
 */
export async function calculate(serpResponse: SerpResponse, metrics: string[]): Promise<SerpResponse> {
    const values: MetricResult[] = await getMetrics(serpResponse, metrics);

    for (const response of values) {
        if (serpResponse.documents && serpResponse.documents[response.index]) {
            if (typeof serpResponse.documents[response.index].metrics === 'undefined') {
                serpResponse.documents[response.index].metrics = {};
            }
            serpResponse.documents[response.index].metrics![response.name] = response.value;
        }
    }

    return serpResponse;
}

export default {
    calculate
};
