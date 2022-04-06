import { env } from './env.js';
import { k8sConfig } from './kubernetes.js';

const { dbConfigEnv } = env;

// nullish coalescing
const dbName = dbConfigEnv.name ?? 'acme';
const { detected } = k8sConfig;
const host = detected ? 'mongodb' : dbConfigEnv.host ?? 'localhost';
const atlas = host.endsWith('mongodb.net');
const user = dbConfigEnv.user ?? 'admin';
const pass = dbConfigEnv.password ?? 'p';
const autoIndex = dbConfigEnv.autoIndex?.toLowerCase() === 'true';
const dbPopulate = dbConfigEnv.populate?.toLowerCase() === 'true';
const dbPopulateFiles = dbConfigEnv.populateFiles?.toLowerCase() === 'true';

// https://docs.mongodb.com/manual/reference/connection-string
// Default:
//  retryWrites=true            ab MongoDB-Treiber 4.2
//  readPreference=primary
// "mongodb+srv://" statt "mongodb://" fuer eine "DNS seedlist" z.B. bei "Replica Set"
// https://docs.mongodb.com/manual/reference/write-concern
const url = atlas
    ? `mongodb+srv://${user}:${pass}@${host}/${dbName}?w=majority`
    : `mongodb://${user}:${pass}@${host}/${dbName}?authSource=admin`;

interface DbConfig {
    readonly atlas: boolean;
    readonly url: string;
    readonly dbName: string;
    readonly autoIndex: boolean;
    readonly dbPopulate: boolean;
    readonly dbPopulateFiles: boolean;
}

/**
 * Das Konfigurationsobjekt für den Zugriff auf MongoDB.
 */
export const dbConfig: DbConfig = {
    atlas,
    url,
    dbName,
    autoIndex,
    dbPopulate,
    dbPopulateFiles,
};

const dbConfigLog = {
    atlas,
    url: url.replace(/\/\/.*:/u, '//USERNAME:@').replace(/:[^:]*@/u, ':***@'), //NOSONAR
    dbName,
    autoIndex,
    dbPopulate,
    dbPopulateFiles,
};

console.info('dbConfig: %o', dbConfigLog);
