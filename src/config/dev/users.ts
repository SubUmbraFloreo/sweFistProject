import { type User } from '../../security/auth/service/user.service.js';
import { env } from '../env.js';

const { password } = env.authConfigEnv;

/**
 * Ein JSON-Array der Benutzerdaten mit den vorhandenen Rollen.
 * Nicht Set, weil es dafür keine Suchfunktion gibt.
 */
export const users: User[] = [
    {
        userId: 1,
        username: 'admin',
        password,
        email: 'admin@acme.com',
        roles: ['admin', 'mitarbeiter'],
    },
    {
        userId: 2,
        username: 'anton.adam',
        password,
        email: 'anton.adam@acme.com',
        roles: ['admin', 'mitarbeiter'],
    },
    {
        userId: 3,
        username: 'ben.bahns',
        password,
        email: 'ben.bahns@acme.com',
        roles: ['mitarbeiter'],
    },
    {
        userId: 4,
        username: 'carla.concella',
        password,
        email: 'carla.conclella@acme.com',
        roles: ['mitarbeiter'],
    },
    {
        userId: 5,
        username: 'daniel.ducken',
        password,
        email: 'daniel.ducken@acme.com',
        roles: ['kunde'],
    },
    {
        userId: 6,
        username: 'emilia.epsilon',
        password,
        email: 'emilia.epsilon@acme.com',
        roles: ['kunde'],
    },
];
