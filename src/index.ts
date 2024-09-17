'use strict';

import { ExpressionBuilder } from 'kysely';
import {
  area,
  asGeoJSON,
  asText,
  boundary,
  buffer,
  centroid,
  contains,
  covers,
  crosses,
  difference,
  disjoint,
  distance,
  distanceSphere,
  dWithin,
  equals,
  geomFromGeoJSON,
  geomFromText,
  Options,
} from './functions';
import { STParams } from './types';

export * from './functions';

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
    contains: (...args: STParams<typeof contains<DB, TB>>) =>
      contains(eb, ...args),
    covers: (...args: STParams<typeof covers<DB, TB>>) => covers(eb, ...args),
    crosses: (...args: STParams<typeof crosses<DB, TB>>) =>
      crosses(eb, ...args),
    dWithin: (...args: STParams<typeof dWithin<DB, TB>>) =>
      dWithin(eb, ...args),
    difference: (...args: STParams<typeof difference<DB, TB>>) =>
      difference(eb, ...args),
    disjoint: (...args: STParams<typeof disjoint<DB, TB>>) =>
      disjoint(eb, ...args),
    distance: (...args: STParams<typeof distance<DB, TB>>) =>
      distance(eb, ...args),
    distanceSphere: (...args: STParams<typeof distanceSphere<DB, TB>>) =>
      distanceSphere(eb, ...args),
    equals: (...args: STParams<typeof equals<DB, TB>>) => equals(eb, ...args),
  };
}
