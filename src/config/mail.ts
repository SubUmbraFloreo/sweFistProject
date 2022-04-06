import { type Options } from 'nodemailer/lib/smtp-transport';
import { env } from './env.js';

const { mailConfigEnv } = env;

// Hochschule Karlsruhe:   smtp.h-ka.de
// nullish coalescing
const host = mailConfigEnv.host ?? 'mailserver';
// HS Karlsruhe:   25
const portStr = mailConfigEnv.port ?? '5025';
const port = Number.parseInt(portStr, 10);
const loggerStr = mailConfigEnv.log;
const logger = loggerStr?.toLowerCase() === 'true';

/**
 * Konfiguration für den Mail-Client mit _nodemailer_.
 */
export const mailConfig: Options = {
    host,
    port,
    secure: false,

    // Googlemail:
    // service: 'gmail',
    // auth: {
    //     user: 'Meine.Benutzerkennung@gmail.com',
    //     pass: 'mypassword'
    // }

    priority: 'normal',
    logger,
};
Object.freeze(mailConfig);
console.info('mailConfig: %o', mailConfig);
