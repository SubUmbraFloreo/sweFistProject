import { type Schuh } from '../../schuh/entity/index.js';
import { ObjectID } from 'bson';

// eslint-disable-next-line @typescript-eslint/naming-convention
type SchuhIdVersion = Schuh & { _id: ObjectID; __v: number };

/* eslint-disable @typescript-eslint/naming-convention */
export const testdaten: SchuhIdVersion[] = [
    {
        _id: new ObjectID('000000000000000000000001'),
        marke: 'Nike',
        groesse: 43,
        modell: 'Jordan 4',
        farbe: 'Metallic Green',
        erscheinungsdatum: new Date('2004-07-24'),
        __v: 0,
    },
    {
        _id: new ObjectID('000000000000000000000002'),
        marke: 'Nike',
        groesse: 40,
        modell: 'AirForce 1',
        farbe: 'White',
        erscheinungsdatum: new Date('1982'),
        __v: 0,
    },
    {
        _id: new ObjectID('000000000000000000000003'),
        marke: 'Nike',
        groesse: 42,
        modell: 'AirForce 1',
        farbe: 'Nike x ACW White',
        erscheinungsdatum: new Date('2018-12-21'),
        __v: 0,
    },
    {
        _id: new ObjectID('000000000000000000000004'),
        marke: 'Adidas',
        groesse: 42,
        modell: 'Yeezy 350',
        farbe: 'Pirate Black',
        erscheinungsdatum: new Date('2015-08-22'),
        __v: 0,
    },
    {
        _id: new ObjectID('000000000000000000000005'),
        marke: 'New Balance',
        groesse: 43,
        modell: '550',
        farbe: 'White/Grey',
        erscheinungsdatum: new Date('2022-01-19'),
        __v: 0,
    },
    {
        _id: new ObjectID('000000000000000000000006'),
        marke: 'New Balance',
        groesse: 40,
        modell: '530',
        farbe: 'White',
        erscheinungsdatum: new Date('2021-07-26'),
        __v: 0,
    },
];
/* eslint-enable @typescript-eslint/naming-convention */
