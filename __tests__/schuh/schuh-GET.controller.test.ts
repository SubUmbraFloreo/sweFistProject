/* eslint-disable max-lines-per-function */
import {
    type SchuheVO,
    apiPath,
    createTestserver,
    host,
    httpsAgent,
    port,
    shutdownTestserver,
} from '../index.js';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { HttpStatus } from '@nestjs/common';
import each from 'jest-each';

// Testdaten
const correctBrand = ['Nike', 'Adidas', 'New Balance'];

const wrongBrand = ['Foo', 'Bar', 'Baz'];

// Testfunktionen
describe('GET /api', () => {
    let client: AxiosInstance;

    beforeAll(async () => {
        await createTestserver();
        const baseURL = `https://${host}:${port}/`;
        client = axios.create({
            baseURL,
            httpsAgent,
            validateStatus: () => true,
        });
    });

    afterAll(async () => {
        await shutdownTestserver();
    });

    test('Alle Schuhe', async () => {
        const response: AxiosResponse<SchuheVO> = await client.get(apiPath);

        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        // eslint-disable-next-line no-underscore-dangle
        const { schuhe } = data._embedded;

        schuhe
            // eslint-disable-next-line no-underscore-dangle
            .map((schuh) => schuh._links.self.href)
            .forEach((selfLink) => {
                expect(selfLink).toEqual(
                    expect.stringContaining(`/${apiPath}/`),
                );
            });
    });

    each(correctBrand).test(
        'Schuh, der die Marke %s hat',
        async (brand: string) => {
            const params = { marke: brand };

            const response: AxiosResponse<SchuheVO> = await client.get(
                apiPath,
                { params },
            );
            const { status, headers, data } = response;

            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            expect(data).toBeDefined();

            // eslint-disable-next-line no-underscore-dangle
            const { schuhe } = data._embedded;

            schuhe
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                .map((schuh) => schuh.marke!)
                .forEach((marke: string) => expect(marke).toEqual(brand));
        },
    );

    each(wrongBrand).test(
        'Kein Schuh, der die Marke %s hat',
        async (brand: string) => {
            const params = { marke: brand };

            const response: AxiosResponse<SchuheVO> = await client.get(
                apiPath,
                { params },
            );
            const { status, data } = response;

            expect(status).toBe(HttpStatus.NOT_FOUND);
            expect(data).toMatch(/^not found$/iu);
        },
    );
});
/* eslint-enable max-lines-per-function */
