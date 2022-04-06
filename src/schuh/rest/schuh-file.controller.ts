import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { SchuhFileService, type FileFindError } from '../service/index.js';
import {
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Put,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { Express, Response } from 'express';
import { JwtAuthGuard, Roles, RolesGuard } from '../../security/index.js';
import { ResponseTimeInterceptor, getLogger } from '../../logger/index.js';
import { FileInterceptor } from '@nestjs/platform-express';
import fileTypePkg from 'file-type';

@Controller('file')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Rest-Api')
export class SchuhFileController {
    readonly #service: SchuhFileService; 
    readonly #logger = getLogger(SchuhFileController.name);

    constructor(service: SchuhFileService) {
        this.#service = service;
    }   

    @Put(':id')
    @Roles('admin')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    async upload(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        this.#logger.debug('upload: id=%s, file=%s', id, file.originalname);
        const { fieldname, originalname, size, buffer } = file;
        this.#logger.debug(
            'upload: fieldname=%s, originalname=%s, size=%s',
            fieldname,
            originalname,
            size,
        );

        const fileType = await fileTypePkg.fromBuffer(buffer);
        this.#logger.debug('upload: fileType=%s', fileType);

        await this.#service.save(id, buffer, fileType);
    }

    @Get(':id')
    async download(
        @Param('id') id: string,
        @Res() res: Response,
    ) {
        this.#logger.debug('download: id=%s', id);

        const findResult = await this.#service.find(id);
        if (findResult.type !== 'FileFindSuccess') {
            return this.#handleFindError(findResult, res);
        }

        const file = findResult;
        const { readStream, contentType } = file;
        res.contentType(contentType);

        return readStream.pipe(res);
    }

    #handleFindError(err: FileFindError, res: Response) {
        switch (err.type) {
            case 'SchuhNotExists': {
                const { id } = err;

                const msg = `Schuh mit ID ${id} nicht gefunden`;
                this.#logger.debug(
                    '#handleFindError: SchuhNotExists: msg=%s',
                );
                return res
                    .status(HttpStatus.PRECONDITION_FAILED)
                    .set('Content-Type', 'text/plain')
                    .send(msg);
                }

            case 'FileNotFound': {
                const { filename } = err;
                const msg = `File ${filename} nicht gefunden`;
                this.#logger.debug(
                    '#handleFindError: FileNotFound: msg=%s',
                    msg,
                );
                return res.status(HttpStatus.NOT_FOUND).send(msg);
            }

            case 'MultipleFiles': {
                const { filename } = err;
                const msg = `Mehrere Files mit dem Namen ${filename} gefunden`;
                this.#logger.debug(
                    '#handleFindError: MultipleFilesFound: msg=%s',
                    msg,
                );
                return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(msg);
            }

            default: 
                return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
            
        }

    }
}