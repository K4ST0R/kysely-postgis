import {
  ExpressionWrapper,
  RawBuilder,
  ReferenceExpression,
  sql,
  ValueNode,
} from 'kysely';
import * as wkx from 'wkx';
import { isGeometryObject as isGeometryObjectValidator } from 'geojson-validation';
import { Geometry } from 'geojson';
import { defaultOptions, Options } from './index';

export function withDefaultOptions<T>(options: T) {
  return Object.assign({}, defaultOptions, options);
}

export function isNil<T>(
  value: T | null | undefined,
): value is null | undefined {
  return value === null || value === undefined;
}

export function isString(obj: unknown): obj is string {
  return typeof obj === 'string';
}

export function isRawBuilder(value: any): value is RawBuilder<unknown> {
  return value?.isRawBuilder ?? false;
}

export function isExpressionWrapper(value: any) {
  return value instanceof ExpressionWrapper;
}

export function throwOnInvalidGeometry(value: any) {
  try {
    const isValid = isString(value)
      ? isGeometryObjectValidator(JSON.parse(value), true)
      : isGeometryObjectValidator(value, true);
    if (isValid.length > 0) {
      throw new Error('Invalid GeoJSON geometry', { cause: isValid });
    }
  } catch (err) {
    throw new Error('Invalid GeoJSON geometry', { cause: err });
  }
}

export function throwOnInvalidWKT(value: any) {
  try {
    const geometry = wkx.Geometry.parse(value);
    if (!geometry) {
      throw new Error('Invalid WKT');
    }
  } catch (err) {
    throw new Error('Invalid WKT', { cause: err });
  }
}

export function isGeoJSON<DB, TB extends keyof DB>(
  value: Geometry | ReferenceExpression<DB, TB>,
  options: Partial<Options> = {},
): value is Geometry {
  const optionsWithDefault = withDefaultOptions(options);
  if (isString(value) || isRawBuilder(value)) {
    return false;
  }

  if (isExpressionWrapper(value)) {
    const node = value.toOperationNode();
    if (ValueNode.is(node)) {
      optionsWithDefault.validate && throwOnInvalidGeometry(node.value);
      return true;
    }
    return false;
  }

  optionsWithDefault.validate && throwOnInvalidGeometry(value);
  return true;
}

export function valueForGeoJSON<DB, TB extends keyof DB>(
  value: Geometry | ReferenceExpression<DB, TB>,
  options: Partial<Options> = {},
) {
  const optionsWithDefault = withDefaultOptions(options);
  if (isString(value) || isRawBuilder(value)) {
    return value;
  }

  if (isExpressionWrapper(value)) {
    const node = value.toOperationNode();
    if (ValueNode.is(node)) {
      optionsWithDefault.validate && throwOnInvalidGeometry(node.value);
    }
    return value;
  }

  optionsWithDefault.validate && throwOnInvalidGeometry(value);
  return sql.val(JSON.stringify(value));
}

export function valueForWKT<DB, TB extends keyof DB>(
  value: string,
  options: Partial<Options> = {},
) {
  const optionsWithDefault = withDefaultOptions(options);
  optionsWithDefault.validate && throwOnInvalidWKT(value);
  return sql.val(value);
}
