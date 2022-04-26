import Ajv2020 from 'ajv/dist/2020.js';
import { type Schuh } from '../entity/index.js';
import { Injectable } from '@nestjs/common';
import ajvErrors from 'ajv-errors';
import formatsPlugin from 'ajv-formats';
import { getLogger } from '../../logger/index.js';
import { jsonSchema } from './jsonSchema.js';

@Injectable()
export class SchuhValidationService {
    #ajv = new Ajv2020({
        allowUnionTypes: true,
        allErrors: true,
    });

    readonly #logger = getLogger(SchuhValidationService.name);

    constructor() {
        formatsPlugin(this.#ajv, ['date', 'uri']);
        ajvErrors(this.#ajv);
    }

    /**
     * Eine Funktion zur Validierung, wenn neue Schuhe angelegt werden, oder vorhandene
     * aktualisiert werden sollen
     * @param schuh Das Schuh-Objekt
     * @returns Eine Liste mit Fehlern
     */
    validate(schuh: Schuh) {
        const validate = this.#ajv.compile<Schuh>(jsonSchema);
        validate(schuh);

        const errors = validate.errors ?? [];
        const messages = errors
            .map((error) => error.message)
            .filter((msg) => msg !== undefined);
        this.#logger.debug(
            'validate: errors=%o, messages=%o',
            errors,
            messages,
        );
        return messages as string[];
    }
}
