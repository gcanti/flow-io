// @flow

import assert from 'assert'
import * as either from 'flow-static-land/lib/Either'
import type { ValidationResult } from '../src/index'

export function assertValidationSuccess<T>(validation: ValidationResult<T>): void {
  assert.ok(either.isRight(validation))
}

export function assertValidationFailure<T>(validation: ValidationResult<T>, descriptions: Array<string>): void {
  assert.ok(either.isLeft(validation))
  const errors = either.fromLeft(validation)
  assert.deepEqual(errors.map(e => e.description), descriptions)
}

