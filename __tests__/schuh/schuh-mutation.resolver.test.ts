import { type GraphQLRequest, type GraphQLResponse } from 'apollo-server-types';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    createTestserver,
    host,
    httpsAgent,
    loginGraphQL,
    port,
    shutdownTestserver,
} from '../index.js';
import { HttpStatus } from '@nestjs/common';
import RE2 from 're2';

//Testdaten
const objectIdRegexp = new RE2('[\\dA-Fa-f]{24}', 'u');

//Tests
// eslint-disable-next-line max-lines-per-function
describe('GraphQL Muations', () => {
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

    test('Neuer Schuh', async () => {
        const token = await loginGraphQL(client);
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const authorization = { Authorization: `Bearer ${token}` };
        const body: GraphQLRequest = {
            query: `
                mutation {
                    create(
                        marke: "Testmarke",
                        modell: "Testmodell",
                        groesse: 40,
                        farbe: "Testfarbe",
                        erscheinungsdatum: "2020-01-01",
                    )
                }
                `,
        };

        const response: AxiosResponse<GraphQLResponse> = await client.post(
            graphqlPath,
            body,
            { headers: authorization },
        );

        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data).toBeDefined();

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const { create } = data.data!;

        // Der Wert der Mutation ist die generierte ObjectID
        expect(create).toBeDefined();
        expect(objectIdRegexp.test(create as string)).toBe(true);
    });

    test('Schuh aktualisieren', async () => {
        const token = await loginGraphQL(client);
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const authorization = { Authorization: `Bearer ${token}` };
        const body: GraphQLRequest = {
            query: `
                mutation {
                    update(
                        id: "000000000000000000000002",
                        version: 0,
                        schuh: {
                            groesse: 10
                        }
                    )   
                }
                `,
        };

        const response: AxiosResponse<GraphQLResponse> = await client.post(
            graphqlPath,
            body,
            { headers: authorization },
        );

        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const { update } = data.data!;

        // Der Wert der Mutation ist die neue Versionsnummer
        expect(update).toBe(1);
    });
});
