/**
 * Klasse für fehlerhafte Schuhdaten
 */
export interface ConstraintViolations {
    readonly type: 'ConstraintViolations';
    readonly messages: string[];
}

/**
 * Klasse für Fehler beim Neuanlegen eines Schuhs
 * - {@linkcode ConstrainsViolations}
 */
export type CreateError = ConstraintViolations

/**
 * Klasse für eineungültige Versionsnummer beim Ändern
 */
export interface VersionInvalid {
    readonly type: 'VersionInvalid';
    readonly version: string | undefined;
}

/**
 * Klasse für eine veraltete Versionsnummer beim Ändern
 */
export interface VersionOutdated {
    readonly type: 'VersionOutdated';
    readonly id: string;
    readonly version: number;
}

/**
 * Klasser für nicht vorhandenen Schuh
 */
export interface SchuhNotExists {
    readonly type: 'SchuhNotExists';
    readonly id: string | undefined;
}

/**
 * Union-Type für Fehler beim Ändern eines Schuhs
 * - {@linkcode SchuhNotExists}
 * - {@linkcode ConstraintViolations}
 * - {@linkcode VersionInvalid}
 * - {@linkcode VersionOutdated}
 */
export type UpdateError =
    | SchuhNotExists
    | ConstraintViolations
    | VersionInvalid
    | VersionOutdated;

/**
 * Klasse für eine nicht vorhandene binäre Datei
 */
export interface FileNotFound {
    readonly type: 'FileNotFound';
    readonly filename: string;
}

/** 
 * Klasse für den Fall, dass es mehrere binäre Dateien zu einem Schuh gibt
 */
export interface MultipleFiles {
    readonly type: 'MultipleFiles';
    readonly filename: string;
}

/**
 * Klasse für den Fall, dass der ContentType nicht stimmt
 */
export interface InvalidContentType {
    readonly type: 'InvalidContentType';
}

/**
 * Union-Type für Fehler beim Lesen einer binäre Datei zu einem Schuh
 * - {@linkcode SchuhNotExists}
 * - {@linkcode FileNotFound}
 * - {@linkcode InvalidContentType}
 * - {@linkcode MultipleFiles}
 */
export type FileFindError =
    | SchuhNotExists
    | FileNotFound
    | InvalidContentType
    | MultipleFiles;