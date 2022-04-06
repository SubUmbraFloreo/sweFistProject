import {
    type CallHandler,
    type ExecutionContext,
    Injectable,
    type NestInterceptor,
} from '@nestjs/common';
import { type Observable } from 'rxjs';
import { type Response } from 'express';
import { Temporal } from '@js-temporal/polyfill';
import { getLogger } from './logger.js';
import { tap } from 'rxjs/operators';

/**
 * `ResponseTimeInterceptor` protokolliert die Antwortzeit und den Statuscode
 * Alternative zu morgan (von Express) http://expressjs.com/en/resources/middleware/morgan.html,
 * aber mit konformem Log-Layout.
 */
@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor {
    readonly #logger = getLogger(ResponseTimeInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        // TODO https://github.com/js-temporal/temporal-polyfill/issues/92
        const start = Temporal.Now.instant().epochMilliseconds;
        return next.handle().pipe(
            tap(() => {
                const response = context.switchToHttp().getResponse<Response>();
                const { statusCode, statusMessage } = response;
                const responseTime =
                    Temporal.Now.instant().epochMilliseconds - start;
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                if (statusMessage === undefined) {
                    // GraphQL
                    this.#logger.debug('Response time: %d ms', responseTime);
                    return;
                }
                this.#logger.debug(
                    'Response time: %d ms, %d %s',
                    responseTime,
                    statusCode,
                    statusMessage,
                );
            }),
        );
    }
}
