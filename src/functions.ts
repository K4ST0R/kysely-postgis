import { Geometry } from 'geojson';
import {
  ExpressionBuilder,
  ExpressionWrapper,
  ReferenceExpression,
  sql,
} from 'kysely';
import {
  isNil,
  valueForGeoJSON,
  valueForWKT,
  withDefaultOptions,
} from './utils';
import { Options } from './index';

interface OptionsAsGeoJSON extends Options {
  maxDecimalDigits?: number;
  options?: number;
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

  const geo = valueForWKT(column, optionsWithDefault);
  return eb.fn<string>('ST_AsGeoJSON', [
    geo,
    ...maxDecimalDigits,
    ...fnOptions,
  ]);
}

export function geomFromGeoJSON<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  value: Geometry | ReferenceExpression<DB, TB>,
  options: Partial<Options> = {},
): ExpressionWrapper<DB, TB, string> {
  const optionsWithDefault = withDefaultOptions(options);
  const geo = valueForGeoJSON(value, optionsWithDefault);
  return eb.fn<string>('ST_GeomFromGeoJSON', [geo]);
}
