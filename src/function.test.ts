import { describe, expect, test } from 'vitest';
import { Kysely } from 'kysely';
import { stf } from '.';
import { Polygon } from 'geojson';
import {
  fnCompare,
  fnWithAdditionalParameters,
  transformGeoJSON,
} from './utils';

declare global {
  const db: Kysely<any>;
}

describe('fnCompare', () => {
  test('Column argument', () => {
    const query = db.selectFrom('test').select((eb) =>
      fnCompare(
        eb,
        'ST_FN',
        'geoma',
        'geomb',
        [eb.val('param1'), eb.val('param2')],
        {
          additionalParameters: [eb.val('param3')],
        },
      ).as('alias'),
    );
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_FN("geoma", "geomb", $1, $2, $3) as "alias" from "test"',
    );
    expect(compiled.parameters).toStrictEqual(['param1', 'param2', 'param3']);
  });

  test('GeoJSON argument', () => {
    const polygon: Polygon = {
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
    };
    const query = db
      .selectFrom('test')
      .select((eb) => fnCompare(eb, 'ST_FN', 'geo', polygon).as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_FN("geo", ST_GeomFromGeoJSON($1)) as "alias" from "test"',
    );
    expect(compiled.parameters).toStrictEqual([
      '{"type":"Polygon","coordinates":[[[100,0],[101,0],[101,1],[100,1],[100,0]]]}',
    ]);

    const query2 = db
      .selectFrom('test')
      .select((eb) => fnCompare(eb, 'ST_FN', polygon, 'geo').as('alias'));
    const compiled2 = query2.compile();
    expect(compiled2.sql).toBe(
      'select ST_FN(ST_GeomFromGeoJSON($1), "geo") as "alias" from "test"',
    );
    expect(compiled2.parameters).toStrictEqual([
      '{"type":"Polygon","coordinates":[[[100,0],[101,0],[101,1],[100,1],[100,0]]]}',
    ]);

    const query3 = db
      .selectFrom('test')
      .select((eb) => fnCompare(eb, 'ST_FN', polygon, polygon).as('alias'));
    const compiled3 = query3.compile();
    expect(compiled3.sql).toBe(
      'select ST_FN(ST_GeomFromGeoJSON($1), ST_GeomFromGeoJSON($2)) as "alias" from "test"',
    );
    expect(compiled3.parameters).toStrictEqual([
      '{"type":"Polygon","coordinates":[[[100,0],[101,0],[101,1],[100,1],[100,0]]]}',
      '{"type":"Polygon","coordinates":[[[100,0],[101,0],[101,1],[100,1],[100,0]]]}',
    ]);
  });

  test('GeoJSON string argument', () => {
    const polygon = `{"type": "Polygon","coordinates": [
[[100.0, 0.0],[101.0, 0.0],[101.0, 1.0],[100.0, 1.0],[100.0, 0.0]]
]}`;

    const query = db
      .selectFrom('test')
      .select((eb) =>
        fnCompare(eb, 'ST_FN', 'geo', eb.val(polygon)).as('alias'),
      );
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_FN("geo", ST_GeomFromGeoJSON($1)) as "alias" from "test"',
    );
    expect(compiled.parameters).toStrictEqual([
      `{"type": "Polygon","coordinates": [
[[100.0, 0.0],[101.0, 0.0],[101.0, 1.0],[100.0, 1.0],[100.0, 0.0]]
]}`,
    ]);

    const query2 = db
      .selectFrom('test')
      .select((eb) =>
        fnCompare(eb, 'ST_FN', eb.val(polygon), 'geo').as('alias'),
      );
    const compiled2 = query2.compile();
    expect(compiled2.sql).toBe(
      'select ST_FN(ST_GeomFromGeoJSON($1), "geo") as "alias" from "test"',
    );
    expect(compiled2.parameters).toStrictEqual([
      `{"type": "Polygon","coordinates": [
[[100.0, 0.0],[101.0, 0.0],[101.0, 1.0],[100.0, 1.0],[100.0, 0.0]]
]}`,
    ]);

    const query3 = db
      .selectFrom('test')
      .select((eb) =>
        fnCompare(eb, 'ST_FN', eb.val(polygon), eb.val(polygon)).as('alias'),
      );
    const compiled3 = query3.compile();
    expect(compiled3.sql).toBe(
      'select ST_FN(ST_GeomFromGeoJSON($1), ST_GeomFromGeoJSON($2)) as "alias" from "test"',
    );
    expect(compiled3.parameters).toStrictEqual([
      `{"type": "Polygon","coordinates": [
[[100.0, 0.0],[101.0, 0.0],[101.0, 1.0],[100.0, 1.0],[100.0, 0.0]]
]}`,
      `{"type": "Polygon","coordinates": [
[[100.0, 0.0],[101.0, 0.0],[101.0, 1.0],[100.0, 1.0],[100.0, 0.0]]
]}`,
    ]);
  });
});

