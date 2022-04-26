import { type Schuh, modelName } from '../../schuh/entity/index.js';
import { GridFSBucket, type GridFSBucketWriteStreamOptions } from 'mongodb';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { DbService } from '../../db/db.service.js';
import { InjectModel } from '@nestjs/mongoose';
import { createReadStream } from 'node:fs';
import { dbConfig } from '../db.js';
import { getLogger } from '../../logger/index.js';
import mongoose from 'mongoose';
import { testdaten } from './testdaten.js';
import { testfiles } from './testfiles.js';
/**
 * Die Test-DB wird im Development-Modus neu geladen, nachdem die Module
 * initialisiert sind, was duch `OnApplicationBootstrap` realisiert wird.
 */
@Injectable()
export class DbPopulateService implements OnApplicationBootstrap {
    readonly #dbService: DbService;

    readonly #schuhModel: mongoose.Model<Schuh>;

    readonly #logger = getLogger(DbPopulateService.name);

    readonly #testdaten = testdaten;

    /**
     * Initialisierung durch DI mit `Model<schuh>` gemäß _Mongoose_.
     */
    constructor(
        dbService: DbService,
        @InjectModel(modelName) schuhModel: mongoose.Model<Schuh>,
    ) {
        this.#dbService = dbService;
        this.#schuhModel = schuhModel;
    }

    /**
     * Die Test-DB wird im Development-Modus neu geladen.
     */
    async onApplicationBootstrap() {
        await this.#populateTestdaten();
        await this.#populateTestFiles();
    }

    /**
     * @param readableStream Node-Stream mit den Binärdaten
     * @param bucket Bucket von GridFS zum Abspeichern
     * @param filename Dateiname der abzuspeichernden Datei
     * @param metadata Metadaten, z.B. MIME-Typ
     */
    // eslint-disable-next-line max-params
    saveStream(
        readableStream: NodeJS.ReadableStream, // eslint-disable-line no-undef
        bucket: GridFSBucket,
        filename: string,
        metadata: GridFSBucketWriteStreamOptions,
    ) {
        readableStream.pipe(bucket.openUploadStream(filename, metadata));
    }

    async #populateTestdaten() {
        if (!dbConfig.dbPopulate) {
            return;
        }

        try {
            await this.#schuhModel.collection.drop();
        } catch {
            this.#logger.info('#populateTestdaten: Keine Collection vorhanden');
        }

        const collection = await this.#schuhModel.createCollection();
        this.#logger.warn(
            '#populateTestdaten: Collection %s neu angelegt',
            collection.collectionName,
        );

        // https://mongoosejs.com/docs/api.html#model_Model.insertMany
        const insertedDocs = await this.#schuhModel.insertMany(
            this.#testdaten,
            {
                lean: true,
            },
        );
        this.#logger.warn(
            '#populateTestdaten: %d Datensaetze eingefuegt',
            insertedDocs.length,
        );
    }

    async #populateTestFiles() {
        const client = await this.#dbService.connect();

        // https://mongodb.github.io/node-mongodb-native/3.6/tutorials/gridfs/streaming/
        const bucket = new GridFSBucket(client.db(dbConfig.dbName));

        const collections = await client.db().listCollections().toArray();
        const collectionNames = collections.map(
            (collection) => collection.name,
        );
        if (collectionNames.includes('fs.files')) {
            await bucket.drop();
        }

        testfiles.forEach((testfile) => {
            const { filenameBinary, contentType, filename } = testfile;
            this.#saveFile(filenameBinary, contentType, bucket, filename);
        });
    }

    // eslint-disable-next-line max-params
    #saveFile(
        filenameBinary: string,
        contentType: string,
        bucket: GridFSBucket,
        filename: string,
    ) {
        const options = { contentType };
        createReadStream(filenameBinary).pipe(
            bucket.openUploadStream(filename, options),
        );
        this.#logger.warn(
            '#saveFile: %s mit %s gespeichert.',
            filename,
            contentType,
        );
    }
}
