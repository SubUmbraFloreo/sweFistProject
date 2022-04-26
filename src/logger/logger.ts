import { type SonicBoom } from 'sonic-boom';
import { parentLogger } from '../config/index.js';
import type pino from 'pino';

/**
 * Eine-Klasse, um ein Logger-Objekt von `Pino` zu erzeugen,     so dass ein
 * _Kontext_ definiert wird, der bei jeder Log-Methode verwendet wird und i.a.
 * der Name einer eigenen Klasse ist.
 * @param context Der Kontext
 * @param kind i.a. `class`
 */
// (context: string, kind = 'class') => pino.Logger<SonicBoom & pino.ChildLoggerOptions>
export const getLogger: (
    context: string,
    kind?: string,
) => pino.Logger<pino.ChildLoggerOptions & SonicBoom> = (
    context: string,
    kind = 'class',
) => {
    const bindings: Record<string, string> = {};
    // "indexed access" auf eine Property, deren Name als Wert im Argument "kind" uebergeben wird
    // eslint-disable-next-line security/detect-object-injection
    bindings[kind] = context;
    // https://getpino.io/#/docs/child-loggers
    return parentLogger.child(bindings);
};
