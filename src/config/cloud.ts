import RE2 from 're2';
import { hostname } from 'node:os';

/**
 * _Union Type_ für die beiden Cloud-Varianten _Heroku_ und _OpenShift_.
 */
export type Cloud = 'heroku' | 'openshift';

// https://github.com/google/re2
// https://github.com/uhop/node-re2
const herokuRegexp = new RE2(
    '[\\dA-Fa-f]{8}-[\\dA-Fa-f]{4}-[\\dA-Fa-f]{4}-[\\dA-Fa-f]{4}-[\\dA-Fa-f]{12}',
    'u',
);
const computername = hostname();

/**
 * Information, ob die Anwendung überhaupt in einer Cloud läuft, und ggf. ob es
 * sich um _Heroku_ oder _OpenShift_ handelt.
 * Der Rechnername ist bei
 * - Heroku:    eine UUID
 * - OpenShift: <Projektname_aus_package.json>-\<Build-Nr>-\<random-alphanumeric-5stellig>
 */
export let cloud: Cloud | undefined;

if (herokuRegexp.test(computername)) {
    cloud = 'heroku';
} else {
    const openshiftRegexp = new RE2('beispiel-\\d+-w{5}', 'u');
    if (openshiftRegexp.test(computername)) {
        cloud = 'openshift';
    }
}

console.info('cloud: %s', cloud);
