import { Controller, Get } from '@nestjs/common';
import {
    HealthCheck,
    HealthCheckService,
    HttpHealthIndicator,
    MongooseHealthIndicator,
} from '@nestjs/terminus';
import { k8sConfig, nodeConfig } from '../config/index.js';
import { Agent } from 'node:https';
import { ApiTags } from '@nestjs/swagger';

/**
 * Die Controller-Klasse für Health-Checks.
 */
@Controller('health')
@ApiTags('Health')
export class HealthController {
    readonly #health: HealthCheckService;

    readonly #http: HttpHealthIndicator;

    readonly #mongodb: MongooseHealthIndicator;

    readonly #schema = k8sConfig.detected && !k8sConfig.tls ? 'http' : 'https';

    readonly #httpsAgent = new Agent({
        requestCert: true,
        rejectUnauthorized: false,
        ca: nodeConfig.httpsOptions?.cert as Buffer,
    });

    constructor(
        health: HealthCheckService,
        http: HttpHealthIndicator,
        mongodb: MongooseHealthIndicator,
    ) {
        this.#health = health;
        this.#http = http;
        this.#mongodb = mongodb;
    }

    @Get()
    @HealthCheck()
    check() {
        return this.#health.check([
            () =>
                this.#http.pingCheck(
                    'buch REST-API',
                    `${this.#schema}://${nodeConfig.host}:${
                        nodeConfig.port
                    }/api/000000000000000000000001`,
                    { httpsAgent: this.#httpsAgent },
                ),
            () => this.#mongodb.pingCheck('MongoDB'),
        ]);
    }
}
