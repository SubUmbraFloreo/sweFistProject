const asciidoctor = require('asciidoctor')();

const kroki = require('asciidoctor-kroki');
const { join } = require('path');

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
