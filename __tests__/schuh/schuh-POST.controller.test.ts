import {
    type Schuh,
    apiPath,
    createTestserver,
    host,
    httpsAgent,
    loginRest,
    port,
    shutdownTestserver,
} from '../index.js';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { HttpStatus } from '@nestjs/common';
import RE2 from 're2';

// Testdaten
const neuerSchuh: Schuh = {
    marke: 'Adidas',
    groesse: 40,
    modell: 'Alphabounce',
    farbe: 'Undye/Gum Bottom',
    erscheinungsdatum: '2017-10-20',
};

/* const falscherSchuh: Record<string, unknown> = {
    "marke": '',
    "groesse": -1,
    "modell": '',
    "farbe": '',
    "erscheinungsdatum": '',
} */

// Testfunktionen
describe('POST /api', () => {
    let client: AxiosInstance;
    const headers: Record<string, string> = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Type': 'application/json',
    };

    beforeAll(async () => {
        await createTestserver();
        const baseURL = `https://${host}:${port}/`;
        client = axios.create({
            baseURL,
            httpsAgent,
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            validateStatus: (status) => status < 500,
        });
    });

    afterAll(async () => {
        await shutdownTestserver();
    });

    test('Neuer Schuh', async () => {
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const IdRegex = new RE2('[\\dA-Fa-f]{24}', 'u');

        const response: AxiosResponse<string> = await client.post(
            apiPath,
            neuerSchuh,
            { headers },
        );
        const { status, data } = response;

        expect(status).toBe(HttpStatus.CREATED);

        const { location } = response.headers as { location: string };
        // ObjectID: Muster von HEX-Ziffern
        const indexLastSlash: number = location.lastIndexOf('/');
        const idStr = location.slice(indexLastSlash + 1);

        expect(idStr).toBeDefined();
        expect(IdRegex.test(idStr)).toBe(true);

        expect(data).toBe('');
    });
});
