import asciidoctorNs from 'asciidoctor';
// https://github.com/eshepelyuk/asciidoctor-plantuml.js ist deprecated
import kroki from 'asciidoctor-kroki';
import { join } from 'node:path';
import url from 'node:url';

const asciidoctor = asciidoctorNs();
console.log(`Asciidoctor.js ${asciidoctor.getVersion()}`);

kroki.register(asciidoctor.Extensions);

const options = {
    safe: 'safe',
    attributes: { linkcss: true },
    base_dir: 'extras/doc/entwicklerhandbuch',
    to_dir: 'html',
    mkdirs: true,
};
asciidoctor.convertFile(
    join('extras', 'doc', 'entwicklerhandbuch', 'entwicklerhandbuch.adoc'),
    options,
);
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
console.log(
    `HTML-Datei ${join(
        __dirname,
        '..',
        'extras',
        'doc',
        'entwicklerhandbuch',
        'html',
        'entwicklerhandbuch.html',
    )}`,
);