import {
  GeometryCollection,
  Geometry,
  MultiPolygon,
  Point,
  Polygon,
} from 'geojson';
import { ExpressionBuilder, ReferenceExpression, sql } from 'kysely';
import {
  fnCompare,
  fnWithAdditionalParameters,
  isNil,
  transformGeoJSON,
  valueForGeoJSON,
  valueForWKT,
  withDefaultOptions,
} from './utils';
import { SRID } from './types';

export interface Options {
  validate: boolean;
  additionalParameters: any[]; // Pass these parameters to the ST function
}

export interface OptionsAsGeoJSON extends Options {
  maxDecimalDigits?: number;
  options?: number;
}

export function asGeoJSON<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  column: ReferenceExpression<DB, TB>,
  options: Partial<OptionsAsGeoJSON> = {},
) {
  const optionsWithDefault = withDefaultOptions(options);

  const fnOptions = isNil(options.options)
    ? []
    : [sql.val<number>(options.options)];
  const maxDecimalDigits =
    fnOptions.length > 0 || !isNil(options.maxDecimalDigits)
      ? [sql.val<number>(optionsWithDefault.maxDecimalDigits ?? 9)]
      : [];

  return fnWithAdditionalParameters(
    eb,
    'ST_AsGeoJSON',
    [column, ...maxDecimalDigits, ...fnOptions],
    optionsWithDefault,
  );
}

export interface OptionsFromGeoText extends Options {
  srid?: SRID;
}

export function geomFromGeoJSON<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  value: Geometry | ReferenceExpression<DB, TB>,
  options: Partial<Options> = {},
) {
  const optionsWithDefault = withDefaultOptions(options);
  const geo = valueForGeoJSON(value, optionsWithDefault);
  return fnWithAdditionalParameters(
    eb,
    'ST_GeomFromGeoJSON',
    [geo],
    optionsWithDefault,
  );
}

export function geomFromText<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  value: string,
  options: Partial<OptionsFromGeoText> = {},
) {
  const optionsWithDefault = withDefaultOptions(options);
  const geo = valueForWKT(value, optionsWithDefault);
  return fnWithAdditionalParameters(
    eb,
    'ST_GeomFromText',
    [
      geo,
      ...(isNil(optionsWithDefault.srid)
        ? []
        : [sql.val<number>(optionsWithDefault.srid)]),
    ],
    optionsWithDefault,
  );
}

export interface OptionsArea extends Options {
  useSpheroid?: boolean;
}

export function area<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  value: Polygon | MultiPolygon | ReferenceExpression<DB, TB>,
  options: Partial<OptionsArea> = {},
) {
  const optionsWithDefault = withDefaultOptions(options);

  return fnWithAdditionalParameters(
    eb,
    'ST_Area',
    [
      transformGeoJSON(eb, value, optionsWithDefault),
      ...(isNil(optionsWithDefault.useSpheroid)
        ? []
        : [sql.val<boolean>(optionsWithDefault.useSpheroid)]),
    ],
    optionsWithDefault,
  );
}

export function asText<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  column: ReferenceExpression<DB, TB>,
) {
  return eb.fn<string>('ST_AsText', [column]);
}

export function boundary<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  value: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
  options: Partial<Options> = {},
) {
  const optionsWithDefault = withDefaultOptions(options);

  return fnWithAdditionalParameters(
    eb,
    'ST_Boundary',
    [transformGeoJSON(eb, value, optionsWithDefault)],
    optionsWithDefault,
  );
}

export function buffer<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  value: Geometry | ReferenceExpression<DB, TB>,
  radius: number,
  options: Partial<Options> = {},
) {
  const optionsWithDefault = withDefaultOptions(options);

  return fnWithAdditionalParameters(
    eb,
    'ST_Buffer',
    [transformGeoJSON(eb, value, optionsWithDefault), sql.val<number>(radius)],
    optionsWithDefault,
  );
}

export function centroid<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  value: Geometry | ReferenceExpression<DB, TB>,
  options: Partial<Options> = {},
) {
  const optionsWithDefault = withDefaultOptions(options);

  return fnWithAdditionalParameters(
    eb,
    'ST_Centroid',
    [transformGeoJSON(eb, value, optionsWithDefault)],
    optionsWithDefault,
  );
}

export function contains<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  geomA: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
  geomB: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
  options: Partial<Options> = {},
) {
  return fnCompare(eb, 'ST_Contains', geomA, geomB, [], options);
}

export function covers<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  geomA: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
  geomB: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
  options: Partial<Options> = {},
) {
  return fnCompare(eb, 'ST_Covers', geomA, geomB, [], options);
}

export function crosses<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  geomA: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
  geomB: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
  options: Partial<Options> = {},
) {
  return fnCompare(eb, 'ST_Crosses', geomA, geomB, [], options);
}

export function dWithin<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  geomA: Geometry | ReferenceExpression<DB, TB>,
  geomB: Geometry | ReferenceExpression<DB, TB>,
  distance: number,
  options: Partial<Options> = {},
) {
  return fnCompare(
    eb,
    'ST_DWithin',
    geomA,
    geomB,
    [sql.val<number>(distance)],
    options,
  );
}

export function difference<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  geomA: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
  geomB: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
  options: Partial<Options> = {},
) {
  const optionsWithDefault = withDefaultOptions(options);

  return fnWithAdditionalParameters(
    eb,
    'ST_Difference',
    [
      transformGeoJSON(eb, geomA, optionsWithDefault),
      transformGeoJSON(eb, geomB, optionsWithDefault),
    ],
    optionsWithDefault,
  );
}

export function disjoint<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  geomA: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
  geomB: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
  options: Partial<Options> = {},
) {
  return fnCompare(eb, 'ST_Disjoint', geomA, geomB, [], options);
}

export function distance<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  geomA: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
  geomB: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
  options: Partial<Options> = {},
) {
  const optionsWithDefault = withDefaultOptions(options);

  return fnWithAdditionalParameters<DB, TB, number>(
    eb,
    'ST_Distance',
    [
      transformGeoJSON(eb, geomA, optionsWithDefault),
      transformGeoJSON(eb, geomB, optionsWithDefault),
    ],
    optionsWithDefault,
  );
}

export function distanceSphere<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  geomA: Point | ReferenceExpression<DB, TB>,
  geomB: Point | ReferenceExpression<DB, TB>,
  options: Partial<Options> = {},
) {
  const optionsWithDefault = withDefaultOptions(options);

  return fnWithAdditionalParameters<DB, TB, number>(
    eb,
    'ST_Distance_Sphere',
    [
      transformGeoJSON(eb, geomA, optionsWithDefault),
      transformGeoJSON(eb, geomB, optionsWithDefault),
    ],
    optionsWithDefault,
  );
}

export function equals<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  geomA: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
  geomB: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
  options: Partial<Options> = {},
) {
  return fnCompare(eb, 'ST_Equals', geomA, geomB, [], options);
}
