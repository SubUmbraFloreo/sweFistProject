import { type GenericJsonSchema } from './GenericJsonSchema.js';

export const jsonSchema: GenericJsonSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://acme.com/schuh.json#',
    title: 'Schuh',
    description: 'Eigenschaften eines Schuhs: Typen und Constraints',
    type: 'object',
    properties: {
        _id: { type: 'object' },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        __v: {
            type: 'number',
            minimum: 0,
        },
        version: {
            type: 'number',
            minimum: 0,
        },
        marke: { type: 'string' },
        groesse: {
            type: 'number',
            minimum: 0,
        },
        modell: { type: 'string' },
        farbe: { type: 'string' },
        erscheinungsdatum: {
            type: 'string',
            format: 'date',
        },
    },

    required: [],
    additionalProperties: false,
    errorMessage: {
        properties: {
            version: 'Die Versionsnummer muss mindestens 0 sein',
            marke: 'Ein Schuh muss eine Marke haben',
            groesse: 'Ein Schuh hat eine bestimmte Größe',
            farbe: 'Ein Schuh hat eine oder meherere Farben',
            erscheinungsdatum:
                'Ein Schuh hat ein Datum, an dem er erschienen ist',
        },
    },
};
