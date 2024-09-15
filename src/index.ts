'use strict';

import { ExpressionBuilder, ReferenceExpression } from 'kysely';
import {
  area,
  asGeoJSON,
  geomFromGeoJSON,
  geomFromText,
  OptionsArea,
  OptionsAsGeoJSON,
  OptionsFromGeoText,
} from './functions';
import { Geometry, MultiPolygon, Polygon } from 'geojson';

export * from './functions';

export interface Options {
  validate: boolean;
}

// Global options
export let defaultOptions: Options = {
  validate: true,
};

export function setDefaultOptions(options: Partial<Options>) {
  defaultOptions = {
    ...defaultOptions,
    ...options,
  };
}

// stf for spatial type functions
export function stf<DB, TB extends keyof DB>(eb: ExpressionBuilder<DB, TB>) {
  return {
    asGeoJSON: (
      column: ReferenceExpression<DB, TB>,
      options: Partial<OptionsAsGeoJSON> = {},
    ) => asGeoJSON(eb, column, options),
    geomFromGeoJSON: (
      value: Geometry | ReferenceExpression<DB, TB>,
      options: Partial<Options> = {},
    ) => geomFromGeoJSON(eb, value, options),
    geomFromText: (value: string, options: Partial<OptionsFromGeoText> = {}) =>
      geomFromText(eb, value, options),
    area: (
      value: Polygon | MultiPolygon | ReferenceExpression<DB, TB>,
      options: Partial<OptionsArea> = {},
    ) => area(eb, value, options),
  };
}
