import {
    DocumentBuilder,
    type SwaggerCustomOptions,
    SwaggerModule,
} from '@nestjs/swagger';
import { corsOptions, helmetHandlers } from './security/index.js';
import { nodeConfig, paths } from './config/index.js';
import { AppModule } from './app.module.js';
import { type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';

const { httpsOptions, port } = nodeConfig;

const setupSwagger = (app: INestApplication) => {
    const config = new DocumentBuilder()
        .setTitle('Buch')
        .setDescription('Schuh Projekt')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    const options: SwaggerCustomOptions = {
        customSiteTitle: 'SWE Server',
    };
    SwaggerModule.setup(paths.swagger, app, document, options);
};

const bootstrap = async () => {
    const app =
        httpsOptions === undefined
            ? await NestFactory.create(AppModule)
            : await NestFactory.create(AppModule, { httpsOptions }); // "Shorthand Properties" ab ES 2015

    // https://docs.nestjs.com/security/helmet
    app.use(helmetHandlers);

    setupSwagger(app);
    // compression von Express fuer GZip-Komprimierung
    // Default "Chunk Size" ist 16 KB: https://github.com/expressjs/compression#chunksize
    app.use(compression());
    // cors von Express fuer CORS (= cross origin resource sharing)
    app.enableCors(corsOptions);
    app.enableShutdownHooks();

    await app.listen(port);
};

await bootstrap();