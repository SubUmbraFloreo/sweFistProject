import { afterAll, beforeAll, describe, test } from '@jest/globals';
import {
    apiPath,
    createTestserver,
    host,
    httpsAgent,
    loginRest,
    port,
    shutdownTestserver,
} from '../index.js';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { HttpStatus } from '@nestjs/common';

// Testdaten
const id = '000000000000000000000006';

// Testfunktionen
describe('DELETE /api/schuhe', () => {
    let client: AxiosInstance;

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await createTestserver();
        const baseURL = `https://${host}:${port}/`;
        client = axios.create({
            baseURL,
            httpsAgent,
            validateStatus: (status) => status < 500, // eslint-disable-line @typescript-eslint/no-magic-numbers
        });
    });

    afterAll(async () => {
        await shutdownTestserver();
    });

    test('Vorhandenen Schuh löschen', async () => {
        const url = `${apiPath}/${id}`;
        const tokn = await loginRest(client);
        const headers = { Authorization: `Bearer ${tokn}` }; // eslint-disable-line @typescript-eslint/naming-convention

        const response: AxiosResponse<string> = await client.delete(url, {
            headers,
        });

        const { status, data } = response;

        expect(status).toBe(HttpStatus.NO_CONTENT);
        expect(data).toBeDefined();
    });

    test('Vorhandenen Schuh ohne Token löschen', async () => {
        const url = `${apiPath}/${id}`;
        const response: AxiosResponse<Record<string, any>> =
            await client.delete(url);
        const { status, data } = response;

        expect(status).toBe(HttpStatus.FORBIDDEN);
        expect(data.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
});
