import { describe, expect, test } from 'vitest';
import { asGeoJSON, geomFromGeoJSON, geomFromText } from './functions';
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
