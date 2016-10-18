// @flow

import assert from 'assert'
import type { ValidationResult } from '../src/index'
import * as t from '../src/index'

export function assertValidationSuccess<T>(validation: ValidationResult<T>): void {
  assert.ok(t.isSuccess(validation))
}

export function assertValidationFailure<T>(validation: ValidationResult<T>, descriptions: Array<string>): void {
  assert.ok(t.isFailure(validation))
  const errors = t.fromFailure(validation)
  assert.deepEqual(errors.map(e => e.description), descriptions)
}

