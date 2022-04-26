import {
    SchuhFileController,
    SchuhGetController,
    SchuhWriteController,
} from './rest/index.js';
import {
    SchuhFileService,
    SchuhReadService,
    SchuhValidationService,
    SchuhWriteService,
} from './service/index.js';
import { SchuhMutationResolver, SchuhQueryResolver } from './graphql/index.js';
import { collectionName, schuhSchema } from './entity/index.js';
import { AuthModule } from '../security/auth/auth.module.js';
import { DbModule } from '../db/db.module.js';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

/**
 * Das Modul ist bestehend aus Controller- und Service-Klassen für die Verwaltung
 * von Schuh-Daten.
 * @packageDocumentation
 */
@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: collectionName,
                schema: schuhSchema,
                collection: collectionName,
            },
        ]),
        AuthModule,
        DbModule,
    ],
    controllers: [
        SchuhFileController,
        SchuhGetController,
        SchuhWriteController,
    ],
    providers: [
        SchuhFileService,
        SchuhReadService,
        SchuhWriteService,
        SchuhValidationService,
        SchuhQueryResolver,
        SchuhMutationResolver,
    ],
    exports: [
        SchuhFileService,
        SchuhReadService,
        SchuhWriteService,
        SchuhValidationService,
    ],
})
export class SchuhModule {}
