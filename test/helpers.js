// @flow

import assert from 'assert'
import type { Validation, Type } from '../src/index'
import * as t from '../src/index'

export function assertValidationSuccess<T>(validation: Validation<T>): void {
  assert.ok(t.isSuccess(validation))
}

export function assertValidationFailure<T>(validation: Validation<T>, descriptions: Array<string>): void {
  assert.ok(t.isFailure(validation))
  const errors = t.fromFailure(validation)
  assert.deepEqual(errors.map(e => e.description), descriptions)
}

export const number2: Type<number> = {
  name: 'number2',
  validate: (v, c) => t.map(n => n * 2, t.number.validate(v, c))
}
