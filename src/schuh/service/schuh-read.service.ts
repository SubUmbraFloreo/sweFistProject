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

@Injectable()
export class SchuhReadService {
    readonly #schuhModel: mongoose.Model<SchuhDocument>;
    readonly #logger = getLogger(SchuhReadService.name);

    constructor(
        @InjectModel(modelName) schuhModel: mongoose.Model<SchuhDocument>,
    ) {
        this.#schuhModel = schuhModel;
    }

    async findById(idStr: string) {
        this.#logger.debug('findById: idStr=%s', idStr);

        if (!ObjectID.isValid(idStr)) {
            this.#logger.debug('findById: Ungültige ObjectID');
            return undefined;
        }

        const id = new ObjectID(idStr);
        const schuh = await this.#schuhModel.findById(id);
        this.#logger.debug('findById: schuh=%o', schuh);

        return schuh || undefined;
    }

    async find(filter?: mongoose.FilterQuery<SchuhDocument> | undefined) {
        this.#logger.debug('find: filter=%o', filter);

        if (filter === undefined || Object.entries(filter).length === 0) {
            return this.#findAll();
        }

        const { marke, javascript, typescript,...dbFilter } = filter;

        if (this.#checkInvalidProperty(dbFilter)) {
            return [];
        }

        if (
            marke !== undefined &&
            marke !== null &&
            typeof marke === 'string'
        ) {
            dbFilter.marke =
                marke.length < 20
                    ? new RegExp(marke, 'iu')
                    : marke;
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