import {
    Injectable,
    Logger,
    type OnApplicationShutdown,
} from '@nestjs/common';
import { MongoClient } from 'mongodb';
import { dbConfig } from '../config/db.js';
import mongoose from 'mongoose';
import { ShutdownSignal } from './shutdown-signal.enum.js';

/**
 * Die Datenbank wird im Development-Modus neu geladen, anachdem die Module gestartet wurden
 * Dies geschieht durch 'OnApplicationBootstrap
 */
@Injectable()
export class DbService implements OnApplicationShutdown {
    readonly #logger = new Logger(DbService.name);

    /**
     * Die Verbindung beim Herunterfahren schließen
     * @param signal
     */
    async onApplicationShutdown(signal?: string) {
        this.#logger.log(`onApplicationShutdown: signal=${signal}`);
        if (signal === ShutdownSignal.SIGINT) {
            await mongoose.disconnect();
            this.#logger.log(
                'onApplicationShutdown: Die Datenbank-Verbindung für MongoD wird geschlossen',
            );
        }
    }

    /**
     * Datenbank Verbindung für Datei-Upload und -Download bereitstellen
     * @returns DB-Client
     */
    async connect() {
        const { url } = dbConfig;
        const client = new MongoClient(url);
        await client.connect();
        return client;
    }
}