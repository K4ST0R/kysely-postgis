import { describe, expect, test } from 'vitest';
import {
  area,
  asGeoJSON,
  asText,
  geomFromGeoJSON,
  geomFromText,
} from './functions';
import { Kysely } from 'kysely';
import { stf } from '.';

declare global {
  const db: Kysely<any>;
}

describe('asGeoJSON', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).asGeoJSON('geom').as('alias'));
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
      .select((eb) => stf(eb).geomFromGeoJSON('geom').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_GeomFromGeoJSON("geom") as "alias" from "test"',
    );
  });

  test('String argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) =>
        stf(eb)
          .geomFromGeoJSON(
            eb.val('{"type":"Point", "coordinates": [125.6, 10.1]}'),
          )
          .as('alias'),
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
    const query = db.selectFrom('test').select((eb) =>
      stf(eb)
        .geomFromGeoJSON({ type: 'Point', coordinates: [125.6, 10.1] })
        .as('alias'),
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
      db
        .selectFrom('test')
        // @ts-ignore
        .select((eb) => stf(eb).geomFromGeoJSON({}).as('alias')),
    ).toThrowError('Invalid GeoJSON geometry');
  });

  test('Invalid GeoJSON string argument', () => {
    expect(() =>
      db
        .selectFrom('test')
        .select((eb) => stf(eb).geomFromGeoJSON(eb.val('error')).as('alias')),
    ).toThrowError('Invalid GeoJSON geometry');
  });
});

describe('geomFromText', () => {
  test('WKT argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).geomFromText('POINT(1, 1)').as('alias'));
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
        .select((eb) => stf(eb).geomFromText('error').as('alias')),
    ).toThrowError('Invalid WKT');
  });
});

describe('area', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).area('geom').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe('select ST_Area("geom") as "alias" from "test"');
  });

  test('GeoJSON argument', () => {
    const query = db.selectFrom('test').select((eb) =>
      stf(eb)
        .area({
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
        })
        .as('alias'),
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
      stf(eb)
        .area(
          eb.val(`{"type": "Polygon","coordinates": [
        [[100.0, 0.0],[101.0, 0.0],[101.0, 1.0],[100.0, 1.0],[100.0, 0.0]]
      ]}`),
        )
        .as('alias'),
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

describe('asText', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).asText('geom').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_AsText("geom") as "alias" from "test"',
    );
  });

  test('Geometry string argument', () => {
    const query = db.selectFrom('test').select((eb) =>
      stf(eb)
        .asText(
          eb.val(
            `01030000000100000005000000000000000000000000000000000000000000000000000000000000000000` +
              `F03F000000000000F03F000000000000F03F000000000000F03F000000000000000000000000000000000000000000000000`,
          ),
        )
        .as('alias'),
    );
    const compiled = query.compile();
    expect(compiled.sql).toBe('select ST_AsText($1) as "alias" from "test"');
    expect(compiled.parameters[0]).toBe(
      `01030000000100000005000000000000000000000000000000000000000000000000000000000000000000` +
        `F03F000000000000F03F000000000000F03F000000000000F03F000000000000000000000000000000000000000000000000`,
    );
  });
});

describe('boundary', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).boundary('geom').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Boundary("geom") as "alias" from "test"',
    );
  });

  test('GeoJSON argument', () => {
    const query = db.selectFrom('test').select((eb) =>
      stf(eb)
        .boundary({
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
        })
        .as('alias'),
    );
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Boundary(ST_GeomFromGeoJSON($1)) as "alias" from "test"',
    );
    expect(compiled.parameters[0]).toBe(
      '{"type":"Polygon","coordinates":[[[100,0],[101,0],[101,1],[100,1],[100,0]]]}',
    );
  });

  test('GeoJSON string argument', () => {
    const query = db.selectFrom('test').select((eb) =>
      stf(eb)
        .boundary(
          eb.val(`{"type": "Polygon","coordinates": [
          [[100.0, 0.0],[101.0, 0.0],[101.0, 1.0],[100.0, 1.0],[100.0, 0.0]]
        ]}`),
        )
        .as('alias'),
    );
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Boundary(ST_GeomFromGeoJSON($1)) as "alias" from "test"',
    );
    expect(compiled.parameters[0]).toBe(
      `{"type": "Polygon","coordinates": [
          [[100.0, 0.0],[101.0, 0.0],[101.0, 1.0],[100.0, 1.0],[100.0, 0.0]]
        ]}`,
    );
  });
});

