import { type PrettyOptions } from 'pino-pretty';
import { env } from './env.js';
import pino from 'pino';
import { resolve } from 'node:path';

/**
 * Das Modul enthält die Konfiguration für den Logger mit _Winston_ sowie
 * die Request-Protokollierung mit _Morgan_.
 * @packageDocumentation
 */

const logDirDefault = 'log';
const logFileNameDefault = 'server.log';
const logFileDefault = resolve(logDirDefault, logFileNameDefault);

const { logConfigEnv, nodeConfigEnv } = env;

// https://getpino.io
// Log-Levels: fatal, error, warn, info, debug, trace
// Alternativen: Winston, log4js, Bunyan
// https://blog.appsignal.com/2021/09/01/best-practices-for-logging-in-nodejs.html

const { nodeEnv } = nodeConfigEnv;
const production = nodeEnv === 'production' || nodeEnv === 'PRODUCTION';
let { logLevel } = logConfigEnv;
if (logLevel === undefined) {
    logLevel = production ? 'info' : 'debug';
}

const { logDir, pretty, def } = logConfigEnv;
const logFile =
    logDir === undefined ? logFileDefault : resolve(logDir, logFileNameDefault);
console.log(
    `loggerConfig: logLevel=${logLevel}, logFile=${logFile}, pretty=${pretty}, def=${def}`, // eslint-disable-line security-node/detect-crlf
);

const fileOptions = {
    level: logLevel,
    target: 'pino/file',
    options: { destination: logFile },
};
const prettyOptions: PrettyOptions = {
    translateTime: 'SYS:standard',
    singleLine: true,
    colorize: true,
    ignore: 'pid,hostname',
};
const prettyTransportOptions = {
    level: logLevel,
    target: 'pino-pretty',
    options: prettyOptions,
};

const options: pino.TransportMultiOptions | pino.TransportSingleOptions = pretty
    ? {
          targets: [fileOptions, prettyTransportOptions],
      }
    : {
          targets: [fileOptions],
      };
const transports = pino.transport(options); // eslint-disable-line @typescript-eslint/no-unsafe-assignment

// https://github.com/pinojs/pino/issues/1160#issuecomment-944081187
export const parentLogger = def
    ? pino(pino.destination(logFileDefault))
    : pino({ level: logLevel }, transports); // eslint-disable-line @typescript-eslint/no-unsafe-argument
