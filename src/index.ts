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

type Tail<T extends any[]> = T extends [infer A, ...infer R] ? R : never;
type STParams<F extends (...args: any) => any> = Tail<Parameters<F>>;

// stf for spatial type functions
export function stf<DB, TB extends keyof DB>(eb: ExpressionBuilder<DB, TB>) {
  return {
    asGeoJSON: (...args: STParams<typeof asGeoJSON<DB, TB>>) =>
      asGeoJSON(eb, ...args),
    geomFromGeoJSON: (...args: STParams<typeof geomFromGeoJSON<DB, TB>>) =>
      geomFromGeoJSON(eb, ...args),
    geomFromText: (...args: STParams<typeof geomFromText<DB, TB>>) =>
      geomFromText(eb, ...args),
    area: (...args: STParams<typeof area<DB, TB>>) => area(eb, ...args),
    asText: (...args: STParams<typeof asText<DB, TB>>) => asText(eb, ...args),
    boundary: (...args: STParams<typeof boundary<DB, TB>>) =>
      boundary(eb, ...args),
    buffer: (...args: STParams<typeof buffer<DB, TB>>) => buffer(eb, ...args),
    centroid: (...args: STParams<typeof centroid<DB, TB>>) =>
      centroid(eb, ...args),
  };
}