describe('fnWithAdditionalParameters', () => {
  test('Column argument', () => {
    const query = db.selectFrom('test').select((eb) =>
      fnWithAdditionalParameters(eb, 'ST_FN', ['geoma', 'geomb'], {
        additionalParameters: [eb.val('param1')],
      }).as('alias'),
    );
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_FN("geoma", "geomb", $1) as "alias" from "test"',
    );
    expect(compiled.parameters).toStrictEqual(['param1']);
  });

  test('Value argument', () => {
    const query = db.selectFrom('test').select((eb) =>
      fnWithAdditionalParameters(
        eb,
        'ST_FN',
        [eb.val('param1'), eb.val('param2')],
        {
          additionalParameters: [eb.val('param3')],
        },
      ).as('alias'),
    );
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_FN($1, $2, $3) as "alias" from "test"',
    );
    expect(compiled.parameters).toStrictEqual(['param1', 'param2', 'param3']);
  });
});

describe('transformGeoJSON', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => eb.fn('FN', [transformGeoJSON(eb, 'geom')]).as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe('select FN("geom") as "alias" from "test"');
  });

  test('GeoJSON argument', () => {
    const polygon: Polygon = {
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
    };
    const query = db
      .selectFrom('test')
      .select((eb) => eb.fn('FN', [transformGeoJSON(eb, polygon)]).as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select FN(ST_GeomFromGeoJSON($1)) as "alias" from "test"',
    );
    expect(compiled.parameters).toStrictEqual([
      '{"type":"Polygon","coordinates":[[[100,0],[101,0],[101,1],[100,1],[100,0]]]}',
    ]);

    const query2 = db.selectFrom('test').select((eb) =>
      eb
        .fn('FN', [
          // @ts-ignore
          transformGeoJSON(eb, { type: 'invalid' }, { validate: false }),
        ])
        .as('alias'),
    );
    const compiled2 = query2.compile();
    expect(compiled2.sql).toBe(
      'select FN(ST_GeomFromGeoJSON($1)) as "alias" from "test"',
    );
    expect(compiled2.parameters).toStrictEqual(['{"type":"invalid"}']);
  });

  test('Invalid GeoJSON argument', () => {
    expect(() =>
      db.selectFrom('test').select((eb) =>
        eb
          .fn('FN', [
            // @ts-ignore
            transformGeoJSON(eb, { type: 'invalid' }),
          ])
          .as('alias'),
      ),
    ).toThrowError('Invalid GeoJSON geometry');

    expect(() =>
      db.selectFrom('test').select((eb) =>
        eb
          .fn('FN', [
            // @ts-ignore
            transformGeoJSON(eb, eb.val('invalid')),
          ])
          .as('alias'),
      ),
    ).toThrowError('Invalid GeoJSON geometry');
  });

  test('GeoJSON string argument', () => {
    const polygon = `{"type": "Polygon","coordinates": [
[[100.0, 0.0],[101.0, 0.0],[101.0, 1.0],[100.0, 1.0],[100.0, 0.0]]
]}`;

    const query = db
      .selectFrom('test')
      .select((eb) =>
        eb.fn('FN', [transformGeoJSON(eb, eb.val(polygon))]).as('alias'),
      );
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select FN(ST_GeomFromGeoJSON($1)) as "alias" from "test"',
    );
    expect(compiled.parameters).toStrictEqual([polygon]);

    const query2 = db.selectFrom('test').select((eb) =>
      eb
        .fn('FN', [
          // @ts-ignore
          transformGeoJSON(eb, eb.val('invalid'), { validate: false }),
        ])
        .as('alias'),
    );
    const compiled2 = query2.compile();
    expect(compiled2.sql).toBe(
      'select FN(ST_GeomFromGeoJSON($1)) as "alias" from "test"',
    );
    expect(compiled2.parameters).toStrictEqual(['invalid']);
  });
});

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

describe('contains', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).contains('geoma', 'geomb').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Contains("geoma", "geomb") as "alias" from "test"',
    );
  });
});

describe('covers', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).covers('geoma', 'geomb').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Covers("geoma", "geomb") as "alias" from "test"',
    );
  });
});

describe('crosses', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).crosses('geoma', 'geomb').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Crosses("geoma", "geomb") as "alias" from "test"',
    );
  });
});

describe('dWithin', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).dWithin('geoma', 'geomb', 10).as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_DWithin("geoma", "geomb", $1) as "alias" from "test"',
    );
    expect(compiled.parameters).toStrictEqual([10]);
  });
});

describe('difference', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).difference('geoma', 'geomb').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Difference("geoma", "geomb") as "alias" from "test"',
    );
  });
});

describe('disjoint', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).disjoint('geoma', 'geomb').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Disjoint("geoma", "geomb") as "alias" from "test"',
    );
  });
});

describe('distance', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).distance('geoma', 'geomb').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Distance("geoma", "geomb") as "alias" from "test"',
    );
  });
});

