import { k8sConfig } from '../kubernetes.js';
import { resolve } from 'node:path';

const srcDir = k8sConfig.detected ? resolve('dist', 'src') : resolve('src');
// relativ zum Verzeichnis, in dem "npm run start:dev" aufgerufen wird
const filesDir = resolve(srcDir, 'config', 'dev');

export const testfiles = [
    {
        filenameBinary: resolve(filesDir, 'image.png'),
        contentType: 'image/png',
        filename: '000000000000000000000001',
    },
    {
        filenameBinary: resolve(filesDir, 'image.jpg'),
        contentType: 'image/jpg',
        filename: '000000000000000000000002',
    },
];
