import {
    createTestserver,
    host,
    httpsAgent,
    port,
    shutdownTestserver,
} from '../index.js';
import { type GraphQLRequest, type GraphQLResponse } from 'apollo-server-types';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { HttpStatus } from '@nestjs/common';
import each from 'jest-each';

//Testdaten
const idVorhaden = [
    '000000000000000000000001',
    '000000000000000000000002',
    '000000000000000000000003',
];

//Tests
// eslint-disable-next-line max-lines-per-function
describe('GraphQL Queries', () => {
    let client: AxiosInstance;
    const graphqlPath = 'graphql';

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await createTestserver();
        const baseURL = `https://${host}:${port}/`;
        client = axios.create({
            baseURL,
            httpsAgent,
        });
    });

    afterAll(async () => {
        await shutdownTestserver();
    });

    each(idVorhaden).test('Schuh mit id %s vorhanden', async (id: string) => {
        const body: GraphQLRequest = {
            query: `
            {
                schuh(id: "${id}") {
                    marke
                    modell
                    groesse
                }
            }
        `,
        };

        const response: AxiosResponse<GraphQLResponse> = await client.post(
            graphqlPath,
            body,
        );

        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();
    });

    test('Schuh mit nicht vorhandener Id', async () => {
        const id = '000000000000000000000000';
        const body: GraphQLRequest = {
            query: `
            {
                schuh(id: "${id}") {
                    marke
                }
            }
            `,
        };
        const response: AxiosResponse<GraphQLResponse> = await client.post(
            graphqlPath,
            body,
        );

        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeDefined();
        expect(data.data).toBeDefined();
    });
});
