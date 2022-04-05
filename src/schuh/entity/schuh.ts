/**
 * Das Schema für _Mongoose_.
 * @packageDocumentation
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { type ObjectID } from 'bson';
import { dbConfig } from '../../config/index.js';
import mongoose from 'mongoose';

mongoose.SchemaType.set('debug', true);

const MONGOOSE_OPTIONS: mongoose.SchemaOptions = {
    timestamps: true,
    optimisticConcurrency: true,
    autoIndex: dbConfig.autoIndex,
};

@Schema(MONGOOSE_OPTIONS)
export class Schuh {
    @Prop({ type: String, required: true })
    @ApiProperty({ example: 'Nike', type: String })
    readonly marke: string | null | undefined;
    
    @Prop({ type: Number, required: true })
    @ApiProperty({ example: '43', type: Number })
    readonly groesse: number | undefined;

    @Prop({ type: String, required: true })
    @ApiProperty({ example: 'Jordan 4'})
    readonly modell: string | null | undefined;

    @Prop({ type: String, required: true })
    @ApiProperty({ example: 'Metallic Green'})
    readonly farbe: string | null | undefined;

    @Prop({ type: Date })
    @ApiProperty({ example: '2004-7-24'})
    readonly erscheinungsdatum: Date | string | undefined;
}

const optimistic = (schema: mongoose.Schema<mongoose.Document<Schuh>>) => {
    schema.pre<
        mongoose.Query<mongoose.Document<Schuh>, mongoose.Document<Schuh>>
    >('findOneAndUpdate', function () {
        const update = this.getUpdate();
        if (update === null) {
            return;
        }

        const updateDoc = update as mongoose.Document<Schuh>;
        if (updateDoc.__v !== null) {
            delete updateDoc.__v;
        }

        for (const key of ['$set', '$setOnInsert']) {
            /* eslint-disable security/detect-object-injection */
            // @ts-expect-error siehe https://mongoosejs.com/docs/guide.html#versionKey
            const updateKey = update[key]; // eslint-disable-line @typescript-eslint/no-unsafe-assignment

            if (updateKey?.__v !== null) {
                delete updateKey.__v;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                if (Object.entries(updateKey).length === 0) {
                    // @ts-expect-error UpdateQuery laesst nur Lesevorgaenge zu: abgeleitet von ReadonlyPartial<...>
                    delete update[key];
                }
            }
        }
        // @ts-expect-error $inc ist in _UpdateQuery<TSchema> enthalten
        update.$inc = update.$inc || {}; // eslint-disable-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-unsafe-assignment
        // @ts-expect-error UpdateQuery laesst nur Lesevorgaenge zu: abgeleitet von ReadonlyPartial<...>
        update.$inc.__v = 1;
    });
};

//Schema für die Klasse *Buch* erzeugen
export const schuhSchema = SchemaFactory.createForClass(Schuh);

schuhSchema.index({ marke: 1 }, { name: 'marke' });
schuhSchema.index({ farbe: 1 }, {name: 'farbe'});

export type SchuhDocument = Schuh &
    mongoose.Document<ObjectID, any, Schuh> & { _id: ObjectID };

schuhSchema.plugin(optimistic);

export const modelName = 'Schuh';
export const collectionName = modelName;

export const exactFilterProperties = [
    'marke',
    'groesse',
    'modell',
    'farbe',
    'erscheinungsdatum'
];