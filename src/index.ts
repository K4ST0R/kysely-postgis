'use strict';

import { ExpressionBuilder, ReferenceExpression } from 'kysely';
import {
  area,
  asGeoJSON,
  asText,
  boundary,
  buffer,
  centroid,
  geomFromGeoJSON,
  geomFromText,
  OptionsArea,
  OptionsAsGeoJSON,
  OptionsFromGeoText,
} from './functions';
import { Geometry, GeometryCollection, MultiPolygon, Polygon } from 'geojson';

export * from './functions';

export interface Options {
  validate: boolean;
  additionalParameters: any[]; // Pass these parameters to the ST function
}

// Global options
export let defaultOptions: Options = {
  validate: true,
  additionalParameters: [],
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
    asText: (value: ReferenceExpression<DB, TB>) => asText(eb, value),
    boundary: (
      value:
        | Exclude<Geometry, GeometryCollection>
        | ReferenceExpression<DB, TB>,
      options: Partial<Options> = {},
    ) => boundary(eb, value, options),
    buffer: (
      value: Geometry | ReferenceExpression<DB, TB>,
      radius: number,
      options: Partial<Options> = {},
    ) => buffer(eb, value, radius, options),
    centroid: (
      value: Geometry | ReferenceExpression<DB, TB>,
      options: Partial<Options> = {},
    ) => centroid(eb, value, options),
  };
}
