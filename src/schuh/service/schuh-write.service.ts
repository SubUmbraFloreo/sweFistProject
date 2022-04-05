import { type Schuh, type SchuhDocument, modelName } from '../entity/schuh';
import {
    type SchuhNotExists,
    type CreateError,
    type UpdateError,
    type VersionInvalid,
    type VersionOutdated,
} from './errors';
import { SchuhValidationService } from './schuh-validation.service';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { ObjectID } from 'bson';
import RE2 from 're2';
import { getLogger } from '../../logger/index.js';
import mongoose from 'mongoose';

/**
 * Die Klasse implementiert die Anwendungsschicht zum Schreiben von Schuh Daten und greift
 * auf Mongoose zu
 */
@Injectable()
export class SchuhWriteService {
    private static readonly UPDATE_OPTIONS: mongoose.QueryOptions = {
        new: true,
    };

    private static readonly VERSION_PATTERN = new RE2('^"\\d*"');

    readonly #schuhModel: mongoose.Model<SchuhDocument>;
    readonly #validationService: SchuhValidationService;
    readonly #logger = getLogger(SchuhWriteService.name);

    constructor(
        @InjectModel(modelName) schuhModel: mongoose.Model<SchuhDocument>,
        validationService: SchuhValidationService,
    ) {
        this.#schuhModel = schuhModel;
        this.#validationService = validationService;
    }

    /**
     * Einen neuen Schuh in der Datenbank anlegen
     * @param schuh Der Schuh, der in die Datenbank geschrieben werden soll
     * @returns Die Id des Schuhs, falls erfolgreich
     */
    async create(schuh: Schuh): Promise<CreateError | ObjectID> {
        this.#logger.debug('create: schuh=%o', schuh);
        const validateResult = await this.#validateCreate(schuh);
        if (validateResult !== undefined) {
            return validateResult;
        }

        const schuhDocument = new this.#schuhModel(schuh);
        const saved = await schuhDocument.save();
        const id = saved.id as ObjectID;

        this.#logger.debug('create: schuh=%o, id=%s', schuh, id);
        return id;
    }

    /**
     * Einen vorhandenen Schuh in der Datenbank aktualisieren
     * @param schuh Der zu aktualisierende Schuh
     * @param id Die Id des Schuhs
     * @param version Die Version des Schuhs für die optimistische Synchronisation
     * @returns Die neue Versionsnummer des Schuhs, falls erfolgreich
     */
    async update(
        id: string,
        schuh: Schuh,
        version: string,
    ): Promise<UpdateError | number> {
        this.#logger.debug(
            'update: id=%s, schuh=%o, version=%s',
            id,
            schuh,
            version,
        );
        if (!ObjectID.isValid(id)) {
            this.#logger.debug('update: id=%s is not valid', id);
            return { type: 'SchuhNotExists', id}
        }

        const validateResult = await this.#validateUpdate(schuh, id, version);
        if (validateResult !== undefined) {
            return validateResult;
        }

        const options = SchuhWriteService.UPDATE_OPTIONS;
        const updated = await this.#schuhModel.findByIdAndUpdate(
            new ObjectID(id),
            schuh,
            options,
        );
        if (updated === null) {
            this.#logger.debug('update: schuh=%o not found', schuh);
            return { type: 'SchuhNotExists', id };
        }

        const newVersion = updated.__v as number;
        this.#logger.debug('update: versionUpdated=%d', newVersion);

        return newVersion;
    }

    /**
     * Ein Schuh wird mit seiner Id aus der Datenbank gelöscht
     * @param id Die Id des Schuhs
     * @returns true, falls erfolgreich, sonst false
     */
    async delete(id: string) {
        this.#logger.debug('delete: id=%s', id);
        if (!ObjectID.isValid(id)) {
            this.#logger.debug('delete: id=%s is not valid', id);
            return false;
        }

        const deleted = await this.#schuhModel
            .findByIdAndDelete(new ObjectID(id))
            .lean<Schuh | null>();
        this.#logger.debug('delete: deleted=%o', deleted);
        return deleted !== null;
    }

    async #validateCreate(schuh: Schuh): Promise<CreateError | undefined> {
        const messages = this.#validationService.validate(schuh);
        if (messages.length > 0) {
            this.#logger.debug('validateCreate: schuh=%o, messages=%o', schuh, messages);
            return { type: 'ConstraintViolations', messages };
        }
        this.#logger.debug('#validateCreate: ok');
        return undefined;
    }

    async #validateUpdate(
        schuh: Schuh,
        id: string,
        versionString: string,
    ): Promise<UpdateError | undefined> {
        const result = this.#validateVersion(versionString);
        if (typeof result !== 'number') {
            return result;
        }

        const version = result;
        this.#logger.debug(
            '#validateUpdate: schuh=%o, version=%s',
            schuh,
            version,
        );

        const messages = this.#validationService.validate(schuh);
        if (messages.length > 0) {
            return { type: 'ConstraintViolations', messages };
        }

        const resultIdandVersion = await this.#checkIdAndVersion(id, version);
        if (resultIdandVersion !== undefined) {
            return resultIdandVersion;
        }

        this.#logger.debug('#validateUpdate: ok');
        return undefined;
    }
        
    #validateVersion(version: string | undefined): VersionInvalid | number {
        if (
            version === undefined ||
            !SchuhWriteService.VERSION_PATTERN.test(version)
        ) {
            const error: VersionInvalid = { type: 'VersionInvalid', version };
            this.#logger.debug('#validateVersion: VersionInvalid=%o', error);
            return error;
        }
        
        return Number.parseInt(version.substring(1, version.length - 1), 10);
    }

    async #checkIdAndVersion(
        id: string,
        version: number,
    ): Promise<UpdateError | undefined> {
        const schuhDb = await this.#schuhModel.findById(id);
        if (schuhDb === null) {
            const result: SchuhNotExists = { type: 'SchuhNotExists', id };
            this.#logger.debug('#checkIdAndVersion: SchuhNotExists=%o', result);
            return result;
        }

        const versionDb = (schuhDb.__v ?? 0) as number;
        if (version < versionDb) {
            const result: VersionOutdated = {
                type: 'VersionOutdated',
                id,
                version,
            };
            this.#logger.debug('#checkIdAndVersion: VersionOutdated=%o', result);
            return result;
        }
        return undefined;
    }
}