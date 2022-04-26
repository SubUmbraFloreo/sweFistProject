import {
    type SchuhDocument,
    exactFilterProperties,
    modelName,
} from '../entity/index.js';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { ObjectID } from 'bson';
import { getLogger } from '../../logger/index.js';
import mongoose from 'mongoose';

/**
 * Service Klasse für das Lesen an der REST-Schnitstelle
 */
@Injectable()
export class SchuhReadService {
    readonly #schuhModel: mongoose.Model<SchuhDocument>;

    readonly #logger = getLogger(SchuhReadService.name);

    constructor(
        @InjectModel(modelName) schuhModel: mongoose.Model<SchuhDocument>,
    ) {
        this.#schuhModel = schuhModel;
    }

    /**
     * Funktion um einen Schuh anhand seiner Id zu finden
     * @param idStr Die ID als String
     * @returns Den gefundenen Schuh oder undefined
     */
    async findById(idStr: string) {
        this.#logger.debug('findById: idStr=%s', idStr);

        if (!ObjectID.isValid(idStr)) {
            this.#logger.debug('findById: Ungültige ObjectID');
            return;
        }

        const id = new ObjectID(idStr);
        const schuh = await this.#schuhModel.findById(id);
        this.#logger.debug('findById: schuh=%o', schuh);

        return schuh || undefined;
    }

    /**
     * Funktion um alle Schuhe zu finden, die ein Kriterium erfüllen
     * @param filter Das Filterkriterium nach dem gefiltert wird
     * @returns Eine Liste mit den gefundenen Schuhen, die zu den Kriterien passten
     */
    async find(filter?: mongoose.FilterQuery<SchuhDocument> | undefined) {
        this.#logger.debug('find: filter=%o', filter);

        if (filter === undefined || Object.entries(filter).length === 0) {
            return this.#findAll();
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment
        const { marke, javascript, typescript, ...dbFilter } = filter;

        if (this.#checkInvalidProperty(dbFilter)) {
            return [];
        }

        if (
            marke !== undefined &&
            marke !== null &&
            typeof marke === 'string'
        ) {
            dbFilter.marke =
                // eslint-disable-next-line security/detect-non-literal-regexp, @typescript-eslint/no-magic-numbers, security-node/non-literal-reg-expr
                marke.length < 20 ? new RegExp(marke, 'iu') : marke;
        }

        const schuhe = await this.#schuhModel.find(
            dbFilter as mongoose.FilterQuery<SchuhDocument>,
        );
        this.#logger.debug('find: schuhe=%o', schuhe);

        return schuhe;
    }

    async #findAll() {
        this.#logger.debug('#findAll');

        const schuhe = await this.#schuhModel.find().sort('marke');
        this.#logger.debug('findAll: schuhe=%o', schuhe);
        return schuhe;
    }

    #checkInvalidProperty(dbFilter: Record<string, string>) {
        const filterSchluessel = Object.keys(dbFilter);
        const result = filterSchluessel.some(
            (key) => !exactFilterProperties.includes(key),
        );
        this.#logger.debug('#checkInvalidPropertx: result=%o', result);
        return result;
    }
}
