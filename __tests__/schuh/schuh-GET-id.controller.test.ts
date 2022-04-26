import {
    type SchuhVO,
    apiPath,
    createTestserver,
    host,
    httpsAgent,
    port,
    shutdownTestserver,
} from '../index.js';
import { afterAll, beforeAll, describe } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { HttpStatus } from '@nestjs/common';
import each from 'jest-each';

// Testdaten
const correctId = [
    '000000000000000000000001',
    '000000000000000000000002',
    '000000000000000000000003',
];

const wrongId = ['888888888888888888888888', '999999999999999999999999'];

const correctIdETag = [
    ['000000000000000000000001', '"0"'],
    ['000000000000000000000002', '"0"'],
];

// Testfunktionen
describe('GET /api/:id', () => {
    let client: AxiosInstance;

    beforeAll(async () => {
        await createTestserver();
        const baseURL = `https://${host}:${port}/${apiPath}`;
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

    each(correctId).test('Schuh zu korrekter Id %s', async (id: string) => {
        const url = `/${id}`;
        const response: AxiosResponse<SchuhVO> = await client.get(url);

        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);

        // eslint-disable-next-line no-underscore-dangle
        const selfLink = data._links.self.href;

        // eslint-disable-next-line security-node/non-literal-reg-expr
        expect(selfLink).toMatch(new RegExp(`${url}$`, 'u')); // eslint-disable-line security/detect-non-literal-regexp
    });

    each(wrongId).test('Kein Schuh zu falscher Id %s', async (id: string) => {
        const url = `/${id}`;
        const response: AxiosResponse<SchuhVO> = await client.get(url);
        const { status, data } = response;

        expect(status).toBe(HttpStatus.NOT_FOUND);
        expect(data).toMatch(/^not found$/iu);
    });

    each(correctIdETag).test(
        'Schuh mit korrekter Id %s und ETag %s',
        async (id: string, etag: string) => {
            const url = `/${id}`;
            const response: AxiosResponse<SchuhVO> = await client.get(url, {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                headers: { 'If-None-Match': etag },
            });
            const { status, data } = response;

            expect(status).toBe(HttpStatus.NOT_MODIFIED);
            expect(data).toBe('');
        },
    );
});