describe('distanceSphere', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).distanceSphere('geoma', 'geomb').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_DistanceSphere("geoma", "geomb") as "alias" from "test"',
    );
  });
});

describe('equals', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).equals('geoma', 'geomb').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Equals("geoma", "geomb") as "alias" from "test"',
    );
  });
});

describe('expand', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).expand('geoma', 1).as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Expand("geoma", $1) as "alias" from "test"',
    );
    expect(compiled.parameters).toStrictEqual([1]);
  });
});

describe('geoHash', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).geoHash('geoma').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_GeoHash("geoma") as "alias" from "test"',
    );
    expect(compiled.parameters).toStrictEqual([]);
  });
});

describe('intersection', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).intersection('geoma', 'geomb').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Intersection("geoma", "geomb") as "alias" from "test"',
    );
    expect(compiled.parameters).toStrictEqual([]);
  });
});

describe('intersects', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).intersects('geoma', 'geomb').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Intersects("geoma", "geomb") as "alias" from "test"',
    );
    expect(compiled.parameters).toStrictEqual([]);
  });
});

describe('intersects', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).intersects('geoma', 'geomb').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Intersects("geoma", "geomb") as "alias" from "test"',
    );
    expect(compiled.parameters).toStrictEqual([]);
  });
});

describe('isValid', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).isValid('geoma').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_IsValid("geoma") as "alias" from "test"',
    );
    expect(compiled.parameters).toStrictEqual([]);
  });
});

describe('makeValid', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).makeValid('geoma').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_MakeValid("geoma") as "alias" from "test"',
    );
    expect(compiled.parameters).toStrictEqual([]);
  });
});

describe('maxDistance', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).maxDistance('geoma', 'geomb').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_MaxDistance("geoma", "geomb") as "alias" from "test"',
    );
    expect(compiled.parameters).toStrictEqual([]);
  });
});

describe('overlaps', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).overlaps('geoma', 'geomb').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Overlaps("geoma", "geomb") as "alias" from "test"',
    );
    expect(compiled.parameters).toStrictEqual([]);
  });
});

describe('srid', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).srid('geoma').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe('select ST_SRID("geoma") as "alias" from "test"');
    expect(compiled.parameters).toStrictEqual([]);
  });
});

describe('scale', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).scale('geoma', 1, 2).as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Scale("geoma", $1, $2) as "alias" from "test"',
    );
    expect(compiled.parameters).toStrictEqual([1, 2]);
  });
});

describe('segmentize', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).segmentize('geoma', 1).as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Segmentize("geoma", $1) as "alias" from "test"',
    );
    expect(compiled.parameters).toStrictEqual([1]);
  });
});

describe('setSRID', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).setSRID('geoma', 1).as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_SetSRID("geoma", $1) as "alias" from "test"',
    );
    expect(compiled.parameters).toStrictEqual([1]);
  });
});

describe('simplify', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).simplify('geoma', 1).as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Simplify("geoma", $1) as "alias" from "test"',
    );
    expect(compiled.parameters).toStrictEqual([1]);
  });
});

describe('simplifyPreserveTopology', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).simplifyPreserveTopology('geoma', 1).as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_SimplifyPreserveTopology("geoma", $1) as "alias" from "test"',
    );
    expect(compiled.parameters).toStrictEqual([1]);
  });
});

describe('transform', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).transform('geoma', 1).as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Transform("geoma", 1::int) as "alias" from "test"',
    );
    expect(compiled.parameters).toStrictEqual([]);
  });
});

describe('translate', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).translate('geoma', 1, 2).as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Translate("geoma", $1, $2) as "alias" from "test"',
    );
    expect(compiled.parameters).toStrictEqual([1, 2]);
  });
});

describe('union', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).union('geoma', 'geomb').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Union("geoma", "geomb") as "alias" from "test"',
    );
    expect(compiled.parameters).toStrictEqual([]);
  });
});

describe('within', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).within('geoma', 'geomb').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe(
      'select ST_Within("geoma", "geomb") as "alias" from "test"',
    );
    expect(compiled.parameters).toStrictEqual([]);
  });
});

describe('x', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).x('geoma').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe('select ST_X("geoma") as "alias" from "test"');
    expect(compiled.parameters).toStrictEqual([]);
  });
});

describe('y', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).y('geoma').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe('select ST_Y("geoma") as "alias" from "test"');
    expect(compiled.parameters).toStrictEqual([]);
  });
});

describe('z', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).z('geoma').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe('select ST_Z("geoma") as "alias" from "test"');
    expect(compiled.parameters).toStrictEqual([]);
  });
});

describe('m', () => {
  test('Column argument', () => {
    const query = db
      .selectFrom('test')
      .select((eb) => stf(eb).m('geoma').as('alias'));
    const compiled = query.compile();
    expect(compiled.sql).toBe('select ST_M("geoma") as "alias" from "test"');
    expect(compiled.parameters).toStrictEqual([]);
  });
});
