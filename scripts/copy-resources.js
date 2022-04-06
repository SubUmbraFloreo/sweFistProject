import fs from 'fs';
import fsExtra from 'fs-extra';
import minimist from 'minimist';
import path from 'path';

const { copyFileSync, mkdirSync } = fs;
const { copySync } = fsExtra;
const { join } = path

const argv = minimist(process.argv.slice(2));
const noTls = argv._[0] === 'no-tls';

// BEACHTE: "assets" innerhalb von nest-cli.json werden bei "--watch" NICHT beruecksichtigt
// https://docs.nestjs.com/cli/monorepo#global-compiler-options

const src = 'src';
const dist = 'dist';

const configSrc = join(src, 'config');
const configDist = join(dist, src, 'config');

if (!noTls) {
    const tlsSrc = join(configSrc, 'tls');
    const tlsDist = join(configDist, 'tls');
    mkdirSync(tlsDist, { recursive: true });
    // PEM-Dateien und Zertifikatdatei fuer TLS kopieren
    copySync(tlsSrc, tlsDist);
}

// PEM-Dateien fuer JWT kopieren
const jwtPemSrc = join(configSrc, 'jwt');
const jwtPemDist = join(configDist, 'jwt');
mkdirSync(jwtPemDist, { recursive: true });
copySync(jwtPemSrc, jwtPemDist);

/* const graphqlSrc = join(src, 'schuh', 'graphql');
const graphqlDist = join(dist, src, 'schuh', 'graphql');
mkdirSync(graphqlDist, { recursive: true });
copyFileSync(join(graphqlSrc, 'schuh.graphql'), join(graphqlDist, 'schuh.graphql'));

const graphqlAuthSrc = join(src, 'security', 'auth');
const graphqlAuthDist = join(dist, src, 'security', 'auth');
mkdirSync(graphqlAuthDist, { recursive: true });
copyFileSync(join(graphqlAuthSrc, 'login.graphql'), join(graphqlAuthDist, 'login.graphql')); */

const binaries = ['image.jpg', 'image.png'];
const binariesSrc = join(configSrc, 'dev');
const binariesDist = join(configDist, 'dev');
mkdirSync(binariesDist, { recursive: true });
binaries.forEach(file => copyFileSync(join(binariesSrc, file), join(binariesDist, file)));
