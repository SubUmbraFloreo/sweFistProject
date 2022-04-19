import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
    SchuhWriteService,
    type CreateError,
    type UpdateError,
} from '../service/index.js';
import {
    JwtAuthGraphQlGuard,
    Roles,
    RolesGraphQlGuard,
} from '../../security/index.js';
import { ResponseTimeInterceptor, getLogger } from '../../logger/index.js';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Schuh } from '../entity/index.js';
import { type ObjectId } from 'bson';
import { UserInputError } from 'apollo-server-express';

export type BuchVO = Schuh & {
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
@UseGuards(JwtAuthGraphQlGuard, RolesGraphQlGuard)
@UseInterceptors(ResponseTimeInterceptor)
export class SchuhMutationResolver {
    readonly #service: SchuhWriteService;
    readonly #logger = getLogger(SchuhMutationResolver.name);

    constructor(service: SchuhWriteService) {
        this.#service = service;
    }

    @Mutation()
    @Roles('admin', 'mitarbeiter')
    async create(@Args() input: Schuh) {
        this.#logger.debug('create: input=%o', input);
        const result = await this.#service.create(input);
        if (Object.prototype.hasOwnProperty.call(result, 'type')) {
            throw new UserInputError(
                this.#errorMessageCreate(result as CreateError),
            );
        }
        return (result as ObjectId).toString();
    }

    @Mutation()
    @Roles('admin', 'mitarbeiter')
    async update(@Args() inputVO: SchuhUpdateInput) {
        this.#logger.debug('update: inputVO=%o', inputVO);
        const { id, version, schuh } = inputVO;
        const versionString = `"${(version ?? 0).toString()}"`;
        const result = await this.#service.update(id!, schuh, versionString);

        if (typeof result === 'object') {
            throw new UserInputError(
                this.#errorMessageUpdate(result as UpdateError),
            );
        }
        this.#logger.debug('update: result=%s', result);
        return result;
    }

    @Mutation()
    @Roles('admin')
    async delete(@Args() input: Id) {
        const idString = input.id;
        this.#logger.debug('delete: id=%s', idString);
        const result = await this.#service.delete(idString);
        this.#logger.debug('delete: result=%s', result);
        return result;
    }

    #errorMessageCreate(error: CreateError) {
        switch (error.type) {
            case 'ConstraintViolations':
                return error.messages.join(' ');
            default:
                return 'Unbekannter Fehler';
        }
    }

    #errorMessageUpdate(error: UpdateError) {
        switch (error.type) {
            case 'ConstraintViolations':
                return error.messages.join(' ');
            case 'SchuhNotExists':
                return `Es existiert kein Schuh mit der id ${error.id}`;
            case 'VersionInvalid':
                return `Die Version ${error.version} ist nicht gültig`;
            case 'VersionOutdated':
                return `Die Version ${error.version} ist veraltet`;
            default:
                return 'Unbekannter Fehler';
        }
    }
}