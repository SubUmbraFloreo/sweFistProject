import {
    type SchuhNotExists,
    type FileFindError,
    type FileNotFound,
    type MultipleFiles,
} from './errors.js';
import {
    GridFSBucket,
    type GridFSBucketReadStream,
    type GridFSFile,
} from 'mongodb';
import { SchuhReadService } from './schuh-read.service.js';
import { DbService } from '../../db/db.service.js';
import { type FileTypeResult } from 'file-type';
import { Injectable } from '@nestjs/common';
import { dbConfig } from '../../config/index.js';
import { getLogger } from '../../logger/index.js';
import intoStream from 'into-stream';

/** 
 * Das Interface beschreibt das Resultat bei einer gefundenen, binären Datei und besteht aus dem
 * Stream zum Lesen, sowie dem MIME-Type
 */
export interface FileFindSuccess {
    type: 'FileFindSuccess';
    readStream: GridFSBucketReadStream;
    contentType: string,
}

/**
 * Mit der Klasse können BenäreDateien mit dem Treiber von _MongoDB_ in _GridFS_ abespeichert
 * und ausgeesen werden
 */
@Injectable()
export class SchuhFileService {
    readonly #service: SchuhReadService;

    readonly #dbService: DbService;

    readonly #logger = getLogger(SchuhFileService.name);

    constructor(service: SchuhReadService, dbService: DbService) {
        this.#service = service;
        this.#dbService = dbService;
    }

    /**
     * Asynchrones Abspeichern einer binären Datei
     * @param filename Die Id des zuhörigen Schuhs, als Dateiname
     * @param buffer Node-Buffer mit de Binärdaten
     * @param contentType MIME_Type
     * @returns true, falls die binären Datein abgespeichert wurden, sonst false
     */
    async save(
        filename: string,
        buffer: Buffer,
        fileType: FileTypeResult | undefined,
    ) {
        this.#logger.debug(
            'save: filename=%s, fileType=%o',
            filename,
            fileType,
        );

        if (fileType === undefined) {
            return false;
        }

        const schuh = await this.#service.findById(filename);
        if (schuh === undefined) {
            return false;
        }

        const client = await this.#dbService.connect();
        const bucket = new GridFSBucket(client.db(dbConfig.dbName));
        await this.#delete(filename, bucket);

        const stream = intoStream(buffer);
        const options = { contentType: fileType.mime };
        stream.pipe(bucket.openUploadStream(filename, options));
        return true;
    }

    /**
     * Asynchrones Suchen nach einer Binärdatei in _GridFS_ anhand des Dateinamens.
     * @param filename Der Dateiname der Binärdatei.
     * @returns GridFSBucketReadStream, falls es eine Binärdatei mit dem
     *  angegebenen Dateinamen gibt. Im Fehlerfall ein JSON-Objekt vom Typ:
     * - {@linkcode BuchNotExists}
     * - {@linkcode FileNotFound}
     * - {@linkcode MultipleFiles}
     */
    async find(filename: string): Promise<FileFindError | FileFindSuccess> {
        this.#logger.debug('find: filename=%s',filename);
        const resultCheckFilename = await this.#checkFileName(filename);
        if (resultCheckFilename !== undefined) {
            return resultCheckFilename;
        }

        const client = await this.#dbService.connect();
        const bucket = new GridFSBucket(client.db(dbConfig.dbName));
        const contentType = await this.#getContentType(filename, bucket);
        if (typeof contentType !== 'string') {
            return { type: 'InvalidContentType' };
        }
        this.#logger.debug('find: contentType=%s', contentType);

        const readStream = bucket.openDownloadStreamByName(filename);
        const result: FileFindSuccess = {
            type: 'FileFindSuccess',
            readStream,
            contentType,
        };
        return result;
    }

    async #delete(filename: string, bucket: GridFSBucket) {
        this.#logger.debug('#delete: filename=%s', filename);
        const idObjects: GridFSFile[] = await bucket
            .find({ filename })
            .toArray();
        const ids = idObjects.map((obj) => obj._id);
        this.#logger.debug('#delete: ids=%o', ids);
        ids.forEach((fileId) =>
            bucket.delete(fileId, () =>
                this.#logger.debug('#delete: geloeschte File-ID=%s', fileId),
            ),
        );
    }

    async #checkFileName(filename: string): Promise<SchuhNotExists | undefined> {
        this.#logger.debug('#checkFilename: filename=%s', filename);

        const schuh = await this.#service.findById(filename);
        if (schuh === undefined) {
            const result: SchuhNotExists = {
                type: 'SchuhNotExists',
                id: filename,
            };
            this.#logger.debug('#checkFilename: SchuhNotExists=%o', result);
            return result;
        }

        this.#logger.debug('#checkFilename: schuh vorhanden=%o', schuh);
        return undefined;
    }

    async #getContentType(filename: string, bucket: GridFSBucket) {
        let files: GridFSFile[];
        try {
            files = await bucket.find({ filename }).toArray();
        } catch (err) {
            this.#logger.error('%o', err);
            files = [];
        }

        switch (files.length) {
            case 0: {
                const error = { type: 'FileNotFound', filename };
                this.#logger.debug('#getContentType: FileNotFound=%o', error);
                return error;
            }

            case 1: {
                const [file] = files;
                if (file === undefined) {
                    const error: FileNotFound = {
                        type: 'FileNotFound',
                        filename,
                    };
                    this.#logger.debug(
                        '#getContentType: FileNotFound=%o',
                        error,
                    );
                    return error;
                }

                const { contentType } = file;
                if (contentType === undefined) {
                    return { type: 'InvalidContentType' };
                }

                this.#logger.debug(
                    '#getContentType: contentType=%s',
                    contentType,
                );
                return contentType;
            }

            default: {
                const error: MultipleFiles = {
                    type: 'MultipleFiles',
                    filename,
                };
                this.#logger.debug('#getContentType: MultipleFiles=%o', error);
                return error;
            }
        }
    }
}