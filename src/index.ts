'use strict';

import { ExpressionBuilder, ReferenceExpression } from 'kysely';
import { asGeoJSON, geomFromGeoJSON, geomFromText } from './functions';
import { Geometry } from 'geojson';

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
    asGeoJSON: (column: ReferenceExpression<DB, TB>) => asGeoJSON(eb, column),
    geomFromGeoJSON: (value: Geometry | ReferenceExpression<DB, TB>) =>
      geomFromGeoJSON(eb, value),
    geomFromText: (value: string) => geomFromText(eb, value),
  };
}
