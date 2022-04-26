import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiHeader,
    ApiNoContentResponse,
    ApiOperation,
    ApiPreconditionFailedResponse,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import {
    Body,
    Controller,
    Delete,
    Headers,
    HttpStatus,
    Param,
    Post,
    Put,
    Req,
    Res,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import {
    type CreateError,
    SchuhWriteService,
    type UpdateError,
} from '../service/index.js';
import { JwtAuthGuard, Roles, RolesGuard } from '../../security/index.js';
import { Request, Response } from 'express';
import { ResponseTimeInterceptor, getLogger } from '../../logger/index.js';
import { Schuh } from '../entity/index.js';
import { type ObjectId } from 'bson';
import { getBaseUri } from './getBaseUri.js';
import { paths } from '../../config/index.js';

/**
 * Controller Klasse für den schreibenden Zugriff auf die REST-Schnitstelle
 */
@Controller(paths.api)
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('REST-API')
@ApiBearerAuth()
export class SchuhWriteController {
    readonly #service: SchuhWriteService;

    readonly #logger = getLogger(SchuhWriteController.name);

    constructor(service: SchuhWriteService) {
        this.#service = service;
    }

    /**
     * Asynchrones Erzeugen eines Schuh-Objekts
     * @param schuh JSON-Objekt mit den Daten für ein Schuh-Objekt
     * @param res Leeres Response-Objekt von Express
     * @returns Leeres Promise
     */
    @Post()
    @Roles('admin')
    @ApiOperation({ summary: 'Erzeuge ein Schuh-Objekt' })
    @ApiCreatedResponse({ description: 'Erfolgreich neu angelegt' })
    @ApiBadRequestResponse({ description: 'Ungültige Daten' })
    async create(
        @Body() schuh: Schuh,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        this.#logger.debug('create: schuh=%o', schuh);

        const result = await this.#service.create(schuh);
        if (Object.prototype.hasOwnProperty.call(result, 'type')) {
            return this.#handleCreateError(result as CreateError, res);
        }

        const location = `${getBaseUri(req)}/${(
            result as ObjectId
        ).toString()}`;
        this.#logger.debug('create: location=%s', location);
        return res.location(location).send();
    }

    /**
     * Einen vorhanden Schuh-Datensatz aktualisieren
     * @param schuh Die Schuhdaten im Body des Requests
     * @param id Die ID als Pfadparameter
     * @param version Die Versionsnummer aus dem Header des Requests
     * @param res Leeres Response-Objekt von Express
     * @returns Leeres Promise
     */
    // eslint-disable-next-line max-params
    @Put(':id')
    @Roles('admin')
    @ApiOperation({ summary: 'Einen vorhandenen Schuh akualisieren' })
    @ApiHeader({
        name: 'If-Match',
        description: 'Header für die optimistische Synchronisation',
        required: false,
    })
    @ApiHeader({
        name: 'Authorization',
        description: 'Header für JSON Web Token',
        required: true,
    })
    @ApiNoContentResponse({ description: 'Erfolgreich aktualisiert' })
    @ApiBadRequestResponse({ description: 'Ungültige Daten' })
    @ApiPreconditionFailedResponse({
        description: 'Ungültige Versionsnummer im Header',
    })
    @ApiResponse({
        status: HttpStatus.PRECONDITION_REQUIRED,
        description: 'Header mit "If-Match" fehlt',
    })
    async update(
        @Body() schuh: Schuh,
        @Param('id') id: string,
        @Headers('If-match') version: string | undefined,
        @Res() res: Response,
    ) {
        this.#logger.debug(
            'update: schuh=%o, id=%s, version=%s',
            schuh,
            id,
            version,
        );

        if (version === undefined) {
            const msg = 'Header mit "If-Match" fehlt';
            this.#logger.debug('#handleUpdateError: %s', msg);
            return res
                .status(HttpStatus.PRECONDITION_REQUIRED)
                .set('Content-Type', 'text/plain')
                .send(msg);
        }

        const result = await this.#service.update(id, schuh, version);
        if (typeof result === 'object') {
            return this.#handleUpdateError(result, res);
        }

        this.#logger.debug('update: version=%d', result);
        return res.set('ETag', `"${result}"`).sendStatus(HttpStatus.NO_CONTENT);
    }

    /**
     * Löschen eines Schuhs anhand seiner Id
     * @param id Die ID als Pfadparameter
     * @param res Leeres Response-Objekt von Express
     * @returns Leeres Promise
     */
    @Delete(':id')
    @Roles('admin')
    @ApiOperation({ summary: 'Einen Schuh andhand der Id löschen' })
    @ApiHeader({
        name: 'Authorization',
        description: 'Header für JSON Web Token',
        required: true,
    })
    @ApiNoContentResponse({
        description: 'Erfolgreich gelöscht oder vorher schon nicht vorhanden',
    })
    async delete(@Param('id') id: string, @Res() res: Response) {
        this.#logger.debug('delete: id=%s', id);

        let deleted: boolean;
        try {
            deleted = await this.#service.delete(id);
        } catch (err) {
            this.#logger.error('delete: err=%o', err);
            return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        }
        this.#logger.debug('delete: deleted=%s', deleted);

        return res.sendStatus(HttpStatus.NO_CONTENT);
    }

    #handleCreateError(err: CreateError, res: Response) {
        switch (err.type) {
            case 'ConstraintViolations':
                return this.#handleValidationError(err.messages, res);

            default:
                return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    #handleValidationError(messages: readonly string[], res: Response) {
        this.#logger.debug('#handleValidationError: messages=%o', messages);
        return res.sendStatus(HttpStatus.UNPROCESSABLE_ENTITY).send(messages);
    }

    #handleUpdateError(err: UpdateError, res: Response) {
        switch (err.type) {
            case 'ConstraintViolations':
                return this.#handleValidationError(err.messages, res);

            case 'SchuhNotExists': {
                const { id } = err;
                const msg = `Es konnte kein Schuh mit der Id "${id}" gefunden werden`;
                this.#logger.debug('#handleUpdateError: %s', msg);
                return res
                    .status(HttpStatus.PRECONDITION_FAILED)
                    .set('Content-Type', 'text/plain')
                    .send(msg);
            }

            case 'VersionInvalid': {
                const { version } = err;
                const msg = `Die Versionsnummer "${version}" ist ungültig`;
                this.#logger.debug('#handleUpdateError: %s', msg);
                return res
                    .status(HttpStatus.PRECONDITION_FAILED)
                    .set('Content-Type', 'text/plain')
                    .send(msg);
            }

            default:
                return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
