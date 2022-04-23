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

// Testdaten	
const neuerSchuh: Omit<Schuh, ''> = {
    "marke": 'Nike',
    "groesse": 40,
    "modell": 'Jordan 4',
    "farbe": 'Metallic Green',
    "erscheinungsdatum": '2004-07-24',
}
const correctId = '000000000000000000000001';

const SchuhNichtVorhanden: Omit<Schuh, 'erscheinungsdatum'> = {
    "marke": 'Tst',
    "groesse": 10,
    "modell": 'Alphabounce',
    "farbe": 'Undye/Gum Bottom',
}
const wrongId = '999999999999999999999999';

/* const falscherSchuh: Record<string, unknown> = {
    "marke": '',
    "groesse": -1,
    "modell": 'Test',
    "farbe": '',
    "erscheinungsdatum": '',
};
 */
const alterSchuh: Omit<Schuh, ''> = {
    "marke": 'Nike',
    "groesse": 40,
    "modell": 'Jordan 4',
    "farbe": 'Metallic Green',
    "erscheinungsdatum": '2004-07-24',
}

// Testfunktionen
describe('PUT /api/:id', () => {
    let client: AxiosInstance;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    beforeAll(async () => {
        await createTestserver();
        const baseURL = `https://${host}:${port}/`;
        client = axios.create({
            baseURL,
            httpsAgent,
            validateStatus: (status) => status < 500,
        });
    });

    afterAll(async () => {
        await shutdownTestserver();
    });

    test('Vorhandenen Schuh ändern', async () => {
        const url = `${apiPath}/${correctId}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';
        
        const response: AxiosResponse<string> = await client.put(url, neuerSchuh, { headers });
        const { status, data } = response;

        expect(status).toBe(HttpStatus.NO_CONTENT);
        expect(data).toBe('');
    });
    
    test('Nicht vorhandenen Schuh ändern', async () => {
        const url = `${apiPath}/${wrongId}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';
        
        const response: AxiosResponse<string> = await client.put(url, SchuhNichtVorhanden, { headers });
        const { status } = response;

        expect(status).toBe(HttpStatus.PRECONDITION_FAILED);
        //expect(data).toBe('');
    });

    /* test('Vorhandenen Schuh mit ungültigen Daten ändern', async () => {
        const url = `${apiPath}/${correctId}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';
        
        const response: AxiosResponse<string> = await client.put(url, falscherSchuh, { headers });
        const { status, data } = response;

        expect(status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(data).toBe(
            expect.arrayContaining([
            'Die Versionsnummer muss mindestens 0 sein',
            'Ein Schuh muss eine Marke haben',
            'Ein Schuh hat eine bestimmte Größe',
            'Ein Schuh hat eine oder meherere Farben',
            'Ein Schuh hat ein Datum, an dem er erschienen ist',
            ])
        );
    }); */

    test('Vorhandenen Schuh ohne Versionsnummer ändern', async () => {
        const url = `${apiPath}/${correctId}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        delete headers['If-Match'];

        const response: AxiosResponse<string> = await client.put(url, neuerSchuh, { headers });
        const { status, data } = response;

        expect(status).toBe(HttpStatus.PRECONDITION_REQUIRED);
        expect(data).toBe('Header mit "If-Match" fehlt');
    });

    test('Vorhandenen Schuh mit falscher Versionsnummer ändern', async () => {
        const url = `${apiPath}/${correctId}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"-1"';
        
        const response: AxiosResponse<string> = await client.put(url, alterSchuh, { headers });
        const { status, data } = response;

        expect(status).toBe(HttpStatus.PRECONDITION_FAILED);
        expect(data).toBe("Die Versionsnummer \"\"-1\"\" ist ungültig");
    });
});