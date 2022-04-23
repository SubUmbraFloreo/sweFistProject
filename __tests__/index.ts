export type { SchuhVO, SchuheVO } from '../src/schuh/rest/schuh-get.controller';
export type { Schuh } from '../src/schuh/entity/index.js';
export type { SchuhVO as SchuhVOGraphQl } from '../src/schuh/graphql/schuh-query.resolver.js';
export { loginGraphQL, loginRest } from './login.js';
export {
    apiPath,
    createTestserver,
    host,
    httpsAgent,
    loginPath,
    port,
    shutdownTestserver,
} from './testserver.js';
