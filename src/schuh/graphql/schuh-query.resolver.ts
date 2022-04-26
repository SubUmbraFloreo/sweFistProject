import { Args, Query, Resolver } from '@nestjs/graphql';
import { type Schuh, type SchuhDocument } from '../entity/index.js';
import { ResponseTimeInterceptor, getLogger } from '../../logger/index.js';
import { SchuhReadService } from '../service/index.js';
import { UseInterceptors } from '@nestjs/common';
import { UserInputError } from 'apollo-server-express';

export type SchuhVO = Schuh & {
    id: string;
    version: number;
};

export interface SchuhUpdateInput {
    id?: string;
    version?: number;
    schuh: Schuh;
}

interface Id {
    id: string;
}

@Resolver()
@UseInterceptors(ResponseTimeInterceptor)
export class SchuhQueryResolver {
    readonly #service: SchuhReadService;

    readonly #logger = getLogger(SchuhQueryResolver.name);

    constructor(service: SchuhReadService) {
        this.#service = service;
    }

    @Query('schuh')
    async findById(@Args() id: Id) {
        const idString = id.id;
        this.#logger.debug('findById: id=%s', idString);

        const schuh = await this.#service.findById(idString);
        if (schuh === undefined) {
            throw new UserInputError(`Schuh mit id ${idString} nicht gefunden`);
        }

        const schuhVO = this.#toSchuhVO(schuh);
        this.#logger.debug('findById: schuhVO=%o', schuhVO);
        return schuhVO;
    }

    @Query('schuhe')
    async find(@Args() marke: { marke: string } | undefined) {
        const markeString = marke?.marke;
        this.#logger.debug('find: marke=%s', markeString);

        const suchkriterium =
            markeString === undefined ? undefined : { marke: markeString };
        const schuhe = await this.#service.find(suchkriterium);
        if (schuhe.length === 0) {
            throw new UserInputError(
                `Keine Schuhe mit Marke ${markeString} gefunden`,
            );
        }

        const schuheVO = schuhe.map((schuh) => this.#toSchuhVO(schuh));
        this.#logger.debug('find: schuheVO=%o', schuheVO);
        return schuheVO;
    }

    #toSchuhVO(schuh: SchuhDocument) {
        const schuhVO: SchuhVO = {
            id: schuh._id.toString(),
            version: schuh.__v as number,
            marke: schuh.marke,
            groesse: schuh.groesse,
            modell: schuh.modell,
            farbe: schuh.farbe,
            erscheinungsdatum: schuh.erscheinungsdatum,
        };
        return schuhVO;
    }
}
