import { describe, expect, test } from 'vitest';
import { area, asGeoJSON, geomFromGeoJSON, geomFromText } from './functions';
import { Kysely } from 'kysely';

declare global {
  const db: Kysely<any>;
}

describe('asGeoJSON', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => asGeoJSON(eb, 'geom').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_AsGeoJSON("geom") as "alias" from "test"',
    );
  });
});

describe('geomFromGeoJSON', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => geomFromGeoJSON(eb, 'geom').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_GeomFromGeoJSON("geom") as "alias" from "test"',
    );
  });

  test('String argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) =>
        geomFromGeoJSON(
          eb,
          eb.val('{"type":"Point", "coordinates": [125.6, 10.1]}'),
        ).as('alias'),
      );
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_GeomFromGeoJSON($1) as "alias" from "test"',
    );
    expect(compiled.parameters[0]).toBe(
      '{"type":"Point", "coordinates": [125.6, 10.1]}',
    );
  });

  test('GeoJSON argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) =>
        geomFromGeoJSON(eb, { type: 'Point', coordinates: [125.6, 10.1] }).as(
          'alias',
        ),
      );
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_GeomFromGeoJSON($1) as "alias" from "test"',
    );
    expect(compiled.parameters[0]).toBe(
      '{"type":"Point","coordinates":[125.6,10.1]}',
    );
  });

  test('Invalid GeoJSON argument', () => {
    expect(() =>
      // @ts-ignore
      db.selectFrom('test').select((eb) => geomFromGeoJSON(eb, {}).as('alias')),
    ).toThrowError('Invalid GeoJSON geometry');
  });

  test('Invalid GeoJSON string argument', () => {
    expect(() =>
      db
        .selectFrom('test')
        .select((eb) => geomFromGeoJSON(eb, eb.val('error')).as('alias')),
    ).toThrowError('Invalid GeoJSON geometry');
  });
});

describe('geomFromText', () => {
  test('WKT argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => geomFromText(eb, 'POINT(1, 1)').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_GeomFromText($1) as "alias" from "test"',
    );
    expect(compiled.parameters[0]).toBe('POINT(1, 1)');
  });

  test('Invalid WKT argument', () => {
    expect(() =>
      db
        .selectFrom('test')
        .select((eb) => geomFromText(eb, 'error').as('alias')),
    ).toThrowError('Invalid WKT');
  });
});

describe('area', () => {
  test('column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => area(eb, 'geom').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe('select ST_Area("geom") as "alias" from "test"');
  });

  test('GeoJSON argument', () => {
    const query = db.selectFrom('test').select((eb) =>
      area(eb, {
        type: 'Polygon',
        coordinates: [
          [
            [100.0, 0.0],
            [101.0, 0.0],
            [101.0, 1.0],
            [100.0, 1.0],
            [100.0, 0.0],
          ],
        ],
      }).as('alias'),
    );
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Area(ST_GeomFromGeoJSON($1)) as "alias" from "test"',
    );
    expect(compiled.parameters[0]).toBe(
      '{"type":"Polygon","coordinates":[[[100,0],[101,0],[101,1],[100,1],[100,0]]]}',
    );
  });

  test('GeoJSON string argument', () => {
    const query = db.selectFrom('test').select((eb) =>
      area(
        eb,
        eb.val(`{"type": "Polygon","coordinates": [
        [[100.0, 0.0],[101.0, 0.0],[101.0, 1.0],[100.0, 1.0],[100.0, 0.0]]
      ]}`),
      ).as('alias'),
    );
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Area(ST_GeomFromGeoJSON($1)) as "alias" from "test"',
    );
    expect(compiled.parameters[0]).toBe(
      `{"type": "Polygon","coordinates": [
        [[100.0, 0.0],[101.0, 0.0],[101.0, 1.0],[100.0, 1.0],[100.0, 0.0]]
      ]}`,
    );
  });
});
