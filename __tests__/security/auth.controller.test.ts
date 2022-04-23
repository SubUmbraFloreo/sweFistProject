import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    createTestserver,
    host,
    httpsAgent,
    loginPath,
    port,
    shutdownTestserver,
} from '../index.js';
import { HttpStatus } from '@nestjs/common';
import dotenv from 'dotenv';
import each from 'jest-each';

dotenv.config();
const { env } = process;
const { USER_PASSWORD, USER_PASSWORD_FALSCH } = env;

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const username = 'admin';
const password = USER_PASSWORD;
const passwordFalsch = [USER_PASSWORD_FALSCH, USER_PASSWORD_FALSCH];

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('REST-Schnittstelle /api/login', () => {
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

    test('Login mit korrektem Passwort', async () => {
        // given
        const body = `username=${username}&password=${password}`;

        // when
        const response: AxiosResponse<{ token: string }> = await client.post(
            loginPath,
            body,
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.OK);

        const { token } = data;
        const tokenParts = token.split('.');

        expect(tokenParts).toHaveLength(3); // eslint-disable-line @typescript-eslint/no-magic-numbers
        expect(token).toMatch(/^[a-z\d]+\.[a-z\d]+\.[\w-]+$/iu);
    });

    each(passwordFalsch).test(
        'Login mit falschem Passwort',
        async (pwd: string) => {
            // given
            const body = `username=${username}&password=${pwd}`;

            // when
            const response: AxiosResponse<Record<string, any>> =
                await client.post(loginPath, body);

            // then
            const { status, data } = response;

            expect(status).toBe(HttpStatus.UNAUTHORIZED);
            expect(data.statusCode).toBe(HttpStatus.UNAUTHORIZED);
            expect(data.message).toMatch(/^Unauthorized$/iu);
        },
    );

    test('Login ohne Benutzerkennung', async () => {
        // given
        const body = '';

        // when
        const response: AxiosResponse<Record<string, any>> = await client.post(
            loginPath,
            body,
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.UNAUTHORIZED);
        expect(data.statusCode).toBe(HttpStatus.UNAUTHORIZED);
        expect(data.message).toMatch(/^Unauthorized$/iu);
    });
});