describe('buffer', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).buffer('geom', 1).as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Buffer("geom", $1) as "alias" from "test"',
    );
    expect(compiled.parameters[0]).toBe(1);
  });

  test('Column argument with optional parameters', () => {
    const query = db.selectFrom('test').select((eb) =>
      stf(eb)
        .buffer('geom', 1, {
          additionalParameters: [eb.val('endcap=square join=round')],
        })
        .as('alias'),
    );
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Buffer("geom", $1, $2) as "alias" from "test"',
    );
    expect(compiled.parameters[0]).toBe(1);
    expect(compiled.parameters[1]).toBe('endcap=square join=round');
  });

  test('GeoJSON argument', () => {
    const query = db.selectFrom('test').select((eb) =>
      stf(eb)
        .buffer(
          {
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
          },
          1,
        )
        .as('alias'),
    );
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Buffer(ST_GeomFromGeoJSON($1), $2) as "alias" from "test"',
    );
    expect(compiled.parameters[0]).toBe(
      '{"type":"Polygon","coordinates":[[[100,0],[101,0],[101,1],[100,1],[100,0]]]}',
    );
    expect(compiled.parameters[1]).toBe(1);
  });

  test('GeoJSON string argument', () => {
    const query = db.selectFrom('test').select((eb) =>
      stf(eb)
        .buffer(
          eb.val(`{"type": "Polygon","coordinates": [
            [[100.0, 0.0],[101.0, 0.0],[101.0, 1.0],[100.0, 1.0],[100.0, 0.0]]
          ]}`),
          1,
        )
        .as('alias'),
    );
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Buffer(ST_GeomFromGeoJSON($1), $2) as "alias" from "test"',
    );
    expect(compiled.parameters[0]).toBe(
      `{"type": "Polygon","coordinates": [
            [[100.0, 0.0],[101.0, 0.0],[101.0, 1.0],[100.0, 1.0],[100.0, 0.0]]
          ]}`,
    );
    expect(compiled.parameters[1]).toBe(1);
  });
});

describe('centroid', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).centroid('geom').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Centroid("geom") as "alias" from "test"',
    );
  });

  test('GeoJSON argument', () => {
    const query = db.selectFrom('test').select((eb) =>
      stf(eb)
        .centroid({
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
        })
        .as('alias'),
    );
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Centroid(ST_GeomFromGeoJSON($1)) as "alias" from "test"',
    );
    expect(compiled.parameters[0]).toBe(
      '{"type":"Polygon","coordinates":[[[100,0],[101,0],[101,1],[100,1],[100,0]]]}',
    );
  });

  test('GeoJSON string argument', () => {
    const query = db.selectFrom('test').select((eb) =>
      stf(eb)
        .centroid(
          eb.val(`{"type": "Polygon","coordinates": [
            [[100.0, 0.0],[101.0, 0.0],[101.0, 1.0],[100.0, 1.0],[100.0, 0.0]]
          ]}`),
        )
        .as('alias'),
    );
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Centroid(ST_GeomFromGeoJSON($1)) as "alias" from "test"',
    );
    expect(compiled.parameters[0]).toBe(
      `{"type": "Polygon","coordinates": [
            [[100.0, 0.0],[101.0, 0.0],[101.0, 1.0],[100.0, 1.0],[100.0, 0.0]]
          ]}`,
    );
  });
});
