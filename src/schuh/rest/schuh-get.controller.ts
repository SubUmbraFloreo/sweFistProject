/**
 * Controller Klasse für das Lesen an der REST-Schnitstelle
 */
 import {
    ApiBearerAuth,
    ApiHeader,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiProperty,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Schuh, SchuhDocument } from '../entity/schuh.js'
import {
    Controller,
    Get,
    Headers,
    HttpStatus,
    Param,
    Query,
    Req,
    Res,
} from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../../security/index.js';
import { Request, Response } from 'express';
import { ResponseTimeInterceptor, getLogger } from '../../logger/index.js';
import { SchuhReadService } from '../service/index.js';
import { type ObjectID } from 'bson';
import { getBaseUri } from './getBaseUri.js';
import { paths } from '../../config/index.js';

//Typescript
interface Link {
    href: string;
}
interface Links {
    self: Link;
    list?: Link;
    add?: Link;
    update?: Link;
    remove?: Link;
}

// Interface für Get-Requests mit Links für HATOAS
// VO = Value object
export interface SchuhVO extends Schuh {
    _links: Links;
}

export interface SchuheVO {
    _embedded: {
        schuhe: SchuhVO[];
    };
}

export class SchuhQuery extends Schuh {
    @ApiProperty({ required: false })
    override readonly marke: string | undefined;

    @ApiProperty({ required: false })
    override readonly groesse: number | undefined;

    @ApiProperty({ required: false })
    override readonly modell: string | undefined;

    @ApiProperty({ required: false })
    override readonly farbe: string | undefined;

    @ApiProperty({ required: false })
    override readonly erscheinungsdatum: string | undefined;
}

/**
 * Die Controller Klasse für die Verwaltung
 */
@Controller(paths.api)
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('REST-API')
@ApiBearerAuth()
export class SchuhGetController {
    readonly #service: SchuhReadService;

    readonly #logger = getLogger(SchuhGetController.name);

    // Hier die Dependency Injection
    constructor(service: SchuhReadService) {
        this.#service = service;
    }
    /**
     * Ein Schuh wird anhand seiner Id gesucht
     * Hier wird optimistisch geschützt
     * @param id Die Id des Schuhs
     * @param req Das Request-Objekt von Express mit Pfadparametern, Query-String, Header und Body
     * @param version Versionsnummer im Request-Header bei If-None-Match
     * @param accept Content-Type bzw MIME-Type im Request-Header
     * @param res Leeres Response-Objekt von Express
     * @returns Leeres Promise
     */
    @Get(':id')
    @ApiOperation({ summary: 'Schuh mit der Id suchen '})
    @ApiParam({
        name: 'id',
        description: 'z.B. 000000000000000000000001'
    })
    @ApiHeader({
        name: 'If-None-Match',
        description: 'Header für bedingte Get-Requests',
        required: false,
    })
    @ApiOkResponse({ description: 'Der Schuh wurde gefunden' })
    @ApiNotFoundResponse({ description: 'Es konnte kein Schuh mit dieser Id gefunden werden' })
    @ApiResponse({
        status: HttpStatus.NOT_MODIFIED,
        description: 'Dieser Schuh wurde bereits abgefragt'
    })
    async findById(
        @Param('id') id: string,
        @Req() req: Request,
        @Headers('If-None-Match') version: string | undefined,
        @Res() res: Response,
    ) {
        this.#logger.debug('findById: id=%s, version=%s', id, version);

        if (req.accepts(['json', 'html']) === false) {
            this.#logger.debug('findById: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        let schuh: SchuhDocument | undefined;
        try {
        schuh = await this.#service.findById(id);
    } catch (err) {
        this.#logger.error('findById: error=%o', err);
        return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (schuh === undefined) {
        this.#logger.debug('findById: NOT_FOUND');
        return res.sendStatus(HttpStatus.NOT_FOUND);
    }
    this.#logger.debug('findById(): schuh=%o', schuh);

    // Setzen der ETags
    const versionDB = schuh.__v as number;
    if (version === `"${versionDB}"`) {
        this.#logger.debug('findById: NOT_MODIFIED');
        return res.sendStatus(HttpStatus.NOT_MODIFIED);
    }
    this.#logger.debug('findById: versionDB=%s', versionDB);
    res.header('Etag', `"${versionDB}"`);

    const schuhVO = this.#toVO(schuh, req, id);
    this.#logger.debug('findById: schuhVO=%o', schuhVO);
    return res.json(schuhVO);
}   
    /**
     * Alle Schuhe werden gesucht
     * @param query Query-Parameter von Express
     * @param req Das Request-Objekt von Express mit Pfadparametern, Query-String, Header und Body
     * @param res Leeres Response-Objekt von Express
     * @returns Leeres Promise
     */
    @Get()
    @ApiOperation({ summary: 'Schuhe mit Suchkriterien suchen' })
    @ApiOkResponse({ description: 'Eine Liste mit Schuhen, kann auch leer sein' })
    async find(
        @Query() query: SchuhQuery,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        this.#logger.debug('find: query=%o', query)

        if (req.accepts(['json', 'html']) === false) {
            this.#logger.debug('find: acceped=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const schuhe = await this.#service.find(query);
        this.#logger.debug('find: %o', schuhe);
        if (schuhe.length === 0) {
            this.#logger.debug('find: NOT_FOUND');
            return res.sendStatus(HttpStatus.NOT_FOUND);
        }

        const schuheVO = schuhe.map((schuh) => {
            const id = (schuh.id as ObjectID).toString();
            return this.#toVO(schuh, req, id, false);
        });
        this.#logger.debug('find: schuheVO=%o', schuheVO);

        const erg: SchuheVO = { _embedded: { schuhe: schuheVO} };
        return res.json(erg).send();
    }

    /**
     * Konvertierung in ein Value Object
     * @param schuh Der Schuh
     * @param req Das Request-Objekt von Express mit Pfadparametern, Query-String, Header und Body
     * @param id Die Id des Schuhs
     * @returns  Das Value Object
     */
    #toVO(schuh: SchuhDocument, req: Request, id: string, all = true) {
        const baseUri = getBaseUri(req);
        this.#logger.debug('#toVO: baseUri=%s', baseUri);
        const links = all ? {
            self: { href: `${baseUri}/${id}` },
            list: { href: `${baseUri}` },
            add: { href: `${baseUri}` },
            update: { href: `${baseUri}/${id}` },
            remove: { href: `${baseUri}/${id}` },
        }
      : { self: { href: `${baseUri}/${id}` } };
      this.#logger.debug('toVO: schuh=%o, links=%o', schuh, links);

    const schuhVO: SchuhVO = {
        marke: schuh.marke,
        groesse: schuh.groesse,
        modell: schuh.modell,
        farbe: schuh.farbe,
        erscheinungsdatum: schuh.erscheinungsdatum,
        _links: links,
    };
    return schuhVO;
    }
}