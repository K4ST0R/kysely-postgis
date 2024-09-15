# kysely-postgis

[![npm version](http://img.shields.io/npm/v/kysely-postgis.svg)](https://npmjs.org/package/kysely-postgis)
[![npm downloads](https://img.shields.io/npm/dm/kysely-postgis.svg)](https://npmjs.org/package/kysely-postgis)
[![License](https://img.shields.io/github/license/k4st0r/kysely-postgis)](https://github.com/k4st0r/kysely-postgis/blob/master/LICENSE)

Extension to use postgis functions with [kysely](https://kysely.dev/) more easely.

/!\ Early development

## Example

```ts
import { Database } from './types.ts'; // the Database interface
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { stf, setDefaultOptions } from 'kysely-postgis';

const dialect = new PostgresDialect({
  pool: new Pool(/* Pool configuration*/),
});
const db = new Kysely()<Database>({ dialect });

// By default, WKT and GeoJSON are validated
// Disable GeoJSON and WKT validation globally
// setDefaultOptions({
//   validate: false,
// });

// Returns a GeoJSON from geometry column
const query1 = db
  .selectFrom('table')
  .select((eb) => stf(eb).asGeoJSON('column').as('geojson'))
  .compile();
console.log(query1.sql);
//select ST_AsGeoJSON("column") as "geojson" from "table"

// Transform a GeoJSON Object to geometry
const query2 = db
  .selectFrom('table')
  .select((eb) =>
    stf(eb)
      .geomFromGeoJSON({
        type: 'Point',
        coordinates: [125.6, 10.1],
      })
      .as('geojson'),
  )
  .compile();
console.log(query2.sql, query2.parameters);
//select ST_GeomFromGeoJSON($1) as "geojson" from "table" [ '{"type":"Point","coordinates":[125.6,10.1]}' ]

// Transform a GeoJSON string to geometry
const query3 = db
  .selectFrom('table')
  .select((eb) =>
    stf(eb)
      .geomFromGeoJSON(eb.val(`{"type": "Point","coordinates": [125.6, 10.1]}`))
      .as('geojson'),
  )
  .compile();
console.log(query3.sql, query3.parameters);
//select ST_GeomFromGeoJSON($1) as "geojson" from "table" [ '{"type": "Point","coordinates": [125.6, 10.1]}' ]

// Transform a WKT string to geometry
const query4 = db
  .selectFrom('table')
  .select((eb) =>
    stf(eb)
      .geomFromText('POINT(1 2)'))
      .as('geom'),
  )
  .compile();
console.log(query4.sql, query4.parameters);
//select ST_GeomFromText($1) as "geom" from "table" [ 'POINT(1, 2)' ]

// You need to use eb.val() to pass a GeoJSON string or the string will be considerate like a column
const query5 = db
  .selectFrom('table')
  .select((eb) =>
    stf(eb)
      .area(eb.val(`{"type": "Polygon","coordinates": [
        [[100.0, 0.0],[101.0, 0.0],[101.0, 1.0],[100.0, 1.0],[100.0, 0.0]]
      ]}`))
      .as('geom'),
  )
  .compile();
console.log(query5.sql, query5.parameters);
//select ST_Area($1) as "geom" from "table" [ '{"type": "Polygon","coordinates": [[[100.0, 0.0],[101.0, 0.0],[101.0, 1.0],[100.0, 1.0][100.0, 0.0]]]}' ]

// You can pass any additional parameters to a ST function
// Be careful, theses parameters will simply be add at the end of the parameters
const query6 = db
  .selectFrom('table')
  .select((eb) =>
    stf(eb)
      .buffer('geom', 1, {
          additionalParameters: [eb.val('endcap=square join=round')],
        })
      .as('geom'),
  )
  .compile();
console.log(query6.sql, query6.parameters);
//select ST_Buffer("geom", $1, $2) as "geojson" from "etablissementIsochrone" [ 1, 'endcap=square join=round' ]
```

## Currently supported functions

- area(geo column | GeoJSON Polygon/MultiPolygon /_object, string_/, { useSpheroid? }), see [postgis documentation](https://postgis.net/docs/ST_Area.html)
- asGeoJSON(column, { maxDecimalDigits?, options? }), see [postgis documentation](https://postgis.net/docs/ST_AsGeoJSON.html)
- asText(geo column), see [postgis documentation](https://postgis.net/docs/ST_AsText.html)
- boundary(geo column | GeoJSON /_object, string_/), see [postgis documentation](https://postgis.net/docs/ST_Boundary.html)
- buffer(geo column | GeoJSON /_object, string_/, radius), see [postgis documentation](https://postgis.net/docs/ST_Buffer.html)
- centroid(geo column | GeoJSON /_object, string_/), see [postgis documentation](https://postgis.net/docs/ST_Centroid.html)
- geomFromGeoJSON(GeoJSON /_object, string or column name_/), see [postgis documentation](https://postgis.net/docs/ST_GeomFromGeoJSON.html)
- geomFromText(WKT string, { srid? }), see [postgis documentation](http://www.postgis.net/docs/ST_GeomFromText.html)
