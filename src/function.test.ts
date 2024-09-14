import { describe, expect, test } from 'vitest';
import { asGeoJSON } from './functions';
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

  test('WKT argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => asGeoJSON(eb, eb.val('POINT(1, 1)')).as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe('select ST_AsGeoJSON($1) as "alias" from "test"');
    expect(compiled.parameters[0]).toBe('POINT(1, 1)');
  });

  test('Invalid WKT argument', () => {
    expect(() =>
      db
        .selectFrom('test')
        .select((eb) => asGeoJSON(eb, eb.val('error')).as('alias')),
    ).toThrowError('Invalid WKT');
  });
});
