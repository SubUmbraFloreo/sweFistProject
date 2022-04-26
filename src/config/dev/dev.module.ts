import { modelName, schuhSchema } from '../../schuh/entity/index.js';
import { DbModule } from '../../db/db.module.js';
import { DbPopulateService } from './db-populate.service.js';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
    imports: [
        DbModule,
        MongooseModule.forFeature([
            {
                name: modelName,
                schema: schuhSchema,
            },
        ]),
    ],
    providers: [DbPopulateService],
    exports: [DbPopulateService],
})
export class DevModule {}
