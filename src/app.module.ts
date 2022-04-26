import {
    type MiddlewareConsumer,
    Module,
    type NestModule,
} from '@nestjs/common';
import { dbConfig, graphQlConfig } from './config/index.js'; //graphqlConfig
import { ApolloDriver } from '@nestjs/apollo';
import { AuthModule } from './security/auth/auth.module.js';
import { SchuhModule } from './schuh/schuh.module.js';
import { DbModule } from './db/db.module.js';
import { DevModule } from './config/dev/dev.module.js';
import { GraphQLModule } from '@nestjs/graphql';
import { HealthModule } from './health/health.module.js';
import { LoggerModule } from './logger/logger.module.js';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { RequestLoggerMiddleware } from './logger/index.js';

@Module({
    imports: [
        AuthModule,
        SchuhModule,
        MongooseModule.forRoot(dbConfig.url),
        DbModule,
        DevModule,
        GraphQLModule.forRoot({
            typePaths: ['./**/*.graphql'],
            // alternativ: Mercurius (statt Apollo) fuer Fastify (statt Express)
            driver: ApolloDriver,
            debug: graphQlConfig.debug,
        }),
        LoggerModule,
        HealthModule,
        MulterModule.register(),
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(RequestLoggerMiddleware)
            .forRoutes('api', 'graphql', 'auth', 'file');
    }
}
