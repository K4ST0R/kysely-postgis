import { Geometry, MultiPolygon, Polygon } from 'geojson';
import {
  ExpressionBuilder,
  ExpressionWrapper,
  ReferenceExpression,
  sql,
} from 'kysely';
import {
  isGeoJSON,
  isNil,
  valueForGeoJSON,
  valueForWKT,
  withDefaultOptions,
} from './utils';
import { Options } from './index';
import { GeometryCollection } from 'wkx';

export type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>;

export type SRID = number;

export interface OptionsAsGeoJSON extends Options {
  maxDecimalDigits?: number;
  options?: number;
}

function fnWithAdditionalParameters<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  fnName: string,
  args: any[],
  options: Options,
) {
  return eb.fn<string>(fnName, [...args, ...options.additionalParameters]);
}

export function asGeoJSON<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  column: ReferenceExpression<DB, TB>,
  options: Partial<OptionsAsGeoJSON> = {},
): ExpressionWrapper<DB, TB, string> {
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

export function geomFromGeoJSON<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  value: Geometry | ReferenceExpression<DB, TB>,
  options: Partial<Options> = {},
): ExpressionWrapper<DB, TB, string> {
  const optionsWithDefault = withDefaultOptions(options);
  const geo = valueForGeoJSON(value, optionsWithDefault);
  return fnWithAdditionalParameters(
    eb,
    'ST_GeomFromGeoJSON',
    [geo],
    optionsWithDefault,
  );
}

export interface OptionsFromGeoText extends Options {
  srid?: SRID;
}

export function geomFromText<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  value: string,
  options: Partial<OptionsFromGeoText> = {},
): ExpressionWrapper<DB, TB, string> {
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
): ExpressionWrapper<DB, TB, string> {
  const optionsWithDefault = withDefaultOptions(options);
  const isGeo = isGeoJSON(value);

  return fnWithAdditionalParameters(
    eb,
    'ST_Area',
    [
      isGeo ? geomFromGeoJSON(eb, value, options) : value,
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
): ExpressionWrapper<DB, TB, string> {
  return eb.fn<string>('ST_AsText', [column]);
}

export function boundary<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  value: Exclude<Geometry, GeometryCollection> | ReferenceExpression<DB, TB>,
  options: Partial<Options> = {},
): ExpressionWrapper<DB, TB, string> {
  const optionsWithDefault = withDefaultOptions(options);
  const isGeo = isGeoJSON(value);

  return fnWithAdditionalParameters(
    eb,
    'ST_Boundary',
    [isGeo ? geomFromGeoJSON(eb, value, options) : value],
    optionsWithDefault,
  );
}

export function buffer<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  value: Geometry | ReferenceExpression<DB, TB>,
  radius: number,
  options: Partial<Options>,
): ExpressionWrapper<DB, TB, string> {
  const optionsWithDefault = withDefaultOptions(options);
  const isGeo = isGeoJSON(value);

  return fnWithAdditionalParameters(
    eb,
    'ST_Buffer',
    [
      isGeo ? geomFromGeoJSON(eb, value, options) : value,
      sql.val<number>(radius),
    ],
    optionsWithDefault,
  );
}

export function centroid<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  value: Geometry | ReferenceExpression<DB, TB>,
  options: Partial<Options> = {},
): ExpressionWrapper<DB, TB, string> {
  const optionsWithDefault = withDefaultOptions(options);
  const isGeo = isGeoJSON(value);

  return fnWithAdditionalParameters(
    eb,
    'ST_Centroid',
    [isGeo ? geomFromGeoJSON(eb, value, options) : value],
    optionsWithDefault,
  );
}
